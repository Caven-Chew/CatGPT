import os
import sqlite3
from datetime import datetime
import requests
from openai import OpenAI, types
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS
import uuid

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
CAT_API_KEY = os.getenv('CAT_API_KEY')

DB_FILE = "./chat_history.db"

def init_db():
    with sqlite3.connect(DB_FILE) as conn:
        conn.execute('''
            CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            room_id TEXT NOT NULL,
            send_from TEXT NOT NULL,
            message TEXT NOT NULL,    
            response_id TEXT,    
            timestamp TEXT NOT NULL
        )
        ''')

def save_message_to_db(room_id, send_from, message, response_id=None):
    with sqlite3.connect(DB_FILE) as conn:
        conn.execute('''
            INSERT INTO messages (room_id, send_from, message, response_id, timestamp)
            VALUES (?, ?, ?, ?, ?)
        ''', (
            room_id,
            send_from,
            message,
            response_id,
            datetime.now().isoformat()
        ))

def get_all_rooms():
    with sqlite3.connect(DB_FILE) as conn:
        rows = conn.execute('''
            SELECT DISTINCT room_id FROM messages ORDER BY timestamp DESC
        ''').fetchall()
    return [row[0] for row in rows]

def get_latest_response_id(room_id):
    with sqlite3.connect(DB_FILE) as conn:
        row = conn.execute('''
            SELECT response_id
            FROM messages
            WHERE room_id = ? AND response_id IS NOT NULL
            ORDER BY timestamp DESC
            LIMIT 1
        ''', (room_id,)).fetchone()

    return row[0] if row else None

def get_messages_by_room(room_id):
    with sqlite3.connect(DB_FILE) as conn:
        rows = conn.execute('''
            SELECT id, room_id, send_from, message, response_id, timestamp
            FROM messages
            WHERE room_id = ?
            ORDER BY timestamp ASC
        ''', (room_id,)).fetchall()

    return [
        {
            "id": row[0],
            "room_id": row[1],
            "send_from": row[2],     # "user" or "assistant"
            "message": row[3],
            "response_id": row[4],
            "timestamp": row[5]
        }
        for row in rows
    ]


# The function spec (used by OpenAI Assistant)
tools = [{
    "type": "function",
    "name": "get_random_cat",  # ← needs to be here
    "function": {
        "description": "Get a random cat image and breed info from TheCatAPI",
        "parameters": {
            "type": "object",
            "properties": {},
            "required": []
        }
    }
}]

def get_random_cat():
    headers = {"x-api-key": CAT_API_KEY}
    params = {"has_breeds": 1}

    response = requests.get("https://api.thecatapi.com/v1/images/search", headers=headers, params=params)
    response.raise_for_status()
    data = response.json()

    if not data:
        return {"text": "Could not fetch a cat right now 😿"}

    image_url = data[0]["url"]
    if "breeds" in data[0] and data[0]["breeds"]:
        breed = data[0]["breeds"][0]
        return {
            "name": breed["name"],
            "description": breed["description"],
            "origin": breed.get("origin", "Unknown"),
            "image_url": image_url
        }
    else:
        return {
            "text": "Here's a cute random cat!",
            "image_url": image_url
        }

# Call OpenAI with function capability
def chat_with_function(user_input, room_id, prev_response_id=None):
    if not room_id:
        room_id = str(uuid.uuid4())

    input_messages = [
        {
            "type": "message",
            "role": "user",
            "content": user_input
        }
    ]
    
    save_message_to_db(room_id, "User", user_input)

    # First round: model might decide to call a function
    response = client.responses.create(
        model="gpt-4o-mini",
        input=user_input,
        previous_response_id=prev_response_id,
        tools=tools,
        tool_choice="auto",
    )

    new_response_id = response.id

    if response.output and response.output[0].type == "function_call":
        tool_call = response.output[0]  # Get the tool call object
        result = get_random_cat()

        #prepare input
        input_messages.append({
            "type": "function_call_output",
            "call_id": tool_call.call_id,
            "output": str(result)
        })

        # Send function output back to the model
        follow_up = client.responses.create(
        model="gpt-4o-mini",
            input=input_messages,
            tools=tools,
            previous_response_id=new_response_id
        )
        
        message = follow_up.output[0].content[0].text
        new_response_id = follow_up.id

        save_message_to_db(room_id, "System", message, new_response_id)
        return {
            "message":message, 
            "response_id":new_response_id
        }

    else:
        message = response.output[0].content[0].text
        save_message_to_db(room_id, "System", message, new_response_id)
        return {
            "message":message, 
            "response_id":new_response_id
        }
    
def chat_service():
    app = Flask(__name__)
    CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})
    
    @app.route("/api/chat", methods=["POST"])
    def chat():
        data = request.json
        user_input = data["user_input"]
        room_id = data.get("room_id", None)
        prev_response_id = get_latest_response_id(room_id)
        reply = chat_with_function(user_input, room_id, prev_response_id)
        return jsonify({"reply": reply})
    
    @app.route("/api/rooms", methods=["GET"])
    def list_rooms():
        rooms = get_all_rooms()
        return jsonify({"rooms": rooms})
    
    @app.route("/api/history/<room_id>", methods=["GET"])
    def history(room_id):
        messages = get_messages_by_room(room_id)
        return jsonify(messages)
    
    return app

if __name__ == "__main__":
    init_db()
    app = chat_service()
    app.run(debug=True)
