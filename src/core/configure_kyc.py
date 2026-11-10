"""Create a local KYC encryption key without printing or replacing secrets."""

from pathlib import Path

from cryptography.fernet import Fernet
from dotenv import dotenv_values, set_key


def main() -> None:
    env_path = Path(__file__).resolve().parents[2] / ".env"
    if not env_path.is_file():
        raise SystemExit("Create .env from .env.example and configure your database first.")

    values = dotenv_values(env_path)
    key = values.get("KYC_ENCRYPTION_KEY")
    if key:
        try:
            Fernet(key.encode("utf-8"))
        except (ValueError, TypeError):
            raise SystemExit("Existing KYC key is invalid; it was left unchanged.") from None
        print("Existing KYC encryption key kept.")
    else:
        if "KYC_ENCRYPTION_KEY" in values:
            print("Configuring the empty KYC encryption setting.")
        set_key(str(env_path), "KYC_ENCRYPTION_KEY", Fernet.generate_key().decode("ascii"))
        print("KYC encryption key saved to the ignored .env file.")

    if not values.get("KYC_UPLOAD_DIR"):
        set_key(str(env_path), "KYC_UPLOAD_DIR", "var/kyc")
    print("Restart the backend after applying database migrations.")


if __name__ == "__main__":
    main()
