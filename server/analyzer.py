"""
Core audio DSP and music-theory analysis module.

Provides pure functions for chord recognition, Krumhansl-Schmuckler key
detection, and beat-synchronous track analysis.
"""

import librosa
import numpy as np

# ---------------------------------------------------------------------------
# Chord recognition
# ---------------------------------------------------------------------------

NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']


def make_chord_templates() -> dict[str, np.ndarray]:
    """Build 24 binary triad templates (12 major + 12 minor)."""
    templates: dict[str, np.ndarray] = {}
    major_intervals = [0, 4, 7]
    minor_intervals = [0, 3, 7]
    for i, root in enumerate(NOTES):
        maj = np.zeros(12)
        minr = np.zeros(12)
        for interval in major_intervals:
            maj[(i + interval) % 12] = 1
        for interval in minor_intervals:
            minr[(i + interval) % 12] = 1
        templates[f'{root}'] = maj
        templates[f'{root}m'] = minr
    return templates


CHORD_TEMPLATES = make_chord_templates()


def recognize_chords(
    chroma: np.ndarray, templates: dict[str, np.ndarray] | None = None
) -> list[str]:
    """Match each chroma column against chord templates via cosine similarity."""
    active_templates = templates if templates is not None else CHORD_TEMPLATES
    chord_names = list(active_templates.keys())
    template_matrix = np.array([active_templates[c] for c in chord_names])

    # Normalize so only the *shape* of the pitch-class distribution matters
    template_matrix = template_matrix / (
        np.linalg.norm(template_matrix, axis=1, keepdims=True) + 1e-8
    )
    chroma_norm = chroma / (np.linalg.norm(chroma, axis=0, keepdims=True) + 1e-8)

    similarities = template_matrix @ chroma_norm  # (24, n_frames)
    best_chords = np.argmax(similarities, axis=0)

    return [chord_names[i] for i in best_chords]


# ---------------------------------------------------------------------------
# Key detection (Krumhansl-Schmuckler algorithm)
# ---------------------------------------------------------------------------

MAJOR_PROFILE = np.array(
    [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88]
)
MINOR_PROFILE = np.array(
    [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17]
)


def make_key_templates() -> dict[str, np.ndarray]:
    """Build 24 rotated key profile templates (12 major + 12 minor)."""
    templates: dict[str, np.ndarray] = {}
    for i, root in enumerate(NOTES):
        templates[f'{root} major'] = np.roll(MAJOR_PROFILE, i)
        templates[f'{root} minor'] = np.roll(MINOR_PROFILE, i)
    return templates


KEY_TEMPLATES = make_key_templates()


def detect_key(
    chroma_mean: np.ndarray, templates: dict[str, np.ndarray] | None = None
) -> tuple[str, float, dict[str, float]]:
    """Match an aggregated chroma vector against key templates via cosine similarity."""
    active_templates = templates if templates is not None else KEY_TEMPLATES
    key_names = list(active_templates.keys())
    template_matrix = np.array([active_templates[k] for k in key_names])

    template_matrix = template_matrix / np.linalg.norm(
        template_matrix, axis=1, keepdims=True
    )
    chroma_norm = chroma_mean / (np.linalg.norm(chroma_mean) + 1e-8)

    similarities = template_matrix @ chroma_norm  # (24,)
    best_idx = int(np.argmax(similarities))

    return (
        key_names[best_idx],
        float(similarities[best_idx]),
        dict(zip(key_names, similarities)),
    )


# ---------------------------------------------------------------------------
# Core analysis (pure function: audio in, structured results out)
# ---------------------------------------------------------------------------


def analyze_audio(y: np.ndarray, sr: int) -> dict:
    """
    Run full analysis on a loaded waveform:
      1. Extract chroma features
      2. Beat-sync chroma for stable, musically-meaningful chord segments
      3. Recognize chord per beat
      4. Detect overall key from whole-track chroma

    Returns a dict of plain Python types (no numpy), ready for JSON.
    """
    duration = librosa.get_duration(y=y, sr=sr)

    # Chroma extraction
    chroma = librosa.feature.chroma_cqt(y=y, sr=sr, hop_length=512)

    # Beat-synchronous chroma for stable chord estimates
    tempo, beat_frames = librosa.beat.beat_track(y=y, sr=sr)
    if len(beat_frames) > 0:
        chroma_sync = librosa.util.sync(chroma, beat_frames, aggregate=np.median)
        beat_times = librosa.frames_to_time(beat_frames, sr=sr, hop_length=512)

        # librosa.util.sync can return one extra leading column (segment before
        # the first beat) — pad beat_times with 0.0 to keep them aligned.
        if chroma_sync.shape[1] == len(beat_times) + 1:
            beat_times = np.concatenate([[0.0], beat_times])
    else:
        # Fallback when beat_track detects no beats (short or beatless audio)
        chroma_sync = np.median(chroma, axis=1, keepdims=True)
        beat_times = np.array([0.0])

    # Chord recognition (beat-level), collapsed to only show chord changes
    chords_per_beat = recognize_chords(chroma_sync, CHORD_TEMPLATES)

    chord_progression = []
    prev_chord = None
    for t, chord in zip(beat_times, chords_per_beat):
        if chord != prev_chord:
            chord_progression.append({'time': float(t), 'chord': chord})
            prev_chord = chord

    # Key detection (whole-track)
    chroma_mean = np.mean(chroma, axis=1)
    key, score, _ = detect_key(chroma_mean, KEY_TEMPLATES)

    # In some librosa versions, beat_track returns tempo as a 1-element
    # (or occasionally multi-element) array rather than a plain scalar.
    tempo_value = float(np.asarray(tempo).flatten()[0])

    return {
        'duration_seconds': round(float(duration), 2),
        'tempo_bpm': round(tempo_value, 1),
        'key': key,
        'key_confidence': round(float(score), 4),
        'chords': chord_progression,
    }
