import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { vi } from 'vitest';

import { AnalysisResultComponent } from './analysis-result';
import { AnalysisService, AnalysisStatus } from '../analysis-service/analysis-service';
import { AnalysisResult } from '../analysis-service/analysis-result.model';
import { AudioFileService } from '../audio-file-service/audio-file-service';

describe('AnalysisResultComponent', () => {
  let component: AnalysisResultComponent;
  let fixture: ComponentFixture<AnalysisResultComponent>;

  let resultSubject: BehaviorSubject<AnalysisResult | null>;
  let statusSubject: BehaviorSubject<AnalysisStatus>;
  let errorSubject: BehaviorSubject<string | null>;
  let analysisServiceMock: {
    getResultObservable: () => BehaviorSubject<AnalysisResult | null>;
    getStatusObservable: () => BehaviorSubject<AnalysisStatus>;
    getErrorObservable: () => BehaviorSubject<string | null>;
    analyze: ReturnType<typeof vi.fn>;
  };
  let audioFileServiceMock: {
    getFile: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    resultSubject = new BehaviorSubject<AnalysisResult | null>(null);
    statusSubject = new BehaviorSubject<AnalysisStatus>('loading');
    errorSubject = new BehaviorSubject<string | null>(null);

    analysisServiceMock = {
      getResultObservable: () => resultSubject,
      getStatusObservable: () => statusSubject,
      getErrorObservable: () => errorSubject,
      analyze: vi.fn(),
    };

    audioFileServiceMock = {
      getFile: vi.fn().mockReturnValue(null),
    };

    await TestBed.configureTestingModule({
      imports: [AnalysisResultComponent],
      providers: [
        { provide: AnalysisService, useValue: analysisServiceMock },
        { provide: AudioFileService, useValue: audioFileServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AnalysisResultComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create and show loading message while loading', () => {
    expect(component).toBeTruthy();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.loading-container')?.textContent).toContain(
      'Analyzing your audio...',
    );
  });

  it('should render the 3-slot carousel and chord diagrams on success', async () => {
    resultSubject.next({
      duration_seconds: 120,
      tempo_bpm: 128,
      key: 'C major',
      key_confidence: 0.91,
      chords: [
        { time: 0.0, chord: 'C' },
        { time: 1.0, chord: 'G' },
        { time: 2.0, chord: 'Am' },
      ],
    });
    statusSubject.next('success');
    component.currentTimestampService.updateTime(1.2);
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.basic-information')?.textContent).toContain('C major');
    expect(compiled.querySelector('.basic-information')?.textContent).toContain('128 BPM');

    expect(component.previousChord).toEqual({ time: 0.0, chord: 'C' });
    expect(component.currentChord).toEqual({ time: 1.0, chord: 'G' });
    expect(component.nextChord).toEqual({ time: 2.0, chord: 'Am' });

    const diagrams = compiled.querySelectorAll('app-chord-diagram svg');
    expect(diagrams.length).toBe(3);
  });

  it('should display error message and retry analysis when Try Again is clicked', async () => {
    const mockFile = new File(['dummy'], 'song.mp3', { type: 'audio/mpeg' });
    audioFileServiceMock.getFile.mockReturnValue(mockFile);

    errorSubject.next('Failed to analyze the audio file. Please try again.');
    statusSubject.next('error');
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const errorContainer = compiled.querySelector('.error-container');
    expect(errorContainer).toBeTruthy();
    expect(errorContainer?.textContent).toContain(
      'Failed to analyze the audio file. Please try again.',
    );

    const retryBtn = compiled.querySelector('.retry-btn') as HTMLButtonElement;
    retryBtn.click();
    expect(analysisServiceMock.analyze).toHaveBeenCalledWith(mockFile);
  });

  it('should update previousChord, currentChord, and nextChord across intro, middle, and end of track', () => {
    resultSubject.next({
      duration_seconds: 120,
      tempo_bpm: 120,
      key: 'C major',
      key_confidence: 0.9,
      chords: [
        { time: 1.5, chord: 'C' },
        { time: 3.0, chord: 'G' },
        { time: 4.5, chord: 'Am' },
      ],
    });
    statusSubject.next('success');

    // Before first chord (t = 0): previous and current are null, next previews the 1st chord
    expect(component.previousChord).toBeNull();
    expect(component.currentChord).toBeNull();
    expect(component.nextChord).toEqual({ time: 1.5, chord: 'C' });

    // On 1st chord (t = 1.5): previous is null, current is C, next is G
    component.currentTimestampService.updateTime(1.5);
    expect(component.previousChord).toBeNull();
    expect(component.currentChord).toEqual({ time: 1.5, chord: 'C' });
    expect(component.nextChord).toEqual({ time: 3.0, chord: 'G' });

    // On 2nd chord (t = 3.5): previous is C, current is G, next is Am
    component.currentTimestampService.updateTime(3.5);
    expect(component.previousChord).toEqual({ time: 1.5, chord: 'C' });
    expect(component.currentChord).toEqual({ time: 3.0, chord: 'G' });
    expect(component.nextChord).toEqual({ time: 4.5, chord: 'Am' });

    // On final chord (t = 5.0): previous is G, current is Am, next is null
    component.currentTimestampService.updateTime(5.0);
    expect(component.previousChord).toEqual({ time: 3.0, chord: 'G' });
    expect(component.currentChord).toEqual({ time: 4.5, chord: 'Am' });
    expect(component.nextChord).toBeNull();
  });

  it('should seek to previous or next chord when its carousel card is clicked', async () => {
    resultSubject.next({
      duration_seconds: 120,
      tempo_bpm: 120,
      key: 'C major',
      key_confidence: 0.9,
      chords: [
        { time: 1.0, chord: 'C' },
        { time: 2.5, chord: 'G' },
        { time: 4.0, chord: 'Am' },
      ],
    });
    statusSubject.next('success');
    component.currentTimestampService.updateTime(2.6);
    await fixture.whenStable();

    const seekPromise = firstValueFrom(
      component.currentTimestampService.getSeekRequestsObservable(),
    );
    const nextBtn = (fixture.nativeElement as HTMLElement).querySelector(
      '.next-card',
    ) as HTMLButtonElement;
    nextBtn.click();

    expect(await seekPromise).toBe(4.0);
    expect(component.currentChord).toEqual({ time: 4.0, chord: 'Am' });
  });
});
