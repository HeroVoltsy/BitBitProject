from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4
from typing import Annotated

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    UploadFile,
    status,
)
from fastapi.responses import FileResponse
from sqlalchemy import select

from src.api.deps import get_current_user
from src.core.config import get_settings
from src.db.session import DbSession
from src.models.kyc import KYCSubmission
from src.models.user import User
from src.schemas.kyc import KYCReview, KYCStatus, KYCSubmit
from src.services.kyc_service import (
    KYCEncryptionNotConfigured,
    encrypt_id_number,
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
        )
    )
    submission = result.scalar_one_or_none()

    if submission and submission.status not in {
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
        "status": "pending",
        "review_note": None,
        "reviewed_by": None,
        "reviewed_at": None,
    }

    previous_files = []

    if submission:
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

    await db.commit()
    await db.refresh(submission)

    for old_file in previous_files:
        if old_file:
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

    content = await file.read(5 * 1024 * 1024 + 1)

    if not content or len(content) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail="File must be between 1 byte and 5 MB",
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
        )
    )
    submission = result.scalar_one_or_none()

    if not submission:
        raise HTTPException(
            status_code=404,
            detail="Submit the KYC form before uploading documents",
        )

    if submission.status == "approved":
        raise HTTPException(
            status_code=409,
            detail="Approved KYC submissions cannot be changed",
        )

    suffix = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "application/pdf": ".pdf",
    }[file.content_type]

    base_dir = Path(get_settings().KYC_UPLOAD_DIR).resolve()
    user_dir = base_dir / str(current_user.id)
    user_dir.mkdir(parents=True, exist_ok=True, mode=0o700)
    user_dir.chmod(0o700)

    destination = user_dir / f"{kind}_{uuid4().hex}{suffix}"
    destination.write_bytes(content)
    destination.chmod(0o600)

    field_name = allowed_kinds[kind]
    old_path = getattr(submission, field_name)

    setattr(submission, field_name, str(destination))

    await db.commit()

    if old_path:
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

    if not path_value or not Path(path_value).is_file():
        raise HTTPException(
            status_code=404,
            detail="Document not found",
        )

    return FileResponse(
        path_value,
        filename=Path(path_value).name,
    )
