"""
Extracts split Glint360k GZIP/TAR archives (glint360k_00 ... glint360k_06)
into X:\\big dataset\\glint360k_extracted
"""
import os
import sys
import tarfile

sys.stdout.reconfigure(encoding='utf-8')

def extract_glint():
    source_dir = r"X:\big dataset\glint360k"
    target_dir = r"X:\big dataset\glint360k_extracted"
    os.makedirs(target_dir, exist_ok=True)

    files = sorted([f for f in os.listdir(source_dir) if f.startswith('glint360k_')])
    print(f"[START] Extracting {len(files)} Glint360k archive parts to {target_dir}...")

    # Combine parts into a stream and extract
    for fname in files:
        part_path = os.path.join(source_dir, fname)
        print(f"[EXTRACTING] Processing {fname} ({round(os.path.getsize(part_path)/(1024**3), 2)} GB)...")
        try:
            with tarfile.open(part_path, "r:*") as tar:
                tar.extractall(path=target_dir)
            print(f"[SUCCESS] Extracted {fname}")
        except Exception as e:
            print(f"[PARTIAL] {fname}: {e}")

if __name__ == "__main__":
    extract_glint()
