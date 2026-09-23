import os
import sys

from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from google import genai

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

client = genai.Client(api_key=GEMINI_API_KEY)

# Project root folder-ai Python path-la add panrom
PROJECT_ROOT = os.path.dirname(
    os.path.dirname(os.path.abspath(__file__))
)

sys.path.insert(0, PROJECT_ROOT)


# Database functions
from database.database import (
    create_database,
    save_message,
    get_messages,
    clear_messages
)


# Memory functions
from memory import (
    add_message,
    get_messages as get_memory_messages,
    clear_memory
)


app = Flask(__name__)
CORS(app)


# Create database when server starts
create_database()


# ---------------- HOME ----------------

@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "message": "AI Memory Chatbot Backend is running!"
    })


# ---------------- ADD MESSAGE ----------------

@app.route("/messages", methods=["POST"])
def add_message_route():

    data = request.get_json()

    if not data:
        return jsonify({
            "error": "Request body is required"
        }), 400

    role = data.get("role")
    message = data.get("message")

    if not role or not message:
        return jsonify({
            "error": "role and message are required"
        }), 400

    # Save in memory
    add_message(role, message)

    # Save in database
    save_message(role, message)

    return jsonify({
        "message": "Message saved successfully",
        "role": role,
        "content": message
    })


# ---------------- GET MESSAGES ----------------

@app.route("/messages", methods=["GET"])
def messages():

    data = get_messages()

    result = []

    for role, message in data:
        result.append({
            "role": role,
            "message": message
        })

    return jsonify(result)


# ---------------- GET MEMORY ----------------

@app.route("/memory", methods=["GET"])
def memory():

    return jsonify({
        "conversation": get_memory_messages()
    })


# ---------------- CLEAR CHAT ----------------

@app.route("/messages", methods=["DELETE"])
def delete_messages():

    # Clear memory
    clear_memory()

    # Clear database
    clear_messages()

    return jsonify({
        "message": "All messages and memory cleared successfully"
    })
@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json()
    message = data.get("message")

    if not message:
        return jsonify({"error": "message is required"}), 400

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=message
    )

    return jsonify({
        "reply": response.text
    })


# ---------------- RUN SERVER ----------------

if __name__ == "__main__":
    app.run(
        debug=True,
        port=5000
    )