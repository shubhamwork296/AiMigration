import { TestBed } from '@angular/core/testing';

import { UpgradeTicketService } from './upgrade-ticket.service';

describe('UpgradeTicketService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: UpgradeTicketService = TestBed.get(UpgradeTicketService);
    expect(service).toBeTruthy();
  });
});
