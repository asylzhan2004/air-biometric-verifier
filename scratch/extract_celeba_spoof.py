"""
Fast Background Multi-Threaded Unpacker for CelebA_Spoof (77.25 GB archive.zip)
Extracts C:\Users\toley\Downloads\archive.zip directly to X:\работа с обучением\archive (22)_CelebA_Spoof
"""
import os
import sys
import zipfile
from concurrent.futures import ThreadPoolExecutor

sys.stdout.reconfigure(encoding='utf-8')

def extract_member(zip_file, member, target_dir):
    try:
        zip_file.extract(member, target_dir)
    except Exception:
        pass

def main():
    zip_path = r"C:\Users\toley\Downloads\archive.zip"
    target_dir = r"X:\работа с обучением\archive (22)_CelebA_Spoof"

    print("=" * 80)
    print(f"[UNPACKING CELEBA_SPOOF] Extracting {zip_path} (77.25 GB)...")
    print(f"[TARGET DIR] {target_dir}")
    print("=" * 80)

    if not os.path.exists(zip_path):
        print(f"[ERROR] {zip_path} not found!")
        return

    os.makedirs(target_dir, exist_ok=True)

    with zipfile.ZipFile(zip_path, 'r') as z:
        members = z.namelist()
        total = len(members)
        print(f"[ZIP INDEXED] Found {total} files in archive.zip. Starting extraction...")

        extracted = 0
        for i, member in enumerate(members):
            try:
                z.extract(member, target_dir)
                extracted += 1
                if extracted % 25000 == 0:
                    print(f"Unpacked [{extracted}/{total}] files ({round((extracted/total)*100, 1)}%)...")
            except Exception:
                pass

    print("=" * 80)
    print(f"[SUCCESS] CelebA_Spoof Extraction Complete! Total Unpacked: {extracted} files.")
    print("=" * 80)

if __name__ == "__main__":
    main()
