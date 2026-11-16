import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AudioFileService {
  private audioFile: File | null = null;
  private length$ = new BehaviorSubject<number | undefined>(undefined);
  private title$ = new BehaviorSubject<string | undefined>(undefined);

  async saveFile(file: File | null): Promise<boolean> {
    if (!file || !this.isValidMp3(file)) {
      console.error('Invalid file. File must be a valid MP3 or MPEG.');
      return false;
    }

    this.audioFile = file;
    this.title$.next(file.name);

    try {
      const duration = await this.getAudioDuration(file);
      this.length$.next(duration);
      return true;
    } catch (error) {
      console.error('Failed to parse audio length:', error);
      return false;
    }
  }

  public getTitleObservable(): Observable<string | undefined> {
    return this.title$.asObservable();
  }

  public getLengthObservable(): Observable<number | undefined> {
    return this.length$.asObservable();
  }

  getFile(): File | null {
    return this.audioFile;
  }

  // checking if file type is mp3, mpeg or x-mpeg
  isValidMp3(file: File): boolean {
    const allowedMimeTypes = ['audio/mp3', 'audio/mpeg', 'audio/x-mpeg'];
    const isMp3Extension = file.name.toLowerCase().endsWith('.mp3');

    return allowedMimeTypes.includes(file.type) || isMp3Extension;
  }

  private getAudioDuration(file: File): Promise<number> {
    return new Promise((resolve, reject) => {
      const objectUrl = URL.createObjectURL(file);
      const audio = new Audio();

      audio.src = objectUrl;

      audio.onloadedmetadata = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(audio.duration);
      };

      audio.onerror = (error) => {
        URL.revokeObjectURL(objectUrl);
        reject(error);
      };
    });
  }
}
