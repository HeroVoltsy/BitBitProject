# Backend setup

Run these commands in PowerShell from the repository root. PostgreSQL must be
running, with a database and login owned by your local developer account.

```powershell
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
# Only if you do not already have .env:
Copy-Item .env.example .env
```

Edit `.env`: set your own database URL and a random `JWT_SECRET_KEY`. Generate
a JWT secret with `python -c "import secrets; print(secrets.token_hex(32))"`.
Then run:

```powershell
.\.venv\Scripts\python.exe scripts/configure_kyc.py
.\.venv\Scripts\python.exe -m alembic upgrade head
.\.venv\Scripts\python.exe -m uvicorn src.main:app --host 127.0.0.1 --port 8000
```

The key helper creates `KYC_ENCRYPTION_KEY` in your ignored `.env` without
printing it, and preserves an existing valid key. Back up that key privately:
changing or losing it prevents decryption of stored ID numbers. Missing or invalid
keys return HTTP 503 from KYC submission instead of a server crash.
`KYC_UPLOAD_DIR` defaults to the ignored `var/kyc` directory.

Each developer with a separate local database can generate their own key.
Everyone connecting to the same database must use the same stable encryption
key, supplied through private environment configuration. Do not commit `.env`,
keys, or uploaded documents.

## Administrator access

The migration adds an internal `users.role` column. Existing accounts and public
registrations default to `user`. This permission is separate from the frontend's
Joiner/Host selection. Neither signup nor a request token can grant admin access.
A trusted database owner can promote a previously registered account in psql:

```sql
UPDATE users SET role = 'admin'
WHERE email = 'replace-with-your-admin-email@example.com'
RETURNING id, email, role;
```

Verify the email and returned account before using it for reviews. Set the role
back to `user` to revoke access. Regular users receive HTTP 403 from KYC admin
routes and the existing admin-only QR endpoints.

## Test KYC through Swagger

Open `http://127.0.0.1:8000/docs`. Register a disposable account, then log in.
Click **Authorize** and paste only the returned `access_token`, without quotes
or the `Bearer` prefix. Tokens expire after 15 minutes.

1. `POST /api/v1/kyc/submit` with fictitious details should return 201, `pending`.
2. Upload front, back, and selfie using `/api/v1/kyc/documents/{kind}`. Supported
   files: JPEG, PNG, PDF, up to 5 MB each.
3. `GET /api/v1/kyc/me` should return the saved pending submission. A repeated
   submission while pending returns 409.
4. A regular account must get 403 from `/api/v1/kyc/admin/{user_id}`.
5. Log in as the promoted admin, authorize again, view the submission/documents,
   and use `/api/v1/kyc/admin/{user_id}/review`. The user can then read the updated
   status through `/me`.

These are backend API tests. The frontend verification form still needs API
integration; this fix does not connect it or create an admin web page.

## Automated tests

```powershell
.\.venv\Scripts\python.exe -m pytest -q
```

Database tests are skipped unless `TEST_DATABASE_URL` contains an asyncpg
PostgreSQL URL. They create and remove a randomly named schema in that database,
apply real migrations there, and leave existing application tables untouched.
The database login needs permission to create schemas. Run against a local test
database. Tests cover existing-account migration, authentication, encrypted
submission, document uploads, access control, and admin review.

## Sharing and deployment

Merge the fix, then each developer pulls it, installs requirements, configures
their local key, and runs `alembic upgrade head` before restarting the API.

For a shared deployment, configure a hosted PostgreSQL URL and stable secrets
privately in the hosting environment, then apply migrations to that database.
The current document handler stores files on the local filesystem: it needs
private persistent storage. A Vercel deployment needs a storage integration
before it can retain KYC uploads reliably; a temporary directory is insufficient.
