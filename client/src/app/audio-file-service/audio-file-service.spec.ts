import { TestBed } from '@angular/core/testing';

import { AudioFileService } from './audio-file-service';

describe('AudioFileService', () => {
  let service: AudioFileService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AudioFileService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should validate MP3 files by MIME type or .mp3 extension', () => {
    const mp3ByMime = new File([''], 'track.bin', { type: 'audio/mpeg' });
    const mp3ByExt = new File([''], 'track.MP3', { type: '' });
    const wavFile = new File([''], 'track.wav', { type: 'audio/wav' });

    expect(service.isValidMp3(mp3ByMime)).toBe(true);
    expect(service.isValidMp3(mp3ByExt)).toBe(true);
    expect(service.isValidMp3(wavFile)).toBe(false);
  });

  it('should reject null or non-MP3 files in saveFile', async () => {
    const wavFile = new File([''], 'track.wav', { type: 'audio/wav' });

    expect(await service.saveFile(null)).toBe(false);
    expect(await service.saveFile(wavFile)).toBe(false);
    expect(service.getFile()).toBeNull();
  });
});
