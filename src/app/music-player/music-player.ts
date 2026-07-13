import { AfterViewInit, Component, inject, OnDestroy, ViewChild, ElementRef } from '@angular/core';

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
  audioFile: any;
  private audioUrl: string | null = null;

  ngAfterViewInit() {
    this.audioFile = this.audioService.getFile();

    this.wave = WaveSurfer.create({
      container: this.waveformContainer.nativeElement,
      waveColor: '#f3e0ecff',
      progressColor: '#dca3b8'
    });

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

  ngOnDestroy() {
    if (this.wave) {
      this.wave.destroy();
    }

    if (this.audioUrl) {
      URL.revokeObjectURL(this.audioUrl);
    }
  }
}
