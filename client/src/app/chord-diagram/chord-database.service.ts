import { Injectable } from '@angular/core';
import { Chord, OPEN, SILENT } from 'svguitar';

/**
 * Guitar chord database for all 24 major and minor triads produced by the backend.
 * Uses SVGuitar's standard string numbering:
 *   string 6 = low E (leftmost) ... string 1 = high e (rightmost).
 */
const CHORD_DATABASE: Record<string, Chord> = {
  C: {
    position: 1,
    fingers: [
      [6, SILENT],
      [5, 3, '3'],
      [4, 2, '2'],
      [3, OPEN],
      [2, 1, '1'],
      [1, OPEN],
    ],
    barres: [],
  },
  Cm: {
    position: 3,
    fingers: [
      [6, SILENT],
      [4, 3, '3'],
      [3, 3, '4'],
      [2, 2, '2'],
    ],
    barres: [{ fromString: 5, toString: 1, fret: 1, text: '1' }],
  },
  'C#': {
    position: 4,
    fingers: [
      [6, SILENT],
      [4, 3, '2'],
      [3, 3, '3'],
      [2, 3, '4'],
    ],
    barres: [{ fromString: 5, toString: 1, fret: 1, text: '1' }],
  },
  'C#m': {
    position: 4,
    fingers: [
      [6, SILENT],
      [4, 3, '3'],
      [3, 3, '4'],
      [2, 2, '2'],
    ],
    barres: [{ fromString: 5, toString: 1, fret: 1, text: '1' }],
  },
  D: {
    position: 1,
    fingers: [
      [6, SILENT],
      [5, SILENT],
      [4, OPEN],
      [3, 2, '1'],
      [2, 3, '3'],
      [1, 2, '2'],
    ],
    barres: [],
  },
  Dm: {
    position: 1,
    fingers: [
      [6, SILENT],
      [5, SILENT],
      [4, OPEN],
      [3, 2, '2'],
      [2, 3, '3'],
      [1, 1, '1'],
    ],
    barres: [],
  },
  'D#': {
    position: 6,
    fingers: [
      [6, SILENT],
      [4, 3, '2'],
      [3, 3, '3'],
      [2, 3, '4'],
    ],
    barres: [{ fromString: 5, toString: 1, fret: 1, text: '1' }],
  },
  'D#m': {
    position: 6,
    fingers: [
      [6, SILENT],
      [4, 3, '3'],
      [3, 3, '4'],
      [2, 2, '2'],
    ],
    barres: [{ fromString: 5, toString: 1, fret: 1, text: '1' }],
  },
  E: {
    position: 1,
    fingers: [
      [6, OPEN],
      [5, 2, '2'],
      [4, 2, '3'],
      [3, 1, '1'],
      [2, OPEN],
      [1, OPEN],
    ],
    barres: [],
  },
  Em: {
    position: 1,
    fingers: [
      [6, OPEN],
      [5, 2, '2'],
      [4, 2, '3'],
      [3, OPEN],
      [2, OPEN],
      [1, OPEN],
    ],
    barres: [],
  },
  F: {
    position: 1,
    fingers: [
      [5, 3, '3'],
      [4, 3, '4'],
      [3, 2, '2'],
    ],
    barres: [{ fromString: 6, toString: 1, fret: 1, text: '1' }],
  },
  Fm: {
    position: 1,
    fingers: [
      [5, 3, '3'],
      [4, 3, '4'],
    ],
    barres: [{ fromString: 6, toString: 1, fret: 1, text: '1' }],
  },
  'F#': {
    position: 2,
    fingers: [
      [5, 3, '3'],
      [4, 3, '4'],
      [3, 2, '2'],
    ],
    barres: [{ fromString: 6, toString: 1, fret: 1, text: '1' }],
  },
  'F#m': {
    position: 2,
    fingers: [
      [5, 3, '3'],
      [4, 3, '4'],
    ],
    barres: [{ fromString: 6, toString: 1, fret: 1, text: '1' }],
  },
  G: {
    position: 1,
    fingers: [
      [6, 3, '2'],
      [5, 2, '1'],
      [4, OPEN],
      [3, OPEN],
      [2, OPEN],
      [1, 3, '3'],
    ],
    barres: [],
  },
  Gm: {
    position: 3,
    fingers: [
      [5, 3, '3'],
      [4, 3, '4'],
    ],
    barres: [{ fromString: 6, toString: 1, fret: 1, text: '1' }],
  },
  'G#': {
    position: 4,
    fingers: [
      [5, 3, '3'],
      [4, 3, '4'],
      [3, 2, '2'],
    ],
    barres: [{ fromString: 6, toString: 1, fret: 1, text: '1' }],
  },
  'G#m': {
    position: 4,
    fingers: [
      [5, 3, '3'],
      [4, 3, '4'],
    ],
    barres: [{ fromString: 6, toString: 1, fret: 1, text: '1' }],
  },
  A: {
    position: 1,
    fingers: [
      [6, SILENT],
      [5, OPEN],
      [4, 2, '1'],
      [3, 2, '2'],
      [2, 2, '3'],
      [1, OPEN],
    ],
    barres: [],
  },
  Am: {
    position: 1,
    fingers: [
      [6, SILENT],
      [5, OPEN],
      [4, 2, '2'],
      [3, 2, '3'],
      [2, 1, '1'],
      [1, OPEN],
    ],
    barres: [],
  },
  'A#': {
    position: 1,
    fingers: [
      [6, SILENT],
      [4, 3, '2'],
      [3, 3, '3'],
      [2, 3, '4'],
    ],
    barres: [{ fromString: 5, toString: 1, fret: 1, text: '1' }],
  },
  'A#m': {
    position: 1,
    fingers: [
      [6, SILENT],
      [4, 3, '3'],
      [3, 3, '4'],
      [2, 2, '2'],
    ],
    barres: [{ fromString: 5, toString: 1, fret: 1, text: '1' }],
  },
  B: {
    position: 2,
    fingers: [
      [6, SILENT],
      [4, 3, '2'],
      [3, 3, '3'],
      [2, 3, '4'],
    ],
    barres: [{ fromString: 5, toString: 1, fret: 1, text: '1' }],
  },
  Bm: {
    position: 2,
    fingers: [
      [6, SILENT],
      [4, 3, '3'],
      [3, 3, '4'],
      [2, 2, '2'],
    ],
    barres: [{ fromString: 5, toString: 1, fret: 1, text: '1' }],
  },
};

@Injectable({
  providedIn: 'root',
})
export class ChordDatabaseService {
  getChord(chordName: string | null | undefined): Chord | null {
    if (!chordName) {
      return null;
    }
    return CHORD_DATABASE[chordName.trim()] ?? null;
  }

  getAllChordNames(): string[] {
    return Object.keys(CHORD_DATABASE);
  }
}
