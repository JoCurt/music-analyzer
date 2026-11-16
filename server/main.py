"""
Audio analysis FastAPI server.

Endpoints:
  GET  /api/health   -> health check
  POST /api/analyze  -> upload an audio file, get back detected key + chord progression

Usage:
    uvicorn main:app --reload
"""

import logging
import os
import tempfile

import librosa
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.concurrency import run_in_threadpool
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from analyzer import (
    CHORD_TEMPLATES,
    KEY_TEMPLATES,
    MAJOR_PROFILE,
    MINOR_PROFILE,
    NOTES,
    analyze_audio,
    detect_key,
    make_chord_templates,
    make_key_templates,
    recognize_chords,
)

__all__ = [
    "app",
    "CHORD_TEMPLATES",
    "KEY_TEMPLATES",
    "MAJOR_PROFILE",
    "MINOR_PROFILE",
    "NOTES",
    "analyze_audio",
    "detect_key",
    "make_chord_templates",
    "make_key_templates",
    "recognize_chords",
]

allowed_origins = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", "http://localhost:4200").split(",")
    if origin.strip()
]

app = FastAPI(title="Music Analyzer API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ChordEventModel(BaseModel):
    time: float
    chord: str


class AnalysisResponse(BaseModel):
    duration_seconds: float
    tempo_bpm: float
    key: str
    key_confidence: float
    chords: list[ChordEventModel]


@app.get("/")
async def root():
    return {"message": "Hello World"}


@app.get("/api/health")
async def health():
    return {"status": "ok"}


# ---------------------------------------------------------------------------
# API
# ---------------------------------------------------------------------------

MAX_UPLOAD_BYTES = 50 * 1024 * 1024  # 50 MB
UPLOAD_CHUNK_SIZE = 1024 * 1024  # 1 MB


async def save_upload_to_tempfile(
    audio: UploadFile, max_bytes: int = MAX_UPLOAD_BYTES
) -> str:
    """
    Stream an uploaded file to a temporary file on disk in chunks, enforcing
    both non-empty and maximum size constraints without buffering the full
    file in memory.
    """
    suffix = os.path.splitext(audio.filename or "")[1] or ".tmp"
    total_bytes = 0
    tmp_path = None

    try:
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp_file:
            tmp_path = tmp_file.name
            while chunk := await audio.read(UPLOAD_CHUNK_SIZE):
                total_bytes += len(chunk)
                if total_bytes > max_bytes:
                    raise HTTPException(
                        status_code=413,
                        detail=f"Uploaded file exceeds maximum size of {max_bytes // (1024 * 1024)} MB",
                    )
                tmp_file.write(chunk)

        if total_bytes == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty")

        return tmp_path
    except Exception:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)
        raise
    finally:
        await audio.close()


@app.post("/api/analyze", response_model=AnalysisResponse)
async def analyze(audio: UploadFile = File(...)):
    """
    Accepts an uploaded audio file (multipart/form-data, field name "audio")
    and returns its detected key and chord progression as JSON.
    """
    tmp_path = await save_upload_to_tempfile(audio)
    try:
        try:
            y, sr = await run_in_threadpool(librosa.load, tmp_path, sr=22050)
        except Exception as exc:
            logger.exception("Failed to decode uploaded audio")
            raise HTTPException(status_code=422, detail=f"Could not decode audio: {exc}")
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)

    if y.size == 0:
        raise HTTPException(status_code=422, detail="Decoded audio is empty")

    try:
        results = await run_in_threadpool(analyze_audio, y, sr)
    except Exception as exc:
        logger.exception("Analysis failed")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {exc}")

    return results
