import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';

import { BasicInformation } from './basic-information';
import { AudioFileService } from '../audio-file-service/audio-file-service';

describe('BasicInformation', () => {
  let component: BasicInformation;
  let fixture: ComponentFixture<BasicInformation>;
  let titleSubject: BehaviorSubject<string | undefined>;
  let lengthSubject: BehaviorSubject<number | undefined>;

  beforeEach(async () => {
    titleSubject = new BehaviorSubject<string | undefined>(undefined);
    lengthSubject = new BehaviorSubject<number | undefined>(undefined);

    await TestBed.configureTestingModule({
      imports: [BasicInformation],
      providers: [
        {
          provide: AudioFileService,
          useValue: {
            getTitleObservable: () => titleSubject.asObservable(),
            getLengthObservable: () => lengthSubject.asObservable(),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BasicInformation);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display updated title and duration from AudioFileService', async () => {
    titleSubject.next('my-song.mp3');
    lengthSubject.next(142);
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('my-song.mp3');
    expect(compiled.textContent).toContain('142s');
  });
});
