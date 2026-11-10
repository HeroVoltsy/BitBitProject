from pathlib import Path
import shutil
import subprocess
import sys

from cryptography.fernet import Fernet
from dotenv import dotenv_values


def helper(tmp_path):
    scripts = tmp_path / "scripts"
    scripts.mkdir()
    target = scripts / "configure_kyc.py"
    shutil.copyfile(Path(__file__).resolve().parents[1] / "scripts/configure_kyc.py", target)
    return target


def test_key_helper_generates_and_preserves_private_key(tmp_path):
    script = helper(tmp_path)
    env = tmp_path / ".env"
    env.write_text("JWT_SECRET_KEY=leave-this-alone\nKYC_ENCRYPTION_KEY=\n", encoding="utf-8")
    first = subprocess.run([sys.executable, str(script)], capture_output=True, text=True)
    assert first.returncode == 0
    values = dotenv_values(env)
    key = values["KYC_ENCRYPTION_KEY"]
    Fernet(key.encode("ascii"))
    assert key not in first.stdout + first.stderr
    assert values["JWT_SECRET_KEY"] == "leave-this-alone"
    assert values["KYC_UPLOAD_DIR"] == "var/kyc"
    original = env.read_bytes()
    second = subprocess.run([sys.executable, str(script)], capture_output=True, text=True)
    assert second.returncode == 0
    assert env.read_bytes() == original
    assert key not in second.stdout + second.stderr


def test_key_helper_does_not_replace_invalid_existing_key(tmp_path):
    script = helper(tmp_path)
    env = tmp_path / ".env"
    env.write_text("KYC_ENCRYPTION_KEY=invalid-key\n", encoding="utf-8")
    original = env.read_bytes()
    result = subprocess.run([sys.executable, str(script)], capture_output=True, text=True)
    assert result.returncode != 0
    assert env.read_bytes() == original
    assert "invalid-key" not in result.stdout + result.stderr
