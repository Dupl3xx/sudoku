"""
sign_and_deploy.py
------------------
1. Downloads the latest IPA from EAS build dashboard (provide URL as arg)
2. Re-signs it with ipasign.pro using your dev cert + provisioning profile
3. Copies the signed IPA to docs/ for GitHub Pages hosting

Usage:
    python sign_and_deploy.py <eas_ipa_url>

Example:
    python sign_and_deploy.py "https://expo.dev/.../Sudoku.ipa"
"""

import sys
import os
import requests
import shutil

IPA_PATH       = "docs/Sudoku.ipa"
P12_PATH       = "D:/iPhone/2026/cert.p12"
MOBILEPROV_PATH= "D:/iPhone/2026/20260218.mobileprovision"
P12_PASSWORD   = "1234"
SIGN_URL       = "https://ipasign.pro/sign"

def download(url, dest):
    print(f"Downloading IPA from EAS…")
    r = requests.get(url, stream=True)
    r.raise_for_status()
    with open(dest, "wb") as f:
        for chunk in r.iter_content(chunk_size=8192):
            f.write(chunk)
    size = os.path.getsize(dest) / 1024 / 1024
    print(f"Downloaded: {size:.1f} MB → {dest}")

def sign(ipa_path):
    print("Signing with ipasign.pro…")
    with open(ipa_path, "rb") as ipa, \
         open(P12_PATH, "rb") as p12, \
         open(MOBILEPROV_PATH, "rb") as prov:
        files = {
            "ipa": ipa,
            "p12": p12,
            "mobileprovision": prov,
        }
        data = {"p12_password": P12_PASSWORD}
        r = requests.post(SIGN_URL, files=files, data=data)

    result = r.json()
    print("Response:", result)

    if "url" in result:
        signed_url = result["url"]
        print(f"Downloading signed IPA from: {signed_url}")
        r2 = requests.get(signed_url, stream=True)
        r2.raise_for_status()
        with open(ipa_path, "wb") as f:
            for chunk in r2.iter_content(chunk_size=8192):
                f.write(chunk)
        size = os.path.getsize(ipa_path) / 1024 / 1024
        print(f"Signed IPA saved: {size:.1f} MB → {ipa_path}")
        return True
    elif "file" in result:
        import base64
        data = base64.b64decode(result["file"])
        with open(ipa_path, "wb") as f:
            f.write(data)
        print(f"Signed IPA saved → {ipa_path}")
        return True
    else:
        print("ERROR: Unexpected response from ipasign.pro")
        return False

def main():
    if len(sys.argv) < 2:
        print("Usage: python sign_and_deploy.py <eas_ipa_download_url>")
        print()
        print("Get the URL from: https://expo.dev/accounts/dupl3xx/projects/sudoku-ondrej/builds")
        sys.exit(1)

    ipa_url = sys.argv[1]
    os.makedirs("docs", exist_ok=True)

    download(ipa_url, IPA_PATH)
    ok = sign(IPA_PATH)

    if ok:
        print()
        print("✅ Done! Now commit and push:")
        print("   git add docs/Sudoku.ipa && git commit -m 'Update signed IPA' && git push")
        print()
        print("Install page: https://dupl3xx.github.io/sudoku/")
    else:
        print("❌ Signing failed.")
        sys.exit(1)

if __name__ == "__main__":
    main()
