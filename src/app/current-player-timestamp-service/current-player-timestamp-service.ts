import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class CurrentPlayerTimestampService {
  currentTimestamp: number | undefined;

  updateTime(timestamp: number | undefined): void {
    this.currentTimestamp = timestamp;
  }
}
