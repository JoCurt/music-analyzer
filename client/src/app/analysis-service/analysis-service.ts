import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { AnalysisResult } from './analysis-result.model';

export type AnalysisStatus = 'idle' | 'loading' | 'success' | 'error';

@Injectable({
  providedIn: 'root',
})
export class AnalysisService {
  private readonly apiUrl = 'http://localhost:8000/api/analyze';

  private result$ = new BehaviorSubject<AnalysisResult | null>(null);
  private status$ = new BehaviorSubject<AnalysisStatus>('idle');
  private error$ = new BehaviorSubject<string | null>(null);
  private activeRequestSubscription: Subscription | null = null;

  constructor(private http: HttpClient) {}

  getResultObservable(): Observable<AnalysisResult | null> {
    return this.result$.asObservable();
  }

  getStatusObservable(): Observable<AnalysisStatus> {
    return this.status$.asObservable();
  }

  getErrorObservable(): Observable<string | null> {
    return this.error$.asObservable();
  }

  /**
   * Uploads the given file to the backend for analysis.
   * Cancels any previous in-flight request and updates status$/result$/error$.
   */
  analyze(file: File): void {
    this.activeRequestSubscription?.unsubscribe();
    this.result$.next(null);
    this.status$.next('loading');
    this.error$.next(null);

    const formData = new FormData();
    // field name must be "audio" to match the FastAPI endpoint
    formData.append('audio', file, file.name);

    this.activeRequestSubscription = this.http
      .post<AnalysisResult>(this.apiUrl, formData)
      .subscribe({
        next: (result) => {
          this.result$.next(result);
          this.status$.next('success');
        },
        error: (err) => {
          console.error('Analysis request failed:', err);
          this.error$.next('Failed to analyze the audio file. Please try again.');
          this.status$.next('error');
        },
      });
  }

  reset(): void {
    this.activeRequestSubscription?.unsubscribe();
    this.activeRequestSubscription = null;
    this.result$.next(null);
    this.status$.next('idle');
    this.error$.next(null);
  }
}
