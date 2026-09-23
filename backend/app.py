import os
import sys

from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from google import genai


# --------------------------------------------------
# Project root folder - Python path-la add panrom
# --------------------------------------------------

PROJECT_ROOT = os.path.dirname(
    os.path.dirname(os.path.abspath(__file__))
)

sys.path.insert(0, PROJECT_ROOT)


# --------------------------------------------------
# Load environment variables
# --------------------------------------------------

load_dotenv(
    os.path.join(PROJECT_ROOT, ".env")
)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise ValueError(
        "GEMINI_API_KEY not found in .env file"
    )


# --------------------------------------------------
# Gemini client
# --------------------------------------------------

client = genai.Client(
    api_key=GEMINI_API_KEY
)


# --------------------------------------------------
# Database functions
# --------------------------------------------------

from database.database import (
    create_database,
    save_message,
    get_messages,
    clear_messages
)


# --------------------------------------------------
# Flask app
# --------------------------------------------------

app = Flask(__name__)

CORS(app)


# --------------------------------------------------
# Create database when server starts
# --------------------------------------------------

create_database()


# --------------------------------------------------
# Home route
# --------------------------------------------------

@app.route("/")
def home():

    return jsonify({
        "message": "AI Memory Chatbot Backend is running!"
    })


# --------------------------------------------------
# Get all messages
# --------------------------------------------------

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


# --------------------------------------------------
# Save a message
# --------------------------------------------------

@app.route("/messages", methods=["POST"])
def add_message():

    data = request.get_json()

    if not data:
        return jsonify({
            "error": "JSON data is required"
        }), 400

    role = data.get("role")
    message = data.get("message")

    if not role or not message:

        return jsonify({
            "error": "role and message are required"
        }), 400

    save_message(role, message)

    return jsonify({
        "message": "Message saved successfully"
    })


# --------------------------------------------------
# Chat with Gemini
# --------------------------------------------------

@app.route("/chat", methods=["POST"])
def chat():

    data = request.get_json()

    if not data:
        return jsonify({
            "error": "JSON data is required"
        }), 400

    user_message = data.get("message")

    if not user_message:

        return jsonify({
            "error": "message is required"
        }), 400


    # Save user's message
    save_message(
        "user",
        user_message
    )


    try:

        # Get previous conversation
        previous_messages = get_messages()

        conversation = []

        for role, message in previous_messages:

            conversation.append(
                f"{role}: {message}"
            )


        # Give conversation + new message to Gemini
        prompt = """
You are an AI Memory Chatbot.

Use the previous conversation to understand
the user's context and answer naturally.

Previous conversation:
"""

        prompt += "\n".join(conversation)

        prompt += f"""

User's latest message:
{user_message}

Give a helpful and natural response.
"""


        # Gemini API call
        response = client.models.generate_content(
            model="gemini-3.6-flash",
            contents=prompt
        )


        bot_reply = response.text


        # Save Gemini response
        save_message(
            "assistant",
            bot_reply
        )


        return jsonify({
            "reply": bot_reply
        })


    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500


# --------------------------------------------------
# Delete all messages
# --------------------------------------------------

@app.route("/messages", methods=["DELETE"])
def delete_messages():

    clear_messages()

    return jsonify({
        "message": "All messages cleared"
    })


# --------------------------------------------------
# Run server
# --------------------------------------------------

if __name__ == "__main__":

    app.run(
        debug=False,
        port=5000
    )