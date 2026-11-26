from datetime import datetime, timezone
from pathlib import Path
from typing import Annotated

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    UploadFile,
    status,
)
from fastapi.responses import FileResponse, Response
from sqlalchemy import select, delete
from sqlalchemy.exc import IntegrityError

from src.api.deps import get_current_user
from src.db.session import DbSession
from src.models.kyc import KYCSubmission, KYCDocument
from src.models.user import User
from src.schemas.kyc import KYCReview, KYCStatus, KYCSubmit
from src.services.kyc_service import (
    KYCEncryptionNotConfigured,
    encrypt_id_number,
    encrypt_document,
    decrypt_document,
)

router = APIRouter(prefix="/api/v1/kyc", tags=["KYC"])


def require_admin(user: User) -> None:
    if user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Administrator access required",
        )


@router.post(
    "/submit",
    response_model=KYCStatus,
    status_code=status.HTTP_201_CREATED,
)
async def submit_kyc(
    data: KYCSubmit,
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
):
    try:
        encrypted_number = encrypt_id_number(data.id_number)
    except KYCEncryptionNotConfigured:
        raise HTTPException(
            status_code=503,
            detail="KYC encryption is not configured",
        ) from None

    result = await db.execute(
        select(KYCSubmission).where(
            KYCSubmission.user_id == current_user.id
        ).with_for_update()
    )
    submission = result.scalar_one_or_none()

    if submission and submission.status not in {
        "draft",
        "rejected",
        "resubmission_required",
    }:
        raise HTTPException(
            status_code=409,
            detail="A KYC submission is already pending or approved",
        )

    values = {
        "legal_name": data.legal_name.strip(),
        "date_of_birth": data.date_of_birth,
        "address": data.address.strip(),
        "id_type": data.id_type.strip(),
        "id_number_encrypted": encrypted_number,
        "document_front_path": None,
        "document_back_path": None,
        "selfie_path": None,
        "personal_details": data.personal_details.model_dump() if data.personal_details else None,
        "status": "draft" if data.defer_review else "pending",
        "review_note": None,
        "reviewed_by": None,
        "reviewed_at": None,
    }

    previous_files = []

    if submission:
        await db.execute(delete(KYCDocument).where(KYCDocument.submission_id == submission.id))
        previous_files = [
            submission.document_front_path,
            submission.document_back_path,
            submission.selfie_path,
        ]

        for key, value in values.items():
            setattr(submission, key, value)
    else:
        submission = KYCSubmission(
            user_id=current_user.id,
            **values,
        )
        db.add(submission)

    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="A submission already exists. Refresh your verification status.") from None
    await db.refresh(submission)

    for old_file in previous_files:
        if old_file and not old_file.startswith("db:"):
            try:
                Path(old_file).unlink(missing_ok=True)
            except OSError:
                pass

    return submission


@router.get("/me", response_model=KYCStatus)
async def get_my_kyc(
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
):
    result = await db.execute(
        select(KYCSubmission).where(
            KYCSubmission.user_id == current_user.id
        )
    )
    submission = result.scalar_one_or_none()

    if not submission:
        raise HTTPException(
            status_code=404,
            detail="No KYC submission found",
        )

    return submission


@router.get("/admin/{user_id}", response_model=KYCStatus)
async def get_user_kyc(
    user_id: int,
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
):
    require_admin(current_user)

    result = await db.execute(
        select(KYCSubmission).where(
            KYCSubmission.user_id == user_id
        )
    )
    submission = result.scalar_one_or_none()

    if not submission:
        raise HTTPException(
            status_code=404,
            detail="KYC submission not found",
        )

    return submission


@router.patch(
    "/admin/{user_id}/review",
    response_model=KYCStatus,
)
async def review_kyc(
    user_id: int,
    data: KYCReview,
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
):
    require_admin(current_user)

    result = await db.execute(
        select(KYCSubmission)
        .where(KYCSubmission.user_id == user_id)
        .with_for_update()
    )
    submission = result.scalar_one_or_none()

    if not submission:
        raise HTTPException(
            status_code=404,
            detail="KYC submission not found",
        )

    if submission.status != "pending":
        raise HTTPException(
            status_code=409,
            detail="Only pending submissions can be reviewed",
        )

    required = {"front", "selfie"} if submission.id_type == "Passport" else {"front", "back", "selfie"}
    if data.status == "approved" and not required.issubset(submission.documents):
        raise HTTPException(status_code=422, detail="Required identity documents are missing")

    submission.status = data.status
    submission.review_note = data.review_note
    submission.reviewed_by = current_user.id
    submission.reviewed_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(submission)

    return submission


@router.post("/documents/{kind}")
async def upload_kyc_document(
    kind: str,
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
    file: UploadFile = File(...),
):
    allowed_kinds = {
        "front": "document_front_path",
        "back": "document_back_path",
        "selfie": "selfie_path",
    }

    if kind not in allowed_kinds:
        raise HTTPException(
            status_code=422,
            detail="kind must be front, back, or selfie",
        )

    if file.content_type not in {
        "image/jpeg",
        "image/png",
        "application/pdf",
    }:
        raise HTTPException(
            status_code=415,
            detail="Only JPEG, PNG, or PDF files are accepted",
        )

    content = await file.read(4 * 1024 * 1024 + 1)

    if not content or len(content) > 4 * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail="File must be between 1 byte and 4 MB",
        )

    valid_signature = (
        (
            file.content_type == "image/jpeg"
            and content.startswith(b"\xff\xd8\xff")
        )
        or (
            file.content_type == "image/png"
            and content.startswith(b"\x89PNG\r\n\x1a\n")
        )
        or (
            file.content_type == "application/pdf"
            and content.startswith(b"%PDF-")
        )
    )

    if not valid_signature:
        raise HTTPException(
            status_code=415,
            detail="File content does not match its declared type",
        )

    result = await db.execute(
        select(KYCSubmission).where(
            KYCSubmission.user_id == current_user.id
        ).with_for_update()
    )
    submission = result.scalar_one_or_none()

    if not submission:
        raise HTTPException(
            status_code=404,
            detail="Submit the KYC form before uploading documents",
        )

    if submission.status not in {"draft", "pending"}:
        raise HTTPException(
            status_code=409,
            detail="Only draft or pending KYC documents can be changed",
        )

    try:
        encrypted = encrypt_document(content)
    except KYCEncryptionNotConfigured:
        raise HTTPException(status_code=503, detail="KYC encryption is not configured") from None

    document = (await db.execute(select(KYCDocument).where(
        KYCDocument.submission_id == submission.id, KYCDocument.kind == kind,
    ))).scalar_one_or_none()
    if document is None:
        document = KYCDocument(submission_id=submission.id, kind=kind)
        db.add(document)
    document.content_type = file.content_type
    document.encrypted_content = encrypted
    field_name = allowed_kinds[kind]
    old_path = getattr(submission, field_name)
    setattr(submission, field_name, "db:" + kind)
    await db.commit()
    if old_path and not old_path.startswith("db:"):
        try:
            Path(old_path).unlink(missing_ok=True)
        except OSError:
            pass

    return {
        "message": "Document uploaded",
        "kind": kind,
    }


@router.get("/admin/{user_id}/documents/{kind}")
async def download_kyc_document(
    user_id: int,
    kind: str,
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
):
    require_admin(current_user)

    fields = {
        "front": "document_front_path",
        "back": "document_back_path",
        "selfie": "selfie_path",
    }

    if kind not in fields:
        raise HTTPException(
            status_code=404,
            detail="Document not found",
        )

    result = await db.execute(
        select(KYCSubmission).where(
            KYCSubmission.user_id == user_id
        )
    )
    submission = result.scalar_one_or_none()

    path_value = (
        getattr(submission, fields[kind], None)
        if submission
        else None
    )

    if path_value and path_value.startswith("db:"):
        document = (await db.execute(select(KYCDocument).where(
            KYCDocument.submission_id == submission.id, KYCDocument.kind == kind,
        ))).scalar_one_or_none()
        if document:
            try:
                decrypted = decrypt_document(document.encrypted_content)
            except KYCEncryptionNotConfigured:
                raise HTTPException(status_code=503, detail="KYC document cannot be decrypted") from None
            return Response(decrypted, media_type=document.content_type, headers={
                "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff",
                "Content-Disposition": 'attachment; filename="' + kind + '"',
            })

    if not path_value or not Path(path_value).is_file():
        raise HTTPException(
            status_code=404,
            detail="Document not found",
        )

    return FileResponse(
        path_value,
        filename=Path(path_value).name,
        headers={"Cache-Control": "no-store", "X-Content-Type-Options": "nosniff"},
    )


@router.post("/complete", response_model=KYCStatus)
async def complete_kyc(
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
):
    submission = (await db.execute(select(KYCSubmission).where(
        KYCSubmission.user_id == current_user.id,
    ).with_for_update())).scalar_one_or_none()
    if submission is None:
        raise HTTPException(status_code=404, detail="No KYC submission found")
    if submission.status == "pending":
        return submission
    if submission.status != "draft":
        raise HTTPException(status_code=409, detail="Only draft submissions can be completed")
    required = {"front", "selfie"} if submission.id_type == "Passport" else {"front", "back", "selfie"}
    if not required.issubset(submission.documents):
        raise HTTPException(status_code=422, detail="Upload all required documents before submitting")
    submission.status = "pending"
    await db.commit()
    await db.refresh(submission)
    return submission
