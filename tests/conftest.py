import os

# Keep imports independent of developer secrets. Integration tests override get_db.
os.environ["DEBUG"] = "false"
os.environ.setdefault("DATABASE_URL", os.environ.get(
    "TEST_DATABASE_URL", "postgresql+asyncpg://unused:unused@127.0.0.1/unused",
))
os.environ.setdefault("JWT_SECRET_KEY", "test-only-secret-" + "x" * 32)
