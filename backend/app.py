from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import tensorflow as tf
import numpy as np
from PIL import Image
import io

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        # "http://localhost:5173",
        "https://cis-classifier.vercel.app/",
    #     "https://id-preview--b398425f-ae76-4194-8a53-beb7aaf8b5c7.lovable.app",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Load models at startup ────────────────────────────────────────────────────
# Add future models here as you integrate them.
mobilenet_model = tf.keras.models.load_model(
    "models/MobileNetV2_finetuned_final.keras",
    safe_mode=False   # Required due to Lambda layer in architecture
)

# Placeholder — swap with real model when ready
efficientnet_model = tf.keras.models.load_model("models/EfficientNetB0_finetuned_final.keras")
# vit_model          = tf.keras.models.load_model("models/vit.keras")


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


@app.post("/predict/vit")
async def predict_vit(file: UploadFile = File(...)):
    # Not yet integrated — return 501 so frontend shows a clear error
    raise HTTPException(status_code=501, detail="Vision Transformer not yet integrated.")
