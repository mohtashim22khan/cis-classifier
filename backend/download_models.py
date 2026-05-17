import os
import requests

MODEL_URLS = {
    "MobileNetV2_finetuned_final.keras": "https://huggingface.co/mohtashim22khan123/cis-classifier_models/resolve/main/MobileNetV2_finetuned_final.keras",
    "EfficientNetB0_finetuned_final.keras": "https://huggingface.co/mohtashim22khan123/cis-classifier_models/resolve/main/EfficientNetB0_finetuned_final.keras",
    "best_tuned_model_f1.keras": "https://huggingface.co/mohtashim22khan123/cis-classifier_models/resolve/main/best_tuned_model_f1_3_latest.keras",
    "ResNet50V2_bestversion.keras": "https://huggingface.co/asadarif23088/cis_classifier_mymodel/resolve/main/ResNet50V2_bestversion.keras",
}

os.makedirs("models", exist_ok=True)

# Download ResNet at startup (but don't load into memory yet)
resnet_filepath = "models/ResNet50V2_bestversion.keras"
if not os.path.exists(resnet_filepath):
    print("Downloading ResNet50V2...")
    with requests.get(MODEL_URLS["ResNet50V2_bestversion.keras"], stream=True) as r:
        r.raise_for_status()
        with open(resnet_filepath, "wb") as f:
            for chunk in r.iter_content(chunk_size=8192):
                f.write(chunk)
    print("ResNet50V2 downloaded.")

_models = {}

def get_model(filename, **kwargs):
    if filename not in _models:
        filepath = os.path.join("models", filename)
        if not os.path.exists(filepath):
            print(f"Downloading {filename}...")
            response = requests.get(MODEL_URLS[filename])
            with open(filepath, "wb") as f:
                f.write(response.content)
            print(f"{filename} downloaded.")
        _models[filename] = tf.keras.models.load_model(filepath, compile=False, **kwargs)
    return _models[filename]