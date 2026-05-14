from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import tensorflow as tf
import numpy as np
from PIL import Image
import io
import tensorflow.keras.backend as K
from tensorflow.keras.models import load_model

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://cis-classifier.vercel.app/",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Redefine the custom metric
@tf.keras.utils.register_keras_serializable()
def f1_score(y_true, y_pred):
    true_positives = K.sum(K.round(K.clip(y_true * y_pred, 0, 1)))
    possible_positives = K.sum(K.round(K.clip(y_true, 0, 1)))
    predicted_positives = K.sum(K.round(K.clip(y_pred, 0, 1)))
    precision = true_positives / (predicted_positives + K.epsilon())
    recall = true_positives / (possible_positives + K.epsilon())
    return 2 * ((precision * recall) / (precision + recall + K.epsilon()))

# ── Load models at startup ────────────────────────────────────────────────────
# Add future models here as you integrate them.
mobilenet_model = tf.keras.models.load_model(
    "models/MobileNetV2_finetuned_final.keras",
    safe_mode=False)   # Required due to Lambda layer in architecture)
efficientnet_model = tf.keras.models.load_model("models/EfficientNetB0_finetuned_final.keras")
custom_CNN_model   = tf.keras.models.load_model("models/best_tuned_model_f1.keras",)
resnetv2_model = tf.keras.models.load_model("models/ResNet50V2_bestversion.keras",
                                            custom_objects={"F1Score": f1_score})


#── Shared preprocessing ──────────────────────────────────────────────────────
def preprocess(file_bytes: bytes) -> np.ndarray:
    """
    Decode uploaded image bytes → normalized numpy array.

    The model's internal Lambda layer normalizes [0,255] → [-1, 1],
    but since safe_mode=False may skip it, we apply normalization manually
    here as a safety net to guarantee correct input range.
    """
    img = Image.open(io.BytesIO(file_bytes)).resize((224, 224)).convert("RGB")
    arr = np.array(img, dtype=np.float32)
    arr = (arr / 255.0)      # [0, 255] → [-1, 1]
    return np.expand_dims(arr, axis=0)    # (224, 224, 3) → (1, 224, 224, 3)


def make_result(prob: float, threshold: float = 0.35) -> dict:
    label = "CIS" if prob > threshold else "Non-CIS"
    return {"label": label, "confidence": round(float(prob), 4)}


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/predict/mobilenet")
async def predict_mobilenet(file: UploadFile = File(...)):
    contents = await file.read()
    arr = preprocess(contents)
    prob = mobilenet_model.predict(arr)[0][0]
    return make_result(prob)


@app.post("/predict/efficientnet")
async def predict_efficientnet(file: UploadFile = File(...)):
    contents = await file.read()
    arr = preprocess(contents)
    prob = efficientnet_model.predict(arr)[0][0]
    return make_result(prob)
    # Not yet integrated — return 501 so frontend shows a clear error
    # raise HTTPException(status_code=501, detail="EfficientNet not yet integrated.")


@app.post("/predict/CNN")
async def predict_vit(file: UploadFile = File(...)):
    contents = await file.read()
    arr = preprocess(contents)
    prob = custom_CNN_model.predict(arr)[0][0]
    return make_result(prob)
    # Not yet integrated — return 501 so frontend shows a clear error
    # raise HTTPException(status_code=501, detail="Vision Transformer not yet integrated.")

@app.post("/predict/resnetv2")
async def predict_resnetv2(file: UploadFile = File(...)):
    contents = await file.read()
    arr = preprocess(contents)
    prob = resnetv2_model.predict(arr)[0][0]
    return make_result(prob)
