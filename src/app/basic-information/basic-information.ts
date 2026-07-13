import {Component, inject, OnDestroy, OnInit} from '@angular/core';
import { AudioFileService} from '../audio-file-service/audio-file-service';
import {Subscription} from 'rxjs';

@Component({
  selector: 'app-basic-information',
  imports: [],
  templateUrl: './basic-information.html',
  styleUrl: './basic-information.scss',
})
export class BasicInformation implements OnInit, OnDestroy {
  audioFileService = inject(AudioFileService);

  title: string | undefined;
  length: string | undefined;

  private subscriptions = new Subscription();

  ngOnInit() {
    this.subscriptions.add(
      this.audioFileService.getTitleObservable().subscribe(title => {
        console.log('title received:', title);
        this.title = title;
      })
    );

    this.subscriptions.add(
      this.audioFileService.getLengthObservable().subscribe(duration => {
        console.log('duration received:', duration);
        this.length = duration !== undefined ? `${duration}s` : undefined;
      })
    );

  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe(); // prevent memory leaks
  }
}
