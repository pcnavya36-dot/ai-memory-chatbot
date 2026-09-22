import os
import sys

from flask import Flask, request, jsonify
from flask_cors import CORS

# Project root folder-ai Python path-la add panrom
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, PROJECT_ROOT)

# Database functions
from database.database import (
    create_database,
    save_message,
    get_messages,
    clear_messages
)

app = Flask(__name__)
CORS(app)

# Create database when server starts
create_database()


@app.route("/")
def home():
    return jsonify({
        "message": "AI Memory Chatbot Backend is running!"
    })


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


@app.route("/messages", methods=["POST"])
def add_message():
    data = request.get_json()

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


@app.route("/messages", methods=["DELETE"])
def delete_messages():
    clear_messages()

    return jsonify({
        "message": "All messages cleared"
    })


if __name__ == "__main__":
    app.run(debug=True, port=5000)