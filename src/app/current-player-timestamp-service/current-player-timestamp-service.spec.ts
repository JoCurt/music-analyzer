import { TestBed } from '@angular/core/testing';

import { CurrentPlayerTimestampService } from './current-player-timestamp-service';

describe('CurrentPlayerTimestampService', () => {
  let service: CurrentPlayerTimestampService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CurrentPlayerTimestampService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
