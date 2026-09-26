import sqlite3
import os

DB_NAME = os.path.join(os.path.dirname(__file__), "chatbot.db")


def create_database():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    # Create messages table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            chat_id INTEGER,
            role TEXT NOT NULL,
            message TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Check existing messages columns
    cursor.execute("PRAGMA table_info(messages)")
    columns = [
        column[1]
        for column in cursor.fetchall()
    ]

    # Add chat_id to old database if missing
    if "chat_id" not in columns:
        cursor.execute("""
            ALTER TABLE messages
            ADD COLUMN chat_id INTEGER
        """)

    # Create chats table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS chats (
            id INTEGER PRIMARY KEY,
            title TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Add default chats only if chats table is empty
    cursor.execute("SELECT COUNT(*) FROM chats")
    chat_count = cursor.fetchone()[0]

    if chat_count == 0:
        cursor.executemany(
            """
            INSERT INTO chats (id, title)
            VALUES (?, ?)
            """,
            [
                (1, "AI Project Discussion"),
                (2, "Python Programming"),
                (3, "Database Concepts"),
            ]
        )

    conn.commit()
    conn.close()
def save_chat(chat_id, title):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    cursor.execute(
        """
        INSERT OR REPLACE INTO chats (id, title)
        VALUES (?, ?)
        """,
        (chat_id, title)
    )

    conn.commit()
    conn.close()

def get_chats():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT id, title
        FROM chats
        ORDER BY id
        """
    )

    chats = cursor.fetchall()

    conn.close()

    return chats

def delete_chat(chat_id):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    # Delete messages belonging to this chat
    cursor.execute(
        "DELETE FROM messages WHERE chat_id = ?",
        (chat_id,)
    )

    # Delete chat from chat list
    cursor.execute(
        "DELETE FROM chats WHERE id = ?",
        (chat_id,)
    )

    conn.commit()
    conn.close()

def save_message(chat_id, role, message):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    cursor.execute(
        """
        INSERT INTO messages (chat_id, role, message)
        VALUES (?, ?, ?)
        """,
        (chat_id, role, message)
    )

    # Create chats table

    conn.commit()
    conn.close()

def get_messages(chat_id):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT role, message
        FROM messages
        WHERE chat_id = ?
        ORDER BY id
        """,
        (chat_id,)
    )

    messages = cursor.fetchall()

    conn.close()

    return messages


def clear_messages(chat_id=None):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    if chat_id is None:
        cursor.execute("DELETE FROM messages")
    else:
        cursor.execute(
            "DELETE FROM messages WHERE chat_id = ?",
            (chat_id,)
        )

    conn.commit()
    conn.close()


if __name__ == "__main__":
    create_database()
    print("Database created successfully!")