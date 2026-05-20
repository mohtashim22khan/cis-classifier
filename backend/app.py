from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import tensorflow as tf
import numpy as np
from PIL import Image
import io
import tensorflow.keras.backend as K
import os
import requests

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://cis-classifier.vercel.app"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@tf.keras.utils.register_keras_serializable()
def f1_score(y_true, y_pred):
    true_positives = K.sum(K.round(K.clip(y_true * y_pred, 0, 1)))
    possible_positives = K.sum(K.round(K.clip(y_true, 0, 1)))
    predicted_positives = K.sum(K.round(K.clip(y_pred, 0, 1)))
    precision = true_positives / (predicted_positives + K.epsilon())
    recall = true_positives / (possible_positives + K.epsilon())
    return 2 * ((precision * recall) / (precision + recall + K.epsilon()))

@tf.keras.utils.register_keras_serializable()
class F1Score(tf.keras.metrics.Metric):
    def __init__(self, name='f1_score', **kwargs):
        super().__init__(name=name, **kwargs)
        self.true_positives = self.add_weight(name='tp', initializer='zeros')
        self.possible_positives = self.add_weight(name='pp', initializer='zeros')
        self.predicted_positives = self.add_weight(name='predp', initializer='zeros')

    def update_state(self, y_true, y_pred, sample_weight=None):
        y_pred = K.round(K.clip(y_pred, 0, 1))
        self.true_positives.assign_add(K.sum(K.round(K.clip(y_true * y_pred, 0, 1))))
        self.possible_positives.assign_add(K.sum(K.round(K.clip(y_true, 0, 1))))
        self.predicted_positives.assign_add(K.sum(y_pred))

    def result(self):
        precision = self.true_positives / (self.predicted_positives + K.epsilon())
        recall = self.true_positives / (self.possible_positives + K.epsilon())
        return 2 * ((precision * recall) / (precision + recall + K.epsilon()))

    def reset_state(self):
        self.true_positives.assign(0)
        self.possible_positives.assign(0)
        self.predicted_positives.assign(0)

MODEL_URLS = {
    "MobileNetV2_finetuned_final.keras": "https://huggingface.co/mohtashim22khan123/cis-classifier_models/resolve/main/MobileNetV2_finetuned_final.keras",
    "EfficientNetB0_finetuned_final.keras": "https://huggingface.co/mohtashim22khan123/cis-classifier_models/resolve/main/EfficientNetB0_finetuned_final.keras",
    "best_tuned_model_f1.keras": "https://huggingface.co/mohtashim22khan123/cis-classifier_models/resolve/main/best_tuned_model_f1.keras",
    "ResNet50V2_bestversion.keras": "https://huggingface.co/asadarif23088/cis_classifier_mymodel/resolve/main/ResNet50V2_bestversion.keras",
}

MODEL_KWARGS = {
    "MobileNetV2_finetuned_final.keras": {"safe_mode": False},
    "EfficientNetB0_finetuned_final.keras": {},
    "best_tuned_model_f1.keras": {},
    "ResNet50V2_bestversion.keras": {},
}

# Per-model classification thresholds (tuned per training evaluation)
MODEL_THRESHOLDS = {
    "MobileNetV2_finetuned_final.keras": 0.35,
    "EfficientNetB0_finetuned_final.keras": 0.35,
    "best_tuned_model_f1.keras": 0.50,
    "ResNet50V2_bestversion.keras": 0.50,
}

os.makedirs("models", exist_ok=True)
_models = {}

def get_model(filename):
    if filename not in _models:
        filepath = os.path.join("models", filename)
        if not os.path.exists(filepath):
            print(f"Downloading {filename}...")
            response = requests.get(MODEL_URLS[filename])
            with open(filepath, "wb") as f:
                f.write(response.content)
            print(f"{filename} downloaded.")
        _models[filename] = tf.keras.models.load_model(filepath, compile=False, **MODEL_KWARGS[filename])
    return _models[filename]

# ── Shared preprocessing ──────────────────────────────────────────────────────
def preprocess(file_bytes: bytes) -> np.ndarray:
    img = Image.open(io.BytesIO(file_bytes)).resize((224, 224)).convert("RGB")
    arr = np.array(img, dtype=np.float32) / 255.0
    return np.expand_dims(arr, axis=0)

def make_result(prob: float, filename: str) -> dict:
    threshold = MODEL_THRESHOLDS[filename]
    label = "CIS" if prob > threshold else "Non-CIS"
    return {"label": label, "confidence": round(float(prob), 4)}

# ── Routes ────────────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/predict/mobilenet")
async def predict_mobilenet(file: UploadFile = File(...)):
    filename = "MobileNetV2_finetuned_final.keras"
    contents = await file.read()
    prob = get_model(filename).predict(preprocess(contents))[0][0]
    return make_result(prob, filename)

@app.post("/predict/efficientnet")
async def predict_efficientnet(file: UploadFile = File(...)):
    filename = "EfficientNetB0_finetuned_final.keras"
    contents = await file.read()
    prob = get_model(filename).predict(preprocess(contents))[0][0]
    return make_result(prob, filename)

@app.post("/predict/CNN")
async def predict_cnn(file: UploadFile = File(...)):
    filename = "best_tuned_model_f1.keras"
    contents = await file.read()
    prob = get_model(filename).predict(preprocess(contents))[0][0]
    return make_result(prob, filename)

@app.post("/predict/resnetv2")
async def predict_resnetv2(file: UploadFile = File(...)):
    filename = "ResNet50V2_bestversion.keras"
    contents = await file.read()
    prob = get_model(filename).predict(preprocess(contents))[0][0]
    return make_result(prob, filename)