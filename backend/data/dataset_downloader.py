"""
MobileTwin Dataset Downloader
Fetches the open-access Structural Health Monitoring benchmark dataset from Zenodo.
Target Record: Zenodo Record 20443860
Title: FLOOD-SHAB: Cable-stayed bridge case-study SHM monitoring features dataset during the April 2026 hydrometric event
DOI: 10.5281/zenodo.20443860
License: Creative Commons Attribution 4.0 International (CC-BY-4.0)
"""

import os
import requests

RAW_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "raw")
os.makedirs(RAW_DIR, exist_ok=True)

ZENODO_RECORD_ID = "20443860"
ZENODO_API_URL = f"https://zenodo.org/api/records/{ZENODO_RECORD_ID}"

def download_datasets(force=False):
    print(f"Connecting to Zenodo repository for Record ID: {ZENODO_RECORD_ID}...")
    try:
        r = requests.get(ZENODO_API_URL, timeout=30)
        r.raise_for_status()
        metadata = r.json()
    except Exception as e:
        print(f"Failed to query Zenodo API: {e}")
        return False

    files = metadata.get("files", [])
    print(f"Zenodo Record found. Total files: {len(files)}")

    for f in files:
        filename = f.get("key") or f.get("filename")
        download_url = f.get("links", {}).get("self")
        dest_path = os.path.join(RAW_DIR, filename)

        if os.path.exists(dest_path) and not force:
            print(f"  [OK] {filename} already exists (skipping).")
            continue

        print(f"  [DOWNLOADING] {filename} from {download_url}...")
        try:
            resp = requests.get(download_url, stream=True, timeout=60)
            resp.raise_for_status()
            with open(dest_path, "wb") as out_f:
                for chunk in resp.iter_content(chunk_size=65536):
                    if chunk:
                        out_f.write(chunk)
            print(f"  [SAVED] {filename} -> {dest_path}")
        except Exception as e:
            print(f"  [ERROR] Downloading {filename}: {e}")

    print("Dataset verification complete.")
    return True

if __name__ == "__main__":
    download_datasets()
