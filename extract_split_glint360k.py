"""
Concatenates split parts (glint360k_00 ... glint360k_06) into a single archive
and extracts MXNet RecordIO dataset glint360k/train.rec to X:\\big dataset\\glint360k_unpacked
"""
import os
import sys
import tarfile

sys.stdout.reconfigure(encoding='utf-8')

def main():
    source_dir = r"X:\big dataset\glint360k"
    target_dir = r"X:\big dataset\glint360k_unpacked"
    combined_tar = r"X:\big dataset\glint360k_combined.tar.gz"
    os.makedirs(target_dir, exist_ok=True)

    parts = [os.path.join(source_dir, f"glint360k_0{i}") for i in range(7)]
    
    if not os.path.exists(combined_tar):
        print(f"[CONCATENATING] Merging {len(parts)} parts into {combined_tar}...")
        with open(combined_tar, 'wb') as outfile:
            for part in parts:
                print(f"--> Appending {os.path.basename(part)}...")
                with open(part, 'rb') as infile:
                    while True:
                        chunk = infile.read(64 * 1024 * 1024)
                        if not chunk:
                            break
                        outfile.write(chunk)
        print(f"[SUCCESS] Concat complete: {combined_tar}")

    print(f"[EXTRACTING] Extracting {combined_tar} to {target_dir}...")
    with tarfile.open(combined_tar, "r:gz") as tar:
        tar.extractall(path=target_dir)
    print(f"[SUCCESS] Glint360K dataset fully unpacked to {target_dir}!")

if __name__ == "__main__":
    main()
