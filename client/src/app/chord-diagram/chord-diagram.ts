import {
  AfterViewInit,
  Component,
  ElementRef,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { ChordStyle, FretLabelPosition, SVGuitarChord } from 'svguitar';
import { ChordDatabaseService } from './chord-database.service';

@Component({
  selector: 'app-chord-diagram',
  standalone: true,
  imports: [],
  templateUrl: './chord-diagram.html',
  styleUrl: './chord-diagram.scss',
})
export class ChordDiagramComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() chordName: string | null = null;
  @Input() highlighted = false;

  @ViewChild('chartContainer') chartContainer?: ElementRef<HTMLElement>;

  private chordDatabase = inject(ChordDatabaseService);
  private chart?: SVGuitarChord;

  ngAfterViewInit(): void {
    this.renderChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['chordName'] || changes['highlighted']) && this.chartContainer) {
      this.renderChart();
    }
  }

  ngOnDestroy(): void {
    this.chart?.remove();
  }

  private renderChart(): void {
    const container = this.chartContainer?.nativeElement;
    if (!container) {
      return;
    }

    container.innerHTML = '';
    const chord = this.chordDatabase.getChord(this.chordName);
    if (!chord) {
      return;
    }

    // Ensure SVGElement.getBBox exists in headless test DOMs (e.g. jsdom)
    if (typeof SVGElement !== 'undefined' && !('getBBox' in SVGElement.prototype)) {
      (SVGElement.prototype as SVGElement & { getBBox: () => DOMRect }).getBBox = () =>
        ({ x: 0, y: 0, width: 20, height: 20, top: 0, left: 0, right: 20, bottom: 20 }) as DOMRect;
    }

    const accentColor = this.highlighted ? '#f3e0ec' : '#dca3b8';
    const fingerFill = this.highlighted ? '#912f56' : '#521945';

    this.chart = new SVGuitarChord(container);
    this.chart
      .configure({
        style: ChordStyle.normal,
        strings: 6,
        frets: 4,
        position: chord.position ?? 1,
        tuning: ['E', 'A', 'D', 'G', 'B', 'e'],
        fretLabelPosition: FretLabelPosition.RIGHT,
        color: accentColor,
        stringColor: accentColor,
        fretColor: accentColor,
        tuningsColor: accentColor,
        fretLabelColor: accentColor,
        fingerColor: fingerFill,
        fingerTextColor: '#f3e0ec',
        fingerStrokeColor: accentColor,
        fingerStrokeWidth: 2,
        barreChordStrokeColor: accentColor,
        barreChordStrokeWidth: 2,
        fingerSize: 0.68,
        fingerTextSize: 24,
        fretSize: 1.25,
        sidePadding: 0.22,
        nutWidth: 8,
        emptyStringIndicatorSize: 0.55,
        tuningsFontSize: 24,
        fretLabelFontSize: 28,
        fixedDiagramPosition: true,
        svgTitle: this.chordName ? `Guitar chord diagram for ${this.chordName}` : undefined,
      })
      .chord(chord)
      .draw();
  }
}
