#!/usr/bin/env python3
import fnmatch
import ftplib
import getpass
import json
import os
from pathlib import Path, PurePosixPath

SFTP_CONFIG_PATH = ".vscode/sftp.json"


def is_ignored(path_obj, root_path, ignore_patterns):
    try:
        relative_path = path_obj.relative_to(root_path)
    except ValueError:
        relative_path = path_obj

    if path_obj.name == "publish.py":
        return True

    if path_obj.name.startswith(".") and path_obj.name != ".":
        print(f"  Ignorerar punktfil/-mapp: {relative_path}")
        return True

    for pattern in ignore_patterns:
        if (
            fnmatch.fnmatch(str(relative_path), pattern)
            or fnmatch.fnmatch(str(relative_path), pattern + "/*")
            or fnmatch.fnmatch(path_obj.name, pattern)
        ):
            print(f"  Ignorerar enligt '{pattern}': {relative_path}")
            return True

    return False


def load_env(env_path=None):
    env_path = env_path or os.environ.get("PUBLISH_ENV_FILE", ".env")
    env_vars = {}
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as env_file:
            for line in env_file:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                key, value = line.split("=", 1)
                env_vars[key.strip()] = value.strip()
    return env_vars


def ensure_remote_directory(ftp, remote_path):
    current_path = PurePosixPath("/")
    for part in PurePosixPath(str(remote_path)).parts:
        if part == "/":
            continue
        current_path /= part
        try:
            ftp.mkd(str(current_path))
            print(f"Skapade mapp: {current_path}")
        except ftplib.error_perm as error:
            if not str(error).startswith("550"):
                raise


def main():
    print("--- Python FTP Publisher ---")

    try:
        with open(SFTP_CONFIG_PATH, "r", encoding="utf-8") as config_file:
            lines = [
                line for line in config_file
                if not line.strip().startswith("//")
            ]
            config = json.loads("".join(lines))
    except FileNotFoundError:
        print(f"FEL: Konfigurationsfilen '{SFTP_CONFIG_PATH}' saknas.")
        return 1
    except json.JSONDecodeError as error:
        print(f"FEL: Ogiltig JSON i '{SFTP_CONFIG_PATH}': {error}")
        return 1

    host = config.get("host")
    username = config.get("username")
    remote_base_path = PurePosixPath(config.get("remotePath", "/"))
    ignore_patterns = config.get("ignore", [])

    if not host or not username:
        print("FEL: 'host' och 'username' måste anges i sftp.json.")
        return 1

    password = load_env().get("FTP-PASSWORD")
    if password:
        print("Använder lösenord från miljöfil.")
    else:
        password = getpass.getpass(f"Ange lösenord för {username}@{host}: ")

    try:
        with ftplib.FTP(host, username, password, timeout=30) as ftp:
            ftp.set_pasv(True)
            print(f"Ansluten till {host}.")
            print(f"Fjärrsökväg: {remote_base_path}")
            ensure_remote_directory(ftp, remote_base_path)

            for root, dirs, files in os.walk(".", topdown=True):
                root_path = Path(root)
                dirs[:] = [
                    directory for directory in dirs
                    if not is_ignored(root_path / directory, Path("."), ignore_patterns)
                ]

                relative_root = root_path.relative_to(Path("."))
                for directory in dirs:
                    remote_directory = remote_base_path / relative_root / directory
                    try:
                        ftp.mkd(str(remote_directory))
                        print(f"Skapade mapp: {remote_directory}")
                    except ftplib.error_perm as error:
                        if not str(error).startswith("550"):
                            raise

                for file_name in files:
                    local_file = root_path / file_name
                    if is_ignored(local_file, Path("."), ignore_patterns):
                        continue
                    remote_file = remote_base_path / local_file.relative_to(Path("."))
                    print(f"Laddar upp: {local_file} -> {remote_file}")
                    with open(local_file, "rb") as file_handle:
                        ftp.storbinary(f"STOR {remote_file}", file_handle)

        print("Publicering klar!")
        return 0
    except ftplib.all_errors as error:
        print(f"FTP-FEL: {error}")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
