import os
import sys
import time
import re
import secrets
import hashlib

from datetime import datetime, timedelta, timezone

from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv
from google import genai
from google.genai import types
import resend


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
resend.api_key = os.getenv("RESEND_API_KEY")


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
    clear_messages,
    save_chat,
    get_chats,
    delete_chat,
    save_private_pin,
    get_private_pin,
    save_memory,
    get_memories,
    create_user,
    get_user_by_email,
    create_password_reset_token,
    get_password_reset_token,
    mark_password_reset_token_used,
    update_user_password,
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

        for attempt in range(1):

            try:

                print(
                    f"Trying {model_name} "
                    f"(attempt {attempt + 1}/3)"
                )

                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        thinking_config=types.ThinkingConfig(
                            thinking_level="low"
                        )
                    )
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
@app.route("/signup", methods=["POST"])
def signup():
    data = request.get_json()

    if not data:
        return jsonify({"error": "JSON data is required"}), 400

    name = str(data.get("name", "")).strip()
    email = str(data.get("email", "")).strip().lower()
    password = str(data.get("password", ""))

    if not name or not email or not password:
        return jsonify({
            "error": "Name, email and password are required"
        }), 400

    if len(password) < 6:
        return jsonify({
            "error": "Password must be at least 6 characters"
        }), 400

    existing_user = get_user_by_email(email)

    if existing_user:
        return jsonify({
            "error": "Email is already registered"
        }), 409

    try:
        password_hash = generate_password_hash(password)

        user_id = create_user(
            name,
            email,
            password_hash
        )

        return jsonify({
            "message": "Account created successfully",
            "user": {
                "id": user_id,
                "name": name,
                "email": email
            }
        }), 201

    except Exception as e:
        print("Signup error:", e)

        return jsonify({
            "error": "Could not create account"
        }), 500
@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()

    if not data:
        return jsonify({
            "error": "JSON data is required"
        }), 400

    email = str(
        data.get("email", "")
    ).strip().lower()

    password = str(
        data.get("password", "")
    )

    if not email or not password:
        return jsonify({
            "error": "Email and password are required"
        }), 400

    user = get_user_by_email(email)

    if not user:
        return jsonify({
            "error": "Invalid email or password"
        }), 401

    user_id, name, saved_email, password_hash = user

    if not check_password_hash(
        password_hash,
        password
    ):
        return jsonify({
            "error": "Invalid email or password"
        }), 401

    return jsonify({
        "message": "Login successful",
        "user": {
            "id": user_id,
            "name": name,
            "email": saved_email
        }
    })
    
@app.route("/forgot-password", methods=["POST"])
def forgot_password():
    data = request.get_json()

    if not data:
        return jsonify({
            "message": "If an account exists, a password reset link has been sent."
        })

    email = str(
        data.get("email", "")
    ).strip().lower()

    if not email:
        return jsonify({
            "message": "If an account exists, a password reset link has been sent."
        })

    try:
        user = get_user_by_email(email)

        # Do not reveal whether the email exists
        if not user:
            return jsonify({
                "message": "If an account exists, a password reset link has been sent."
            })

        user_id, name, saved_email, password_hash = user

        # Create a secure random token
        raw_token = secrets.token_urlsafe(48)

        # Store only the SHA-256 hash in the database
        token_hash = hashlib.sha256(
            raw_token.encode("utf-8")
        ).hexdigest()

        expires_at = (
            datetime.now(timezone.utc)
            + timedelta(minutes=30)
        ).isoformat()

        create_password_reset_token(
            user_id,
            token_hash,
            expires_at
        )

        frontend_url = os.getenv(
            "FRONTEND_URL",
            "http://localhost:5173"
        ).rstrip("/")

        reset_link = (
            f"{frontend_url}/reset-password"
            f"?token={raw_token}"
        )

        resend.Emails.send({
            "from": os.getenv(
                "RESEND_FROM_EMAIL",
                "onboarding@resend.dev"
            ),
            "to": [saved_email],
            "subject": "Reset your AI Memory Chatbot password",
            "html": f"""
                <div style="font-family: Arial, sans-serif;">
                    <h2>Password Reset</h2>

                    <p>Hello {name},</p>

                    <p>
                        We received a request to reset your
                        AI Memory Chatbot password.
                    </p>

                    <p>
                        <a href="{reset_link}"
                           style="
                               display:inline-block;
                               padding:12px 20px;
                               background:#7c3aed;
                               color:white;
                               text-decoration:none;
                               border-radius:8px;
                           ">
                            Reset Password
                        </a>
                    </p>

                    <p>
                        This link expires in 30 minutes.
                    </p>

                    <p>
                        If you did not request this,
                        you can ignore this email.
                    </p>
                </div>
            """
        })

        return jsonify({
            "message": "If an account exists, a password reset link has been sent."
        })

    except Exception as e:
        print("Forgot password error:", e)

        return jsonify({
            "error": "Unable to process password reset request"
        }), 500
        
@app.route("/reset-password", methods=["POST"])
def reset_password():
    data = request.get_json()

    if not data:
        return jsonify({
            "error": "JSON data is required"
        }), 400

    token = str(
        data.get("token", "")
    ).strip()

    new_password = str(
        data.get("new_password", "")
    )

    if not token or not new_password:
        return jsonify({
            "error": "Token and new password are required"
        }), 400

    if len(new_password) < 6:
        return jsonify({
            "error": "Password must be at least 6 characters"
        }), 400

    try:
        token_hash = hashlib.sha256(
            token.encode("utf-8")
        ).hexdigest()

        reset_token = get_password_reset_token(
            token_hash
        )

        if not reset_token:
            return jsonify({
                "error": "Invalid or expired reset link"
            }), 400

        token_id, user_id, expires_at, used = reset_token

        if used:
            return jsonify({
                "error": "This reset link has already been used"
            }), 400

        expires_datetime = datetime.fromisoformat(
            expires_at
        )

        if expires_datetime < datetime.now(timezone.utc):
            return jsonify({
                "error": "This reset link has expired"
            }), 400

        new_password_hash = generate_password_hash(
            new_password
        )

        update_user_password(
            user_id,
            new_password_hash
        )

        mark_password_reset_token_used(
            token_id
        )

        return jsonify({
            "message": "Password reset successful"
        })

    except Exception as e:
        print("Reset password error:", e)

        return jsonify({
            "error": "Unable to reset password"
        }), 500
# --------------------------------------------------
# Get all chats
# --------------------------------------------------

@app.route("/chats", methods=["GET"])
def chats():
    user_id = request.args.get(
        "user_id",
        type=int
    )

    if user_id is None:
        return jsonify({
            "error": "user_id is required"
        }), 400

    data = get_chats(user_id)

    result = []

    for chat_id, title, pinned, is_private in data:
        result.append({
            "id": chat_id,
            "title": title,
            "pinned": bool(pinned),
            "is_private": bool(is_private)
        })

    return jsonify(result)
# --------------------------------------------------
# Create or update a chat
# --------------------------------------------------

@app.route("/chats", methods=["POST"])
def save_chat_route():
    data = request.get_json()

    if not data:
        return jsonify({
            "error": "JSON data is required"
        }), 400

    chat_id = data.get("id")
    title = data.get("title")
    pinned = data.get("pinned")
    is_private = data.get("is_private")
    user_id = data.get("user_id")

    if chat_id is None or not title:
        return jsonify({
            "error": "id and title are required"
        }), 400

    if user_id is None:
        return jsonify({
            "error": "user_id is required"
        }), 400

    try:
        save_chat(
            chat_id,
            title,
            None if pinned is None
            else (1 if pinned else 0),
            None if is_private is None
            else (1 if is_private else 0),
            user_id
        )

        return jsonify({
            "message": "Chat saved successfully"
        })

    except Exception as e:
        print("Save chat error:", e)

        return jsonify({
            "error": str(e)
        }), 500
# --------------------------------------------------
# Get all messages
# --------------------------------------------------

@app.route("/messages", methods=["GET"])
def messages():
    chat_id = request.args.get(
        "chat_id",
        default=1,
        type=int
    )

    user_id = request.args.get(
        "user_id",
        type=int
    )

    if user_id is None:
        return jsonify({
            "error": "user_id is required"
        }), 400

    data = get_messages(
        chat_id,
        user_id
    )

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
@app.route("/private-pin/setup", methods=["POST"])
def setup_private_pin():
    data = request.get_json()

    if not data:
        return jsonify({
            "error": "JSON data is required"
        }), 400

    pin = str(data.get("pin", "")).strip()

    if not pin.isdigit() or len(pin) < 4 or len(pin) > 8:
        return jsonify({
            "error": "PIN must contain 4 to 8 digits"
        }), 400

    try:
        existing_pin = get_private_pin()

        if existing_pin:
            return jsonify({
                "error": "Private PIN is already set"
            }), 409

        pin_hash = generate_password_hash(pin)

        save_private_pin(pin_hash)

        return jsonify({
            "message": "Private PIN created successfully"
        })

    except Exception as e:
        print("Private PIN setup error:", e)

        return jsonify({
            "error": str(e)
        }), 500
        
@app.route("/private-pin/verify", methods=["POST"])
def verify_private_pin():
    data = request.get_json()

    if not data:
        return jsonify({
            "error": "JSON data is required"
        }), 400

    pin = str(data.get("pin", "")).strip()

    if not pin:
        return jsonify({
            "error": "PIN is required"
        }), 400

    try:
        saved_pin_hash = get_private_pin()

        if not saved_pin_hash:
            return jsonify({
                "error": "Private PIN has not been set"
            }), 404

        if not check_password_hash(
            saved_pin_hash,
            pin
        ):
            return jsonify({
                "error": "Incorrect PIN"
            }), 401

        return jsonify({
            "message": "PIN verified successfully"
        })

    except Exception as e:
        print("Private PIN verification error:", e)

        return jsonify({
            "error": str(e)
        }), 500
@app.route("/chat", methods=["POST"])
def chat():

    data = request.get_json()

    if not data:

        return jsonify({
            "error": "JSON data is required"
        }), 400

    user_message = data.get("message")
    memory_enabled = data.get("memory_enabled", True)
    chat_id = data.get("chat_id", 1)
    user_id = data.get("user_id")
    private_mode = data.get("private_mode", False)

    if not user_message:

        return jsonify({
            "error": "message is required"
        }), 400

    try:

        # ------------------------------------------
        # Get previous conversation BEFORE
        # saving the current message
        # ------------------------------------------
        # Save useful personal facts as long-term memory
        if memory_enabled and not private_mode:
            memory_patterns = [
               r"\bmy name is\b",
               r"\bi live in\b",
               r"\bmy favorite\b",
               r"\bmy favourite\b",
               r"\bremember that\b",
            ]   

            if any(
                re.search(pattern, user_message, re.IGNORECASE)
                for pattern in memory_patterns
         ):
                save_memory(user_message, user_id)
    # Load long-term memory only for normal chats
        if memory_enabled and not private_mode:
            long_term_memories = get_memories(user_id)
        else:
            long_term_memories = []
        if memory_enabled:
            previous_messages = get_messages(
                chat_id,
                user_id
        )    
                  
        else:
            previous_messages = []

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
                # Add long-term memories
        if long_term_memories:
            prompt += "\n\nLong-term memories about the user:\n"

            prompt += "\n".join(
                f"- {memory}"
                for memory in long_term_memories
            )
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

        if memory_enabled:
            save_message(
                chat_id,
                "user",
                user_message
            )

            save_message(
                chat_id,
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
# Delete messages from one chat
# --------------------------------------------------

@app.route("/messages/<int:chat_id>", methods=["DELETE"])
def delete_chat_messages(chat_id):
    try:
        delete_chat(chat_id)

        return jsonify({
            "message": f"Chat {chat_id} deleted successfully"
        })

    except Exception as e:
        print("Delete chat error:", e)

        return jsonify({
            "error": str(e)
        }), 500

# --------------------------------------------------
# Run server
# --------------------------------------------------

if __name__ == "__main__":

    app.run(
    debug=True,
    host="0.0.0.0",
    port=5000
)