import os
import requests

MODEL_URLS = {
    "MobileNetV2_finetuned_final.keras": "https://huggingface.co/mohtashim22khan123/cis-classifier_models/resolve/main/MobileNetV2_finetuned_final.keras",
    "EfficientNetB0_finetuned_final.keras": "https://huggingface.co/mohtashim22khan123/cis-classifier_models/resolve/main/EfficientNetB0_finetuned_final.keras",
    "best_tuned_model_f1.keras": "https://huggingface.co/mohtashim22khan123/cis-classifier_models/resolve/main/best_tuned_model_f1.keras",
    "ResNet50V2_bestversion.keras": "https://huggingface.co/asadarif23088/cis_classifier_mymodel/resolve/main/ResNet50V2_bestversion.keras",
}

os.makedirs("models", exist_ok=True)

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