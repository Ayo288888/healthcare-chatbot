from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from transformers import pipeline
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# --- ALLOW FRONTEND TO TALK TO BACKEND (CORS) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allows your local HTML file to call this API
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- CONFIGURATION ---
# REPLACE THIS WITH YOUR HUGGING FACE USERNAME
MODEL_ID = "Iloriayomide/my-symptom-checker-biobert" 

print(f"Loading model: {MODEL_ID}...")
# This downloads the model automatically to your laptop the first time you run it
classifier = pipeline("text-classification", model=MODEL_ID)

class SymptomRequest(BaseModel):
    text: str

# ... (keep your imports and setup)

@app.post("/predict")
def predict_disease(request: SymptomRequest):
    try:
        # Get the Top 3 guesses instead of just 1
        # top_k=3 tells the model to return the 3 most likely options
        results = classifier(request.text, top_k=3)
        
        # results looks like: 
        # [{'label': 'Malaria', 'score': 0.21}, {'label': 'Typhoid', 'score': 0.19}, ...]
        
        # Create a nice list for the frontend
        predictions = []
        for res in results:
            predictions.append({
                "disease": res['label'],
                "confidence": f"{round(res['score'] * 100, 2)}%"
            })
        
        return {
            "top_predictions": predictions,
            "status": "success"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))