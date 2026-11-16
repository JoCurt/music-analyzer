import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AudioFileService } from '../audio-file-service/audio-file-service';
import { AnalysisService } from '../analysis-service/analysis-service';

@Component({
  selector: 'app-landing-page',
  imports: [],
  templateUrl: './landing-page.html',
  styleUrl: './landing-page.scss',
})
export class LandingPage {
  readonly errorMessage = signal<string | null>(null);

  constructor(
    private audioFileService: AudioFileService,
    private router: Router,
    private analysisService: AnalysisService,
  ) {}

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    this.errorMessage.set(null);
    const isSaved = await this.audioFileService.saveFile(file);

    if (!isSaved) {
      this.errorMessage.set('Invalid or unreadable audio file. Please upload a valid MP3 file.');
      input.value = '';
      return;
    }

    this.analysisService.reset();
    this.analysisService.analyze(file);
    await this.router.navigate(['/music-player']);
  }
}
