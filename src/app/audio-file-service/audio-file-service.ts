import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AudioFileService {
  private audioFile: File | null = null;

  saveFile(file: File | null = null) {
    this.audioFile = file;
  }
}
