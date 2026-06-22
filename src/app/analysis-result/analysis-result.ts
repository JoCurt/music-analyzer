import {Component, OnInit} from '@angular/core';
import {AnalysisService} from '../analysis-service/analysis-service';
import {AnalysisResult} from '../analysis-service/analysis-result.model';
import {DecimalPipe} from '@angular/common';

@Component({
  selector: 'app-analysis-result',
  imports: [
    DecimalPipe
  ],
  templateUrl: './analysis-result.html',
  styleUrl: './analysis-result.css',
})
export class AnalysisResultComponent implements OnInit {
  result: AnalysisResult | null = null;

  constructor(private analysisService: AnalysisService) {} // 👈 inject here

  ngOnInit(): void {
    this.analysisService.getResultObservable().subscribe((r) => {
      this.result = r;
    });
  }
}
