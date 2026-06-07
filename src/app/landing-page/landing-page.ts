import {Component, Inject} from '@angular/core';
import { Router} from '@angular/router';
import { AudioFileService } from '../audio-file-service/audio-file-service';


@Component({
  selector: 'app-landing-page',
  imports: [],
  templateUrl: './landing-page.html',
  styleUrl: './landing-page.css',
})

export class LandingPage {

  constructor(
    private audioFileService: AudioFileService,
    private router: Router
  ) {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.audioFileService.saveFile(input.files[0]);

      this.router.navigate(['/music-player']);
    }

  }


}
