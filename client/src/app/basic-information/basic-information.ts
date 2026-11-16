import { ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { AudioFileService } from '../audio-file-service/audio-file-service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-basic-information',
  imports: [],
  templateUrl: './basic-information.html',
  styleUrl: './basic-information.scss',
})
export class BasicInformation implements OnInit, OnDestroy {
  audioFileService = inject(AudioFileService);
  private cdr = inject(ChangeDetectorRef);

  title: string | undefined;
  length: string | undefined;

  private subscriptions = new Subscription();

  ngOnInit(): void {
    this.subscriptions.add(
      this.audioFileService.getTitleObservable().subscribe((title) => {
        this.title = title;
        this.cdr.markForCheck();
      }),
    );

    this.subscriptions.add(
      this.audioFileService.getLengthObservable().subscribe((duration) => {
        this.length = duration !== undefined ? `${duration}s` : undefined;
        this.cdr.markForCheck();
      }),
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
