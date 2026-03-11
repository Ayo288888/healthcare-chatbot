import os
from fastapi import FastAPI, HTTPException, File, UploadFile
from pydantic import BaseModel
from transformers import pipeline, AutoTokenizer
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq
from google import genai
from google.genai import errors
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- CONFIG ---
gemini_key = os.getenv("GEMINI_API_KEY")
groq_key = os.getenv("GROQ_API_KEY")

if not groq_key or not gemini_key:
    raise ValueError("API Keys missing! Check your .env file.")

client = genai.Client(api_key=gemini_key)
groq_client = Groq(api_key=groq_key)

# --- LOCAL MODEL ---
CUSTOM_MODEL_ID = "Iloriayomide/Symptom_Prediction"
tokenizer = AutoTokenizer.from_pretrained(CUSTOM_MODEL_ID)
text_classifier = pipeline(
    "text-classification",
    model=CUSTOM_MODEL_ID,
    tokenizer=tokenizer,
    top_k=5
)

class SymptomRequest(BaseModel):
    text: str

def perform_triage(raw_text: str):
    """
    Analyzes symptoms using a custom local model and Cloud LLMs, 
    with automatic fallback and HTML-structured UI formatting.
    """
    local_results = text_classifier(
        raw_text,
        truncation=True,
        max_length=512
    )
    predictions = [
        {
            "condition": r['label'].title(),
            "confidence": f"{round(r['score']*100, 2)}%"
        }
        for r in local_results[0]
    ]

    
    prompt = (
        f"USER SYMPTOMS: {raw_text}\n"
        f"AI ANALYSIS: {predictions}\n\n"
        "ACT AS: A Supportive Health Assistant.\n"
        "TASK: Provide a response in simple, non-medical language.\n"
        "CRITICAL UI INSTRUCTION: You must format the output strictly using clean HTML tags. "
        "DO NOT use Markdown asterisks (**). Format EXACTLY like this structure:\n\n"
        "<h4>🩺 Assessment</h4><p>[Explain what might be happening]</p>\n"
        "<h4>🩹 Immediate Relief</h4><ul><li>[Step 1]</li><li>[Step 2]</li></ul>\n"
        "<h4>💊 Pharmacy Advice</h4><p>[What to ask a pharmacist for]</p>\n"
        "<h4>🚨 RED FLAGS (When to see a doctor)</h4><ul><li>[Warning sign 1]</li></ul>\n"
        "<hr><p><small><em>DISCLAIMER: This is an AI tool and not a substitute for a human doctor.</em></small></p>"
    )

    
    try:
        
        response = client.models.generate_content(
            model="gemini-3-flash-preview",
            contents=prompt
        )
    except errors.ClientError as e:
        
        if e.code == 429:
            print("Gemini 3 limit reached. Executing fallback to Gemini 2.5 Flash...")
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt
            )
        else:
            
            raise e

    return predictions, response.text


@app.post("/predict")
def predict_text(request: SymptomRequest):
    try:
        predictions, note = perform_triage(request.text)
        return {
            "top_predictions": predictions[:3],
            "doctor_note": note,
            "status": "success"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/predict/voice")
async def predict_voice(file: UploadFile = File(...)):
    try:
        audio_bytes = await file.read()
        transcription = groq_client.audio.transcriptions.create(
            file=("audio.wav", audio_bytes),
            model="whisper-large-v3",
        )
        predictions, note = perform_triage(transcription.text)
        return {
            "transcription": transcription.text,
            "top_predictions": predictions[:3],
            "doctor_note": note
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)