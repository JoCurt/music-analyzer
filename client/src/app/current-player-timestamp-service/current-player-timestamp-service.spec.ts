import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { CurrentPlayerTimestampService } from './current-player-timestamp-service';

describe('CurrentPlayerTimestampService', () => {
  let service: CurrentPlayerTimestampService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CurrentPlayerTimestampService);
  });

  it('should be created with initial timestamp 0', async () => {
    expect(service).toBeTruthy();
    expect(await firstValueFrom(service.currentTimestamp$)).toBe(0);
  });

  it('should emit updated timestamps when updateTime is called', async () => {
    service.updateTime(42.5);
    expect(await firstValueFrom(service.currentTimestamp$)).toBe(42.5);
  });

  it('should emit both currentTimestamp$ and seekRequests$ when seekTo is called', async () => {
    const seekPromise = firstValueFrom(service.getSeekRequestsObservable());
    service.seekTo(18.2);
    expect(await seekPromise).toBe(18.2);
    expect(await firstValueFrom(service.currentTimestamp$)).toBe(18.2);
  });
});
