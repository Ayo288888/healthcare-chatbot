import io
from typing import Any
from fastapi import FastAPI, HTTPException, File, UploadFile, Form
from pydantic import BaseModel
from transformers import pipeline
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image


app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows local HTML file to call this API
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


TEXT_MODEL_ID = "Iloriayomide/Symptom_Prediction"
IMAGE_MODEL_ID = "microsoft/resnet-50"
VOICE_MODEL_ID = "openai/whisper-tiny"

print("--- Loading Multi-Agent System ---")
print(f"Loading Text Agent: {TEXT_MODEL_ID}...")
text_classifier = pipeline("text-classification", model=TEXT_MODEL_ID)

print(f"Loading Vision Agent: {IMAGE_MODEL_ID}...")
image_classifier = pipeline("image-classification", model=IMAGE_MODEL_ID)

print(f"Loading Voice Agent: {VOICE_MODEL_ID}...")
voice_processor = pipeline(
    "automatic-speech-recognition",
    model=VOICE_MODEL_ID
)
print("--- All Agents Ready ---")


class SymptomRequest(BaseModel):
    text: str


# --- ENDPOINTS ---
@app.get("/")
def read_root():
    return {"message": "Healthcare Chatbot API is running. Please open index.html in your browser to use the interface."}


@app.post("/predict/text")
@app.post("/predict")
def predict_text_symptoms(
    text: str = Form(...),
    temperature: str = Form(None),
    location: str = Form(None),
    image: UploadFile = File(None)
):
    """Agent 1: Analyzes text symptoms with Smart Guardrails"""
    try:
        text_lower = text.lower()
        if len(text) < 60:
            common_conditions = {
                "cold": "Common Cold",
                "flu": "Influenza",
                "runny nose": "Rhinitis"

            }

            for key, disease_name in common_conditions.items():
                if key in text_lower:
                    return {
                        "top_predictions": [
                            {
                                "disease": disease_name,
                                "confidence": "100.00% (Simple Match)"
                            }
                        ],
                        "status": "success",
                        "agent": "Rule_Based_Engine"
                    }

        #  AI MODEL INFERENCE
        results = text_classifier(text, top_k=3)
        predictions = []
        for res in results:
            predictions.append({
                "disease": res['label'],
                "confidence": f"{round(res['score'] * 100, 2)}%"
            })

        return {
            "top_predictions": predictions,
            "status": "success",
            "agent": "Text_BioBERT"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/predict/image")
async def predict_xray(file: UploadFile = File(...)):
    """Agent 2: Analyzes uploaded images (e.g., X-rays)"""
    try:

        image_data = await file.read()
        image = Image.open(io.BytesIO(image_data))
        results = image_classifier(image)
        predictions = []
        for res in results:
            predictions.append({
                "condition": res['label'],
                "confidence": f"{round(res['score'] * 100, 2)}%"
            })

        return {
            "analysis": predictions,
            "status": "success",
            "agent": "Vision_Model"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Image processing failed: {str(e)}"
        )


@app.post("/predict/voice")
async def predict_voice(file: UploadFile = File(...)):
    """Agent 3: Transcribes voice and (Optional) sends to text analyzer"""
    try:
        audio_data = await file.read()

        transcription_result: Any = voice_processor(audio_data)
        transcription = transcription_result["text"]
        symptom_check = text_classifier(transcription, top_k=3)

        return {
            "transcription": transcription,
            "symptom_analysis": symptom_check,
            "status": "success",
            "agent": "Voice_Whisper"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Voice processing failed: {str(e)}"
        )