from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
from transformers import BertTokenizer, BertForSequenceClassification
import re

app = Flask(__name__)
CORS(app)

MODEL_PATH = r"path_to_local_model"
tokenizer = BertTokenizer.from_pretrained(MODEL_PATH)
model = BertForSequenceClassification.from_pretrained(MODEL_PATH)
model.eval()

def clean_text(text):
    text = text.lower()
    text = re.sub(r'https?://\S+|www\.\S+', '_url_', text)
    text = re.sub(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', '_email_', text)
    text = re.sub(r"[^a-zA-Z0-9\s'\"?!.,]", '', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def predict_email(text):
    cleaned_text = clean_text(text)
    inputs = tokenizer(cleaned_text, padding="max_length", truncation=True, max_length=256, return_tensors="pt")
    
    with torch.no_grad():
        outputs = model(**inputs)

    logits = outputs.logits
    prediction = torch.argmax(logits, dim=1).item()
    
    return "Phishing Email" if prediction == 1 else "Legitimate Email"

@app.route("/predict", methods=["POST"])
def predict():
    data = request.json
    email_text = data.get("text", "")
    prediction = predict_email(email_text)
    return jsonify({"prediction": prediction})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
