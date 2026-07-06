import { Injectable } from '@angular/core';
import {BehaviorSubject} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CurrentPlayerTimestampService {
  public currentTimestamp$ = new BehaviorSubject<number>(0);

  updateTime(time: number) {
    this.currentTimestamp$.next(time);
  }
}

