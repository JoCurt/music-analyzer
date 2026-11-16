import { TestBed } from '@angular/core/testing';
import { ChordDatabaseService } from './chord-database.service';

describe('ChordDatabaseService', () => {
  let service: ChordDatabaseService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ChordDatabaseService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should contain all 24 major and minor chords matching backend NOTES', () => {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    expect(service.getAllChordNames().length).toBe(24);

    for (const root of notes) {
      const maj = service.getChord(root);
      const min = service.getChord(`${root}m`);

      expect(maj).not.toBeNull();
      expect(maj?.fingers.length).toBeGreaterThan(0);

      expect(min).not.toBeNull();
      expect(min?.fingers.length).toBeGreaterThan(0);
    }
  });

  it('should return null for unknown or empty chord names', () => {
    expect(service.getChord(null)).toBeNull();
    expect(service.getChord('')).toBeNull();
    expect(service.getChord('Hmaj9')).toBeNull();
  });
});
