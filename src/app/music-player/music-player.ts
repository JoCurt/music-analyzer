import { AfterViewInit, Component, inject, OnDestroy, ViewChild, ElementRef, HostListener } from '@angular/core';

import { AudioFileService } from '../audio-file-service/audio-file-service';
import { BasicInformation} from '../basic-information/basic-information';

import WaveSurfer from 'wavesurfer.js';
import { AnalysisResultComponent } from '../analysis-result/analysis-result';
import { CurrentPlayerTimestampService } from '../current-player-timestamp-service/current-player-timestamp-service';

@Component({
  selector: 'music-player',
  standalone: true,
  imports: [BasicInformation, AnalysisResultComponent],
  templateUrl: './music-player.html',
  styleUrl: './music-player.scss',
})
export class MusicPlayer implements AfterViewInit, OnDestroy {
  private audioService = inject(AudioFileService);
  private currentTimestampService = inject(CurrentPlayerTimestampService);

  @ViewChild('waveformContainer') waveformContainer!: ElementRef;

  wave!: WaveSurfer;
  volume: number = 1;
  audioFile: any;
  private audioUrl: string | null = null;

  ngAfterViewInit() {
    this.audioFile = this.audioService.getFile();

    this.wave = WaveSurfer.create({
      container: this.waveformContainer.nativeElement,
      waveColor: '#f3e0ecff',
      progressColor: '#dca3b8',
      height: 'auto',
    });

    this.volume = this.wave.getVolume();

    // Transfer current player timestamp tp current-player-timestamp-service
    this.wave.on('audioprocess', (currentTime: number) => {
      this.currentTimestampService.updateTime(currentTime);
    });

    // Listen for when the user clicks/seeks on the waveform
    this.wave.on('interaction', () => {
      const exactTime = this.wave.getCurrentTime();
      this.currentTimestampService.updateTime(exactTime);
    });

    if (this.audioFile) {

      if (this.audioFile instanceof Blob || this.audioFile instanceof File) {
        this.audioUrl = URL.createObjectURL(this.audioFile);
        this.wave.load(this.audioUrl);
      } else {
        this.wave.load(this.audioFile);
      }

    }
  }

  togglePlayback() {
    if (this.wave) {
      this.wave.playPause();
    }
  }

  onSpeedChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const selectedSpeed = parseFloat(selectElement.value);

    this.wave.setPlaybackRate(selectedSpeed, true);
  }

  ngOnDestroy() {
    if (this.wave) {
      this.wave.destroy();
    }

    if (this.audioUrl) {
      URL.revokeObjectURL(this.audioUrl);
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
      return;
    }

    switch (event.key) {
      case ' ':
        event.preventDefault();
        this.togglePlayback();
        break;

      case 'ArrowLeft':
        event.preventDefault();
        if (this.wave) {
          this.wave.setTime(Math.max(0, this.wave.getCurrentTime() - 5));
        }
        break;

      case 'ArrowRight': // Right Arrow
        event.preventDefault();
        if (this.wave) {
          this.wave.setTime(Math.min(this.wave.getDuration(), this.wave.getCurrentTime() + 5));
        }
        break;
    }
  }

  protected readonly EventTarget = EventTarget;
  protected readonly self = self;
}
