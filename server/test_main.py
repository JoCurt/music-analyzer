import asyncio
import io
import json
import time
import unittest
from unittest.mock import patch

import httpx
import numpy as np
import soundfile as sf

import main


def make_wav_bytes(duration_sec: float = 2.0, sr: int = 22050) -> bytes:
    t = np.linspace(0, duration_sec, int(sr * duration_sec), endpoint=False)
    # C major triad (C4, E4, G4)
    waveform = (
        np.sin(2 * np.pi * 261.63 * t)
        + np.sin(2 * np.pi * 329.63 * t)
        + np.sin(2 * np.pi * 392.00 * t)
    ) / 3.0
    buf = io.BytesIO()
    sf.write(buf, waveform, sr, format="WAV")
    return buf.getvalue()


class TestChordRecognition(unittest.TestCase):
    def test_make_chord_templates_structure_and_intervals(self):
        templates = main.make_chord_templates()
        self.assertEqual(len(templates), 24)
        self.assertIn("C", templates)
        self.assertIn("Am", templates)

        # C major triad: C (0), E (4), G (7)
        expected_c = np.zeros(12)
        expected_c[[0, 4, 7]] = 1
        np.testing.assert_array_equal(templates["C"], expected_c)

        # A minor triad: A (9), C (0), E (4)
        expected_am = np.zeros(12)
        expected_am[[9, 0, 4]] = 1
        np.testing.assert_array_equal(templates["Am"], expected_am)

    def test_recognize_chords_identifies_progression(self):
        templates = main.make_chord_templates()
        # 4 frames corresponding to C, G, Am, F
        chroma = np.column_stack(
            [
                templates["C"],
                templates["G"],
                templates["Am"],
                templates["F"],
            ]
        )
        detected = main.recognize_chords(chroma, templates)
        self.assertEqual(detected, ["C", "G", "Am", "F"])


class TestKeyDetection(unittest.TestCase):
    def test_make_key_templates_count(self):
        templates = main.make_key_templates()
        self.assertEqual(len(templates), 24)
        self.assertIn("C major", templates)
        self.assertIn("A minor", templates)

    def test_detect_key_identifies_major_and_minor_keys(self):
        templates = main.make_key_templates()

        # D is index 2 in NOTES
        d_major_chroma = np.roll(main.MAJOR_PROFILE, 2)
        key, score, all_scores = main.detect_key(d_major_chroma, templates)
        self.assertEqual(key, "D major")
        self.assertAlmostEqual(float(score), 1.0, places=5)
        self.assertEqual(len(all_scores), 24)

        # E is index 4 in NOTES
        e_minor_chroma = np.roll(main.MINOR_PROFILE, 4)
        key_min, score_min, _ = main.detect_key(e_minor_chroma, templates)
        self.assertEqual(key_min, "E minor")
        self.assertAlmostEqual(float(score_min), 1.0, places=5)


class TestAnalyzeAudio(unittest.TestCase):
    def test_analyze_audio_returns_json_serializable_results(self):
        sr = 22050
        duration = 2.0
        t = np.linspace(0, duration, int(sr * duration), endpoint=False)
        # Synthesize C major chord with periodic amplitude pulses at 120 BPM (every 0.5s)
        envelope = 0.5 + 0.5 * np.cos(2 * np.pi * 2.0 * t) ** 8
        y = envelope * (
            np.sin(2 * np.pi * 261.63 * t)
            + np.sin(2 * np.pi * 329.63 * t)
            + np.sin(2 * np.pi * 392.00 * t)
        ) / 3.0

        result = main.analyze_audio(y.astype(np.float32), sr)

        # Verify JSON serializability (no raw numpy scalars/arrays)
        serialized = json.dumps(result)
        self.assertIsInstance(serialized, str)

        self.assertAlmostEqual(result["duration_seconds"], 2.0, places=1)
        self.assertIsInstance(result["tempo_bpm"], float)
        self.assertIsInstance(result["key"], str)
        self.assertGreater(result["key_confidence"], 0.5)
        self.assertIsInstance(result["chords"], list)
        self.assertGreaterEqual(len(result["chords"]), 1)
        self.assertEqual(result["chords"][0]["chord"], "C")

    def test_analyze_audio_handles_zero_detected_beats(self):
        sr = 22050
        t = np.linspace(0, 1.0, sr, endpoint=False)
        y = np.sin(2 * np.pi * 440.0 * t).astype(np.float32)

        with patch.object(
            main.librosa.beat, "beat_track", return_value=(0.0, np.array([], dtype=int))
        ):
            result = main.analyze_audio(y, sr)

        self.assertEqual(result["tempo_bpm"], 0.0)
        self.assertEqual(len(result["chords"]), 1)
        self.assertEqual(result["chords"][0]["time"], 0.0)


class TestAnalyzeEndpoint(unittest.IsolatedAsyncioTestCase):
    async def test_health_endpoint_returns_ok(self):
        transport = httpx.ASGITransport(app=main.app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.get("/api/health")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json(), {"status": "ok"})
    async def test_analyze_does_not_block_event_loop(self):
        wav_bytes = make_wav_bytes()
        original_analyze = main.analyze_audio

        def slow_analyze(y, sr):
            time.sleep(0.3)
            return original_analyze(y, sr)

        transport = httpx.ASGITransport(app=main.app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            with patch.object(main, "analyze_audio", side_effect=slow_analyze):
                analyze_task = asyncio.create_task(
                    client.post(
                        "/api/analyze",
                        files={"audio": ("chord.wav", wav_bytes, "audio/wav")},
                    )
                )
                await asyncio.sleep(0.05)

                start_ping = time.perf_counter()
                ping_resp = await client.get("/")
                ping_elapsed = time.perf_counter() - start_ping

                analyze_resp = await analyze_task

        self.assertEqual(ping_resp.status_code, 200)
        self.assertLess(
            ping_elapsed,
            0.15,
            "Event loop was blocked during synchronous audio analysis",
        )
        self.assertEqual(analyze_resp.status_code, 200)
        body = analyze_resp.json()
        self.assertIn("key", body)
        self.assertIn("chords", body)

    async def test_empty_upload_returns_400(self):
        transport = httpx.ASGITransport(app=main.app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post(
                "/api/analyze",
                files={"audio": ("empty.mp3", b"", "audio/mpeg")},
            )
        self.assertEqual(resp.status_code, 400)
        self.assertIn("empty", resp.json()["detail"].lower())

    async def test_oversized_upload_returns_413(self):
        transport = httpx.ASGITransport(app=main.app)
        original_save = main.save_upload_to_tempfile

        async def small_limit_save(audio):
            return await original_save(audio, max_bytes=1024)

        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            with patch.object(main, "save_upload_to_tempfile", side_effect=small_limit_save):
                resp = await client.post(
                    "/api/analyze",
                    files={"audio": ("huge.mp3", b"x" * 2048, "audio/mpeg")},
                )
        self.assertEqual(resp.status_code, 413)
        self.assertIn("exceeds maximum size", resp.json()["detail"].lower())

    async def test_corrupted_audio_returns_422(self):
        transport = httpx.ASGITransport(app=main.app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post(
                "/api/analyze",
                files={"audio": ("corrupt.wav", b"not-valid-audio-data", "audio/wav")},
            )
        self.assertEqual(resp.status_code, 422)
        self.assertIn("could not decode audio", resp.json()["detail"].lower())

    async def test_empty_decoded_waveform_returns_422(self):
        transport = httpx.ASGITransport(app=main.app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            with patch.object(
                main.librosa, "load", return_value=(np.array([], dtype=np.float32), 22050)
            ):
                resp = await client.post(
                    "/api/analyze",
                    files={"audio": ("silent.wav", b"dummy-bytes", "audio/wav")},
                )
        self.assertEqual(resp.status_code, 422)
        self.assertIn("decoded audio is empty", resp.json()["detail"].lower())

    async def test_unexpected_analysis_exception_returns_500(self):
        wav_bytes = make_wav_bytes()
        transport = httpx.ASGITransport(app=main.app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            with patch.object(main, "analyze_audio", side_effect=RuntimeError("DSP boom")):
                resp = await client.post(
                    "/api/analyze",
                    files={"audio": ("chord.wav", wav_bytes, "audio/wav")},
                )
        self.assertEqual(resp.status_code, 500)
        self.assertIn("analysis failed", resp.json()["detail"].lower())


if __name__ == "__main__":
    unittest.main()
