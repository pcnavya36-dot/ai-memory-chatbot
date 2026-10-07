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
            pinned INTEGER DEFAULT 0,
            is_private INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    # Add user_id column to old chats table if missing
    cursor.execute("PRAGMA table_info(chats)")
    chat_columns = [
        column[1]
        for column in cursor.fetchall()
    ]

    if "user_id" not in chat_columns:
        cursor.execute("""
            ALTER TABLE chats
            ADD COLUMN user_id INTEGER
        """)
    # Check existing chats columns
    cursor.execute("PRAGMA table_info(chats)")

    chat_columns = [
        column[1]
        for column in cursor.fetchall()
    ]

# Add pinned column to old database if missing
    if "pinned" not in chat_columns:
        cursor.execute("""
           ALTER TABLE chats
           ADD COLUMN pinned INTEGER DEFAULT 0
        """)
    # Add is_private column to old database if missing
    if "is_private" not in chat_columns:
        cursor.execute("""
           ALTER TABLE chats
           ADD COLUMN is_private INTEGER DEFAULT 0
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
    # ------------------------------------------
# Users for Login / Signup
# ------------------------------------------
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS password_reset_tokens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            token_hash TEXT NOT NULL UNIQUE,
            expires_at TIMESTAMP NOT NULL,
            used INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    # ------------------------------------------
# Long-term AI memory
# ------------------------------------------
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS memories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            memory TEXT NOT NULL UNIQUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    # Add user_id column to old memories table if missing
    cursor.execute("PRAGMA table_info(memories)")

    memory_columns = [
        column[1]
        for column in cursor.fetchall()
    ]

    if "user_id" not in memory_columns:
        cursor.execute("""
            ALTER TABLE memories
            ADD COLUMN user_id INTEGER
        """)
            # ------------------------------------------
    # Private chat security
    # ------------------------------------------
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS security_settings (
            id INTEGER PRIMARY KEY,
            pin_hash TEXT
        )
    """)

    conn.commit()
    conn.close()
def save_private_pin(pin_hash):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    cursor.execute(
        """
        INSERT INTO security_settings (id, pin_hash)
        VALUES (1, ?)
        ON CONFLICT(id) DO UPDATE SET
            pin_hash = excluded.pin_hash
        """,
        (pin_hash,)
    )

    conn.commit()
    conn.close()


def get_private_pin():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT pin_hash
        FROM security_settings
        WHERE id = 1
        """
    )

    result = cursor.fetchone()

    conn.close()

    if result:
        return result[0]

    return None

    
def save_chat(
    chat_id,
    title,
    pinned=None,
    is_private=None,
    user_id=None
):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    # Get existing chat status
    cursor.execute(
        """
        SELECT pinned, is_private, user_id
        FROM chats
        WHERE id = ?
        """,
        (chat_id,)
    )

    existing_chat = cursor.fetchone()

    if existing_chat:
        current_pinned, current_private, current_user_id = existing_chat

        if pinned is None:
            pinned = current_pinned

        if is_private is None:
            is_private = current_private

        if user_id is None:
            user_id = current_user_id

    else:
        if pinned is None:
            pinned = 0

        if is_private is None:
            is_private = 0

    cursor.execute(
        """
        INSERT INTO chats (
            id,
            title,
            pinned,
            is_private,
            user_id
        )
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            title = excluded.title,
            pinned = excluded.pinned,
            is_private = excluded.is_private,
            user_id = excluded.user_id
        """,
        (
            chat_id,
            title,
            pinned,
            is_private,
            user_id
        )
    )

    conn.commit()
    conn.close()
def save_memory(memory, user_id):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    cursor.execute(
        """
        INSERT OR IGNORE INTO memories (
            memory,
            user_id
        )
        VALUES (?, ?)
        """,
        (
            memory,
            user_id
        )
    )

    conn.commit()
    conn.close()


def get_memories(user_id):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT memory
        FROM memories
        WHERE user_id = ?
        ORDER BY id
        """,
        (user_id,)
    )

    rows = cursor.fetchall()

    conn.close()

    return [row[0] for row in rows]
def get_chats(user_id):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT id, title, pinned, is_private
        FROM chats
        WHERE user_id = ?
        ORDER BY id
        """,
        (user_id,)
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

def get_messages(chat_id, user_id):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT messages.role, messages.message
        FROM messages
        INNER JOIN chats
            ON messages.chat_id = chats.id
        WHERE messages.chat_id = ?
          AND chats.user_id = ?
        ORDER BY messages.id
        """,
        (
            chat_id,
            user_id
        )
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
def create_user(name, email, password_hash):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    cursor.execute(
        """
        INSERT INTO users (name, email, password_hash)
        VALUES (?, ?, ?)
        """,
        (name, email, password_hash)
    )

    conn.commit()

    user_id = cursor.lastrowid

    conn.close()

    return user_id


def get_user_by_email(email):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT id, name, email, password_hash
        FROM users
        WHERE email = ?
        """,
        (email,)
    )

    user = cursor.fetchone()

    conn.close()

    return user

def create_password_reset_token(
    user_id,
    token_hash,
    expires_at
):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    cursor.execute(
        """
        INSERT INTO password_reset_tokens (
            user_id,
            token_hash,
            expires_at
        )
        VALUES (?, ?, ?)
        """,
        (
            user_id,
            token_hash,
            expires_at
        )
    )

    conn.commit()
    conn.close()


def get_password_reset_token(token_hash):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT id, user_id, expires_at, used
        FROM password_reset_tokens
        WHERE token_hash = ?
        """,
        (token_hash,)
    )

    token = cursor.fetchone()

    conn.close()
    return token


def mark_password_reset_token_used(token_id):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    cursor.execute(
        """
        UPDATE password_reset_tokens
        SET used = 1
        WHERE id = ?
        """,
        (token_id,)
    )

    conn.commit()
    conn.close()


def update_user_password(user_id, password_hash):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    cursor.execute(
        """
        UPDATE users
        SET password_hash = ?
        WHERE id = ?
        """,
        (
            password_hash,
            user_id
        )
    )

    conn.commit()
    conn.close()


if __name__ == "__main__":
    create_database()
    print("Database created successfully!")