import { AfterViewInit, Component, inject, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { AudioFileService } from '../audio-file-service/audio-file-service';
import WaveSurfer from 'wavesurfer.js';

@Component({
  selector: 'music-player',
  standalone: true,
  imports: [],
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
      container: this.waveformContainer.nativeElement, // Safer than string ID
      waveColor: '#4F46E5',
      progressColor: '#06B6D4'
    });

    if (this.audioFile) {
      // If it's a raw File/Blob object, convert it to a URL string
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
