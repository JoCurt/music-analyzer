export interface ChordEvent {
  time: number;
  chord: string;
}

export interface AnalysisResult {
  duration_seconds: number;
  tempo_bpm: number;
  key: string;
  key_confidence: number;
  chords: ChordEvent[];
}
