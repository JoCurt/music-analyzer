import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SimpleChange } from '@angular/core';
import { ChordDiagramComponent } from './chord-diagram';

describe('ChordDiagramComponent', () => {
  let component: ChordDiagramComponent;
  let fixture: ComponentFixture<ChordDiagramComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChordDiagramComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ChordDiagramComponent);
    component = fixture.componentInstance;
  });

  it('should create and render an SVG diagram when chordName is valid', async () => {
    component.chordName = 'C';
    await fixture.whenStable();

    const svg = (fixture.nativeElement as HTMLElement).querySelector('svg');
    expect(svg).toBeTruthy();
  });

  it('should update SVG when chordName changes and clear when null', async () => {
    component.chordName = 'Am';
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).querySelector('svg')).toBeTruthy();

    component.chordName = null;
    component.ngOnChanges({
      chordName: new SimpleChange('Am', null, false),
    });
    expect((fixture.nativeElement as HTMLElement).querySelector('svg')).toBeNull();
  });
});
