"""
CelebA_Spoof + SiW + RealVsAI Combined Anti-Spoofing & Anti-DeepFake Dataset Verification Script
"""
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

celeba_data_dir = r"X:\работа с обучением\archive\CelebA_Spoof_\CelebA_Spoof\Data"

real_count = 0
spoof_count = 0

print(f"[TESTING] Scanning CelebA_Spoof directory: {celeba_data_dir}...")

if os.path.exists(celeba_data_dir):
    for root, dirs, files in os.walk(celeba_data_dir):
        for f in files:
            if f.lower().endswith(('.png', '.jpg', '.jpeg')):
                full_path = os.path.join(root, f)
                path_lower = full_path.lower()
                if "live" in path_lower or "real" in path_lower:
                    real_count += 1
                else:
                    spoof_count += 1
                if (real_count + spoof_count) % 50000 == 0:
                    print(f"Scanned [{real_count + spoof_count}] images | Live: {real_count} | Spoof: {spoof_count}")
                if real_count + spoof_count >= 150000:
                    break
        if real_count + spoof_count >= 150000:
            break

print("=" * 80)
print(f"[SUMMARY] Total Scanned: {real_count + spoof_count} | Live/Real: {real_count} | Spoof/Replay/AI: {spoof_count}")
print("=" * 80)
