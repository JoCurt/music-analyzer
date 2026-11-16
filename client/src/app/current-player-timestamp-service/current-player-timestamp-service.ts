import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CurrentPlayerTimestampService {
  public currentTimestamp$ = new BehaviorSubject<number>(0);
  private seekRequests$ = new Subject<number>();

  updateTime(time: number): void {
    this.currentTimestamp$.next(time);
  }

  seekTo(time: number): void {
    this.currentTimestamp$.next(time);
    this.seekRequests$.next(time);
  }

  getSeekRequestsObservable(): Observable<number> {
    return this.seekRequests$.asObservable();
  }
}
