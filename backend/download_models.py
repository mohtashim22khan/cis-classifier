import os
import requests

MODELS = {
    "MobileNetV2_finetuned_final.keras":
    "https://huggingface.co/mohtashim22khan123/cis-classifier_models/resolve/main/MobileNetV2_finetuned_final.keras",

    "EfficientNetB0_finetuned_final.keras":
    "https://huggingface.co/mohtashim22khan123/cis-classifier_models/resolve/main/EfficientNetB0_finetuned_final.keras",
}

# Create models directory if not exists
os.makedirs("models", exist_ok=True)

for filename, url in MODELS.items():

    filepath = os.path.join("models", filename)

    # Skip if already downloaded
    if os.path.exists(filepath):
        print(f"{filename} already exists.")
        continue

    print(f"Downloading {filename}...")

    response = requests.get(url)

    if response.status_code == 200:
        with open(filepath, "wb") as f:
            f.write(response.content)

        print(f"{filename} downloaded successfully.")

    else:
        print(f"Failed to download {filename}")