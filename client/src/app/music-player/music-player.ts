import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  ViewChild,
  ElementRef,
  HostListener,
} from '@angular/core';

import { AudioFileService } from '../audio-file-service/audio-file-service';
import { BasicInformation } from '../basic-information/basic-information';

import { Subscription } from 'rxjs';
import WaveSurfer from 'wavesurfer.js';
import { AnalysisResultComponent } from '../analysis-result/analysis-result';
import { CurrentPlayerTimestampService } from '../current-player-timestamp-service/current-player-timestamp-service';
import { LucideDynamicIcon, LucideFastForward, LucideRewind } from '@lucide/angular';

@Component({
  selector: 'music-player',
  standalone: true,
  imports: [
    BasicInformation,
    AnalysisResultComponent,
    LucideRewind,
    LucideFastForward,
    LucideDynamicIcon,
  ],
  templateUrl: './music-player.html',
  styleUrl: './music-player.scss',
})
export class MusicPlayer implements AfterViewInit, OnDestroy {
  private audioService = inject(AudioFileService);
  private currentTimestampService = inject(CurrentPlayerTimestampService);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('waveformContainer') waveformContainer!: ElementRef<HTMLElement>;

  wave?: WaveSurfer;
  volume = 1;
  isPlaying = false;
  audioFile: File | null = null;
  private audioUrl: string | null = null;
  private seekSubscription?: Subscription;

  ngAfterViewInit(): void {
    this.audioFile = this.audioService.getFile();
    this.currentTimestampService.updateTime(0);

    this.wave = WaveSurfer.create({
      container: this.waveformContainer.nativeElement,
      waveColor: '#f3e0ecff',
      progressColor: '#dca3b8',
      height: 'auto',
    });

    this.volume = this.wave.getVolume();

    this.seekSubscription = this.currentTimestampService
      .getSeekRequestsObservable()
      .subscribe((targetTime) => {
        if (this.wave) {
          const duration = this.wave.getDuration();
          const clamped = duration > 0 ? Math.min(duration, Math.max(0, targetTime)) : Math.max(0, targetTime);
          this.wave.setTime(clamped);
        }
      });

    this.wave.on('play', () => {
      this.isPlaying = true;
      this.cdr.markForCheck();
    });

    this.wave.on('pause', () => {
      this.isPlaying = false;
      this.cdr.markForCheck();
    });

    this.wave.on('finish', () => {
      this.isPlaying = false;
      this.cdr.markForCheck();
    });

    // Transfer current player timestamp to current-player-timestamp-service
    this.wave.on('audioprocess', (currentTime: number) => {
      this.currentTimestampService.updateTime(currentTime);
    });

    // Listen for when the user clicks/seeks on the waveform
    this.wave.on('interaction', () => {
      if (this.wave) {
        const exactTime = this.wave.getCurrentTime();
        this.currentTimestampService.updateTime(exactTime);
      }
    });

    if (this.audioFile) {
      this.audioUrl = URL.createObjectURL(this.audioFile);
      this.wave.load(this.audioUrl);
    }
  }

  togglePlayback(): void {
    if (this.wave) {
      this.wave.playPause();
      this.isPlaying = this.wave.isPlaying();
    }
  }

  skip(offsetSeconds: number): void {
    if (!this.wave) {
      return;
    }
    const duration = this.wave.getDuration();
    const targetTime = Math.min(duration, Math.max(0, this.wave.getCurrentTime() + offsetSeconds));
    this.wave.setTime(targetTime);
    this.currentTimestampService.updateTime(targetTime);
  }

  onVolumeChange(newVolume: number): void {
    this.volume = newVolume;
    this.wave?.setVolume(newVolume);
  }

  onSpeedChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const selectedSpeed = parseFloat(selectElement.value);

    this.wave?.setPlaybackRate(selectedSpeed, true);
  }

  ngOnDestroy(): void {
    this.seekSubscription?.unsubscribe();
    this.wave?.destroy();
    this.currentTimestampService.updateTime(0);

    if (this.audioUrl) {
      URL.revokeObjectURL(this.audioUrl);
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    const activeElement = document.activeElement as HTMLElement | null;
    if (
      activeElement &&
      (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')
    ) {
      return;
    }

    switch (event.key) {
      case ' ':
        event.preventDefault();
        this.togglePlayback();
        break;

      case 'ArrowLeft':
        event.preventDefault();
        this.skip(-5);
        break;

      case 'ArrowRight':
        event.preventDefault();
        this.skip(5);
        break;
    }
  }
}
