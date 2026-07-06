import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { AnalysisService } from '../analysis-service/analysis-service';
import { AnalysisResult, ChordEvent } from '../analysis-service/analysis-result.model';
import { CurrentPlayerTimestampService } from '../current-player-timestamp-service/current-player-timestamp-service';
import { DecimalPipe} from '@angular/common';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-analysis-result',
  standalone: true,
  imports: [
    DecimalPipe
  ],
  templateUrl: './analysis-result.html',
  styleUrl: './analysis-result.css',
})
export class AnalysisResultComponent implements OnInit, OnDestroy {
  result: AnalysisResult | null = null;
  currentTimestampService = inject(CurrentPlayerTimestampService);
  private cdr = inject(ChangeDetectorRef);

  currentChord: any | null = null;
  chordRows: ChordEvent[][] = [];
  private timeSubscription!: Subscription;

  constructor(private analysisService: AnalysisService) {}

  ngOnInit(): void {
    this.analysisService.getResultObservable().subscribe((r) => {
      this.result = r;
      if (r && r.chords) {
        this.chordRows = this.chunkChords(r.chords, 4);
      }
    });

    this.timeSubscription = this.currentTimestampService.currentTimestamp$.subscribe((currentTime: number) => {
      this.matchChordToTimestamp(currentTime);
    });
  }

// Helper function to group the flat array into rows of 4
  private chunkChords(chords: ChordEvent[], size: number): ChordEvent[][] {
    const chunks: ChordEvent[][] = [];
    for (let i = 0; i < chords.length; i += size) {
      chunks.push(chords.slice(i, i + size));
    }
    return chunks;
  }

  private matchChordToTimestamp(currentTime: number) {
    // Safe guard: if result is null, or chords array doesn't exist, stop immediately
    if (!this.result || !this.result.chords) {
      return;
    }

    // Now TypeScript knows for a fact that 'result.chords' is safe to read
    const active = this.result.chords.reduce((prev: any, curr: any) => {
      return (currentTime >= curr.time) ? curr : prev;
    }, this.result.chords[0]);

    if (this.currentChord !== active) {
      this.currentChord = active;
      this.cdr.detectChanges();
    }
    console.log(this.currentChord)
  }

  ngOnDestroy(): void {
    if (this.timeSubscription) {
      this.timeSubscription.unsubscribe();
    }
  }
}
