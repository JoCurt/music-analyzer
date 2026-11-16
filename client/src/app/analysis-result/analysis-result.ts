import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { DecimalPipe, PercentPipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { AnalysisService, AnalysisStatus } from '../analysis-service/analysis-service';
import { AnalysisResult, ChordEvent } from '../analysis-service/analysis-result.model';
import { AudioFileService } from '../audio-file-service/audio-file-service';
import { CurrentPlayerTimestampService } from '../current-player-timestamp-service/current-player-timestamp-service';
import { ChordDiagramComponent } from '../chord-diagram/chord-diagram';

@Component({
  selector: 'app-analysis-result',
  standalone: true,
  imports: [DecimalPipe, PercentPipe, ChordDiagramComponent],
  templateUrl: './analysis-result.html',
  styleUrl: './analysis-result.scss',
})
export class AnalysisResultComponent implements OnInit, OnDestroy {
  result: AnalysisResult | null = null;
  status: AnalysisStatus = 'idle';
  errorMessage: string | null = null;

  currentTimestampService = inject(CurrentPlayerTimestampService);
  private analysisService = inject(AnalysisService);
  private audioFileService = inject(AudioFileService);
  private cdr = inject(ChangeDetectorRef);

  previousChord: ChordEvent | null = null;
  currentChord: ChordEvent | null = null;
  nextChord: ChordEvent | null = null;

  private subscriptions = new Subscription();

  ngOnInit(): void {
    this.subscriptions.add(
      this.analysisService.getResultObservable().subscribe((r) => {
        this.result = r;
        this.matchChordToTimestamp(this.currentTimestampService.currentTimestamp$.value);
        this.cdr.markForCheck();
      }),
    );

    this.subscriptions.add(
      this.analysisService.getStatusObservable().subscribe((status) => {
        this.status = status;
        this.cdr.markForCheck();
      }),
    );

    this.subscriptions.add(
      this.analysisService.getErrorObservable().subscribe((error) => {
        this.errorMessage = error;
        this.cdr.markForCheck();
      }),
    );

    this.subscriptions.add(
      this.currentTimestampService.currentTimestamp$.subscribe((currentTime: number) => {
        this.matchChordToTimestamp(currentTime);
      }),
    );
  }

  retry(): void {
    const file = this.audioFileService.getFile();
    if (file) {
      this.analysisService.analyze(file);
    }
  }

  seekToChord(chord: ChordEvent | null): void {
    if (chord) {
      this.currentTimestampService.seekTo(chord.time);
    }
  }

  private matchChordToTimestamp(currentTime: number): void {
    const chords = this.result?.chords;
    if (!chords || chords.length === 0) {
      this.updateActiveWindow(null, null, null);
      return;
    }

    if (currentTime < chords[0].time) {
      this.updateActiveWindow(null, null, chords[0]);
      return;
    }

    // Binary search for the latest chord with time <= currentTime
    let low = 0;
    let high = chords.length - 1;
    let activeIndex = 0;

    while (low <= high) {
      const mid = (low + high) >>> 1;
      if (chords[mid].time <= currentTime) {
        activeIndex = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    const prev = activeIndex > 0 ? chords[activeIndex - 1] : null;
    const curr = chords[activeIndex];
    const next = activeIndex + 1 < chords.length ? chords[activeIndex + 1] : null;

    this.updateActiveWindow(prev, curr, next);
  }

  private updateActiveWindow(
    prev: ChordEvent | null,
    curr: ChordEvent | null,
    next: ChordEvent | null,
  ): void {
    if (
      this.previousChord !== prev ||
      this.currentChord !== curr ||
      this.nextChord !== next
    ) {
      this.previousChord = prev;
      this.currentChord = curr;
      this.nextChord = next;
      this.cdr.markForCheck();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
