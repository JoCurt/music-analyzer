import { AfterViewInit, Component, inject, OnDestroy, ViewChild, ElementRef } from '@angular/core';

import { AudioFileService } from '../audio-file-service/audio-file-service';
import { BasicInformation} from '../basic-information/basic-information';

import WaveSurfer from 'wavesurfer.js';
import {AnalysisResultComponent} from '../analysis-result/analysis-result';

@Component({
  selector: 'music-player',
  standalone: true,
  imports: [BasicInformation, AnalysisResultComponent],
  templateUrl: './music-player.html',
  styleUrl: './music-player.css',
})
export class MusicPlayer implements AfterViewInit, OnDestroy {
  private audioService = inject(AudioFileService);

  @ViewChild('waveformContainer') waveformContainer!: ElementRef;

  wave!: WaveSurfer;
  audioFile: any;
  private audioUrl: string | null = null;

  ngAfterViewInit() {
    this.audioFile = this.audioService.getFile();

    this.wave = WaveSurfer.create({
      container: this.waveformContainer.nativeElement,
      waveColor: '#4F46E5',
      progressColor: '#06B6D4'
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
