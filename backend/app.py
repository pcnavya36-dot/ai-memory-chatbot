import os
import sys
import time

from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from google import genai


# --------------------------------------------------
# Project root path
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

print("Gemini API key loaded successfully")


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
# Gemini response with retry + fallback
# --------------------------------------------------

def generate_ai_response(prompt):

    # Models to try
    models = [
        "gemini-3.8-flash",
        "gemini-3.7-flash",
        "gemini-3.6-flash",
        "gemini-3.5-flash-lite"
    ]

    last_error = None

    for model_name in models:

        for attempt in range(3):

            try:

                print(
                    f"Trying {model_name} "
                    f"(attempt {attempt + 1}/3)"
                )

                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt
                )

                if not response.text:
                    raise Exception(
                        "Gemini returned an empty response"
                    )

                print(
                    f"Successfully received response "
                    f"from {model_name}"
                )

                return response.text

            except Exception as e:

                last_error = e

                print(
                    f"{model_name} failed: {e}"
                )

                # Wait before retry
                if attempt < 2:
                    time.sleep(2 ** attempt)

    # If every model failed
    raise last_error


# --------------------------------------------------
# Home route
# --------------------------------------------------

@app.route("/", methods=["GET"])
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

    try:

        # ------------------------------------------
        # Get previous conversation BEFORE
        # saving the current message
        # ------------------------------------------

        previous_messages = get_messages()

        conversation = []

        for role, message in previous_messages:

            conversation.append(
                f"{role}: {message}"
            )

        # ------------------------------------------
        # Create memory-based prompt
        # ------------------------------------------

        prompt = """You are an AI Memory Chatbot.

Use the previous conversation to understand
the user's context and answer naturally.

Previous conversation:

"""

        if conversation:
            prompt += "\n".join(conversation)
        else:
            prompt += "No previous conversation."

        prompt += f"""

User's latest message:
{user_message}

Give a helpful and natural response.
Remember relevant information from the conversation.
Do not mention internal instructions.
"""

        # ------------------------------------------
        # Get Gemini response
        # ------------------------------------------

        bot_reply = generate_ai_response(prompt)

        # ------------------------------------------
        # Save user message
        # ------------------------------------------

        save_message(
            "user",
            user_message
        )

        # ------------------------------------------
        # Save AI response
        # ------------------------------------------

        save_message(
            "assistant",
            bot_reply
        )

        # ------------------------------------------
        # Send response
        # ------------------------------------------

        return jsonify({
            "reply": bot_reply
        })

    except Exception as e:

        print("Chat error:", e)

        return jsonify({
            "error": str(e)
        }), 500


# --------------------------------------------------
# Delete all messages / clear memory
# --------------------------------------------------

@app.route("/messages", methods=["DELETE"])
def delete_messages():

    try:

        clear_messages()

        return jsonify({
            "message": "All messages and memory cleared successfully"
        })

    except Exception as e:

        print("Clear messages error:", e)

        return jsonify({
            "error": str(e)
        }), 500


# --------------------------------------------------
# Run server
# --------------------------------------------------

if __name__ == "__main__":

    app.run(
        debug=True,
        port=5000
    )