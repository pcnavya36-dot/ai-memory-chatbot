conversation = []

def add_message(role, content):
    conversation.append({
        "role": role,
        "content": content
    })

def get_messages():
    return conversation[-10:]

def clear_memory():
    conversation.clear()