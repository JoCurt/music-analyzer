export interface ChordEvent {
  time: number;   // seconds, position in the track
  chord: string;  // e.g. "C#m", "A", "G#"
}

export interface AnalysisResult {
  duration_seconds: number;
  tempo_bpm: number;
  key: string;             // e.g. "A major"
  key_confidence: number;  // 0–1
  chords: ChordEvent[];
}
