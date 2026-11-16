import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';

import { AnalysisService } from './analysis-service';
import { AnalysisResult } from './analysis-result.model';

describe('AnalysisService', () => {
  let service: AnalysisService;
  let httpMock: HttpTestingController;
  const apiUrl = 'http://localhost:8000/api/analyze';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AnalysisService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should upload audio and emit result and success status', async () => {
    const file = new File(['audio-bytes'], 'song.mp3', { type: 'audio/mpeg' });
    const mockResult: AnalysisResult = {
      duration_seconds: 180,
      tempo_bpm: 120,
      key: 'A minor',
      key_confidence: 0.85,
      chords: [{ time: 0, chord: 'Am' }],
    };

    service.analyze(file);
    expect(await firstValueFrom(service.getStatusObservable())).toBe('loading');

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');
    req.flush(mockResult);

    expect(await firstValueFrom(service.getStatusObservable())).toBe('success');
    expect(await firstValueFrom(service.getResultObservable())).toEqual(mockResult);
    expect(await firstValueFrom(service.getErrorObservable())).toBeNull();
  });

  it('should emit error status and message when the request fails', async () => {
    const file = new File(['audio-bytes'], 'song.mp3', { type: 'audio/mpeg' });

    service.analyze(file);
    const req = httpMock.expectOne(apiUrl);
    req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

    expect(await firstValueFrom(service.getStatusObservable())).toBe('error');
    expect(await firstValueFrom(service.getErrorObservable())).toContain(
      'Failed to analyze the audio file',
    );
  });

  it('should cancel a previous in-flight request when analyze() or reset() is called', async () => {
    const file1 = new File(['1'], 'song1.mp3', { type: 'audio/mpeg' });
    const file2 = new File(['2'], 'song2.mp3', { type: 'audio/mpeg' });

    service.analyze(file1);
    const req1 = httpMock.expectOne(apiUrl);
    expect(req1.cancelled).toBe(false);

    service.analyze(file2);
    expect(req1.cancelled).toBe(true);

    const req2 = httpMock.expectOne(apiUrl);
    expect(req2.cancelled).toBe(false);

    service.reset();
    expect(req2.cancelled).toBe(true);
    expect(await firstValueFrom(service.getStatusObservable())).toBe('idle');
    expect(await firstValueFrom(service.getResultObservable())).toBeNull();
  });
});
