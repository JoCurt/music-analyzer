import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import {
  provideLucideIcons,
  LucideRewind,
  LucidePlay,
  LucidePause,
  LucideFastForward,
  LucideVolume2,
} from '@lucide/angular';
import { firstValueFrom } from 'rxjs';
import { vi } from 'vitest';
import WaveSurfer from 'wavesurfer.js';

import { MusicPlayer } from './music-player';
import { audioLoadedGuard, routes } from '../app.routes';
import { AudioFileService } from '../audio-file-service/audio-file-service';
import { CurrentPlayerTimestampService } from '../current-player-timestamp-service/current-player-timestamp-service';

describe('MusicPlayer & audioLoadedGuard', () => {
  let component: MusicPlayer;
  let fixture: ComponentFixture<MusicPlayer>;
  let eventHandlers: Record<string, (...args: unknown[]) => void>;
  let audioFileServiceMock: {
    getFile: ReturnType<typeof vi.fn>;
    getTitleObservable: ReturnType<typeof vi.fn>;
    getLengthObservable: ReturnType<typeof vi.fn>;
  };
  let waveMock: {
    getVolume: ReturnType<typeof vi.fn>;
    setVolume: ReturnType<typeof vi.fn>;
    on: ReturnType<typeof vi.fn>;
    load: ReturnType<typeof vi.fn>;
    playPause: ReturnType<typeof vi.fn>;
    isPlaying: ReturnType<typeof vi.fn>;
    getCurrentTime: ReturnType<typeof vi.fn>;
    getDuration: ReturnType<typeof vi.fn>;
    setTime: ReturnType<typeof vi.fn>;
    setPlaybackRate: ReturnType<typeof vi.fn>;
    destroy: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    const { BehaviorSubject } = await import('rxjs');
    eventHandlers = {};
    audioFileServiceMock = {
      getFile: vi.fn().mockReturnValue(null),
      getTitleObservable: vi.fn().mockReturnValue(new BehaviorSubject(undefined)),
      getLengthObservable: vi.fn().mockReturnValue(new BehaviorSubject(undefined)),
    };

    waveMock = {
      getVolume: vi.fn().mockReturnValue(1),
      setVolume: vi.fn(),
      on: vi.fn((event: string, cb: (...args: unknown[]) => void) => {
        eventHandlers[event] = cb;
      }),
      load: vi.fn(),
      playPause: vi.fn(),
      isPlaying: vi.fn().mockReturnValue(false),
      getCurrentTime: vi.fn().mockReturnValue(10),
      getDuration: vi.fn().mockReturnValue(100),
      setTime: vi.fn(),
      setPlaybackRate: vi.fn(),
      destroy: vi.fn(),
    };

    vi.spyOn(WaveSurfer, 'create').mockReturnValue(waveMock as unknown as WaveSurfer);

    await TestBed.configureTestingModule({
      imports: [MusicPlayer],
      providers: [
        provideRouter(routes),
        provideHttpClient(),
        provideLucideIcons(
          LucideRewind,
          LucidePlay,
          LucidePause,
          LucideFastForward,
          LucideVolume2,
        ),
        { provide: AudioFileService, useValue: audioFileServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MusicPlayer);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create MusicPlayer', () => {
    expect(component).toBeTruthy();
  });

  it('should clamp skip() between 0 and duration and update CurrentPlayerTimestampService', async () => {
    const timestampService = TestBed.inject(CurrentPlayerTimestampService);

    waveMock.getCurrentTime.mockReturnValue(2);
    component.skip(-5);
    expect(waveMock.setTime).toHaveBeenCalledWith(0);
    expect(await firstValueFrom(timestampService.currentTimestamp$)).toBe(0);

    waveMock.getCurrentTime.mockReturnValue(98);
    component.skip(5);
    expect(waveMock.setTime).toHaveBeenCalledWith(100);
    expect(await firstValueFrom(timestampService.currentTimestamp$)).toBe(100);
  });

  it('should synchronize isPlaying with WaveSurfer play, pause, and finish events', () => {
    expect(component.isPlaying).toBe(false);

    eventHandlers['play']?.();
    expect(component.isPlaying).toBe(true);

    eventHandlers['finish']?.();
    expect(component.isPlaying).toBe(false);

    eventHandlers['play']?.();
    expect(component.isPlaying).toBe(true);

    eventHandlers['pause']?.();
    expect(component.isPlaying).toBe(false);
  });

  it('should reset CurrentPlayerTimestampService to 0 on destroy', async () => {
    const timestampService = TestBed.inject(CurrentPlayerTimestampService);
    timestampService.updateTime(55);
    expect(await firstValueFrom(timestampService.currentTimestamp$)).toBe(55);

    component.ngOnDestroy();
    expect(await firstValueFrom(timestampService.currentTimestamp$)).toBe(0);
  });

  it('should seek WaveSurfer when CurrentPlayerTimestampService.seekTo is called', () => {
    const timestampService = TestBed.inject(CurrentPlayerTimestampService);
    timestampService.seekTo(33.5);
    expect(waveMock.setTime).toHaveBeenCalledWith(33.5);
  });

  it('should redirect to / in audioLoadedGuard when no file is loaded', () => {
    audioFileServiceMock.getFile.mockReturnValue(null);
    const result = TestBed.runInInjectionContext(() =>
      audioLoadedGuard({} as never, {} as never),
    );
    const router = TestBed.inject(Router);
    expect(result instanceof UrlTree).toBe(true);
    expect(router.serializeUrl(result as UrlTree)).toBe('/');
  });

  it('should allow activation in audioLoadedGuard when an audio file is loaded', () => {
    const file = new File(['dummy'], 'song.mp3', { type: 'audio/mpeg' });
    audioFileServiceMock.getFile.mockReturnValue(file);
    const result = TestBed.runInInjectionContext(() =>
      audioLoadedGuard({} as never, {} as never),
    );
    expect(result).toBe(true);
  });
});
