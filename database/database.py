import sqlite3
import os

DB_NAME = os.path.join(os.path.dirname(__file__), "chatbot.db")


def create_database():
    conn = sqlite3.connect(DB_NAME)

    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            role TEXT NOT NULL,
            message TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    conn.commit()
    conn.close()


def save_message(role, message):
    conn = sqlite3.connect(DB_NAME)

    cursor = conn.cursor()

    cursor.execute(
        "INSERT INTO messages (role, message) VALUES (?, ?)",
        (role, message)
    )

    conn.commit()
    conn.close()


def get_messages():
    conn = sqlite3.connect(DB_NAME)

    cursor = conn.cursor()

    cursor.execute(
        "SELECT role, message FROM messages ORDER BY id"
    )

    messages = cursor.fetchall()

    conn.close()

    return messages


def clear_messages():
    conn = sqlite3.connect(DB_NAME)

    cursor = conn.cursor()

    cursor.execute("DELETE FROM messages")

    conn.commit()
    conn.close()


if __name__ == "__main__":
    create_database()
    print("Database created successfully!")