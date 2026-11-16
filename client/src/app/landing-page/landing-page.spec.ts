import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { vi } from 'vitest';

import { LandingPage } from './landing-page';
import { AudioFileService } from '../audio-file-service/audio-file-service';
import { AnalysisService } from '../analysis-service/analysis-service';

describe('LandingPage', () => {
  let component: LandingPage;
  let fixture: ComponentFixture<LandingPage>;
  let audioFileServiceMock: { saveFile: ReturnType<typeof vi.fn> };
  let analysisServiceMock: { reset: ReturnType<typeof vi.fn>; analyze: ReturnType<typeof vi.fn> };
  let routerMock: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    audioFileServiceMock = {
      saveFile: vi.fn(),
    };
    analysisServiceMock = {
      reset: vi.fn(),
      analyze: vi.fn(),
    };
    routerMock = {
      navigate: vi.fn().mockResolvedValue(true),
    };

    await TestBed.configureTestingModule({
      imports: [LandingPage],
      providers: [
        { provide: AudioFileService, useValue: audioFileServiceMock },
        { provide: AnalysisService, useValue: analysisServiceMock },
        { provide: Router, useValue: routerMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LandingPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should save file, trigger analysis, and navigate when a valid MP3 is selected', async () => {
    audioFileServiceMock.saveFile.mockResolvedValue(true);
    const mockFile = new File(['dummy'], 'song.mp3', { type: 'audio/mpeg' });
    const event = { target: { files: [mockFile], value: 'C:\\fakepath\\song.mp3' } } as unknown as Event;

    await component.onFileSelected(event);

    expect(audioFileServiceMock.saveFile).toHaveBeenCalledWith(mockFile);
    expect(component.errorMessage()).toBeNull();
    expect(analysisServiceMock.reset).toHaveBeenCalled();
    expect(analysisServiceMock.analyze).toHaveBeenCalledWith(mockFile);
    expect(routerMock.navigate).toHaveBeenCalledWith(['/music-player']);
  });

  it('should show an error message and not analyze or navigate when saveFile returns false', async () => {
    audioFileServiceMock.saveFile.mockResolvedValue(false);
    const mockFile = new File(['dummy'], 'invalid.wav', { type: 'audio/wav' });
    const mockInput = { files: [mockFile], value: 'C:\\fakepath\\invalid.wav' };
    const event = { target: mockInput } as unknown as Event;

    await component.onFileSelected(event);
    await fixture.whenStable();

    expect(audioFileServiceMock.saveFile).toHaveBeenCalledWith(mockFile);
    expect(component.errorMessage()).toContain('Please upload a valid MP3 file');
    expect(mockInput.value).toBe('');
    expect(analysisServiceMock.reset).not.toHaveBeenCalled();
    expect(analysisServiceMock.analyze).not.toHaveBeenCalled();
    expect(routerMock.navigate).not.toHaveBeenCalled();

    const errorEl = (fixture.nativeElement as HTMLElement).querySelector('.error-message');
    expect(errorEl?.textContent).toContain('Please upload a valid MP3 file');
  });
});
