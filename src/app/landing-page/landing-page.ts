import {Component} from '@angular/core';
import { Router} from '@angular/router';
import { AudioFileService } from '../audio-file-service/audio-file-service';
import {AnalysisService} from '../analysis-service/analysis-service';


@Component({
  selector: 'app-landing-page',
  imports: [],
  templateUrl: './landing-page.html',
  styleUrl: './landing-page.scss',
})

export class LandingPage {

  constructor(
    private audioFileService: AudioFileService,
    private router: Router,
    private analysisService: AnalysisService,
  ) {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.audioFileService.saveFile(input.files[0]);
      this.analysisService.reset();
      this.analysisService.analyze(input.files[0]);

      this.router.navigate(['/music-player']);
    }

  }


}
