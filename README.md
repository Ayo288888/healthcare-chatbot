🏥 AI Symptom Checker (Healthcare Chatbot)
This project is an AI-powered health assistant that analyzes user-described symptoms to predict potential diseases. It uses a FastAPI backend to host a fine-tuned BioBERT model and serves a lightweight HTML/JavaScript frontend for user interaction.

✨ Features
Natural Language Processing: Accepts full-sentence descriptions of symptoms (e.g., "I have a high fever and severe headache").

Top-K Predictions: Returns the top 3 most likely disease matches with confidence percentages.

Medical AI Model: Utilizes the Hugging Face model Iloriayomide/my-symptom-checker-biobert for classification.

Simple Interface: Clean, responsive web UI for easy testing.

🛠️ Tech Stack
Python 3.12+

Backend: FastAPI

ML Engine: Hugging Face Transformers & PyTorch

Server: Uvicorn

Frontend: HTML5, CSS3, JavaScript (Fetch API)

📦 Installation & Setup
1. Clone the Repository
Bash

git clone <your-repo-url>
cd healthcare-chatbot
2. Install Dependencies
Install the required Python packages listed in requirements.txt:

Bash

pip install -r requirements.txt
Dependencies include: fastapi, uvicorn, transformers, torch, and pydantic.

3. Run the Backend Server
Start the FastAPI server using Uvicorn. This will download the model the first time you run it.

Bash

uvicorn main:app --reload
The API will start at http://127.0.0.1:8000.

The model Iloriayomide/my-symptom-checker-biobert will be cached locally.

4. Launch the Frontend
Simply open the index.html file in your web browser.

You can double-click the file in your file explorer.

The frontend is pre-configured to send requests to http://127.0.0.1:8000/predict.

🚀 Usage
Ensure the backend terminal shows Application startup complete.

Open index.html in your browser.

Type your symptoms into the text area (e.g., "I am feeling dizzy and have a stomach ache").

Click "Analyze Symptoms".

View the top 3 predicted conditions and their confidence scores.

📂 Project Structure
Plaintext

healthcare-chatbot/
│
├── main.py              # FastAPI backend and model inference logic
├── index.html           # User interface for symptom entry
├── requirements.txt     # Python dependencies
└── README.md            # Project documentation

⚠️ Important Disclaimer
This is an Artificial Intelligence project for educational and demonstration purposes only.

It is not a doctor and should not be used for medical diagnosis.

The predictions are based on statistical patterns in text and may be inaccurate.

Always consult a certified medical professional for health advice.
