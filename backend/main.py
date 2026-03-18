from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import json, os
from datetime import datetime
import anthropic
from apscheduler.schedulers.asyncio import AsyncIOScheduler

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

os.makedirs("data", exist_ok=True)
client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY", ""))
scheduler = AsyncIOScheduler()

@app.on_event("startup")
async def startup():
    scheduler.start()
    print("UniAgent backend started!")

@app.on_event("shutdown")
async def shutdown():
    scheduler.shutdown()

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]

class LoginCredentials(BaseModel):
    username: str
    password: str

@app.get("/")
def root(): return {"status": "UniAgent running"}

@app.get("/health")
def health(): return {"ok": True}

@app.post("/sync")
async def sync(): return {"success": True, "message": "Sync triggered"}

@app.get("/assignments")
def get_assignments(): return []

@app.get("/attendance")
def get_attendance(): return []

@app.post("/chat")
async def chat(req: ChatRequest):
    try:
        messages = [{"role": m.role, "content": m.content} for m in req.messages]
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1000,
            system="You are a helpful university AI tutor for a COMSATS Islamabad student. Help with courses, deadlines, assignments and studying. Be friendly and encouraging.",
            messages=messages
        )
        return {"reply": response.content[0].text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/quiz/generate")
async def generate_quiz(course: str, count: int = 4):
    try:
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1000,
            system='Generate multiple choice questions. Return ONLY a JSON array like: [{"q":"question","options":["A","B","C","D"],"answer":0}]',
            messages=[{"role": "user", "content": f"Generate {count} quiz questions for {course}"}]
        )
        text = response.content[0].text.strip().replace("```json","").replace("```","")
        return {"questions": json.loads(text)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/settings/credentials")
def save_credentials(creds: LoginCredentials):
    with open("data/credentials.json", "w") as f:
        json.dump({"username": creds.username, "password": creds.password}, f)
    return {"saved": True}

from fastapi.responses import JSONResponse

@app.post("/chat2")
async def chat2(req: dict):
    try:
        msgs = req.get("messages", [])
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1000,
            system="You are a helpful university AI tutor for a COMSATS student.",
            messages=[{"role": m["role"], "content": m["content"]} for m in msgs]
        )
        return {"reply": response.content[0].text}
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})
