import { TestBed } from '@angular/core/testing';

import { GA4DatalayerService } from './ga4-datalayer.service';

describe('GA4DatalayerService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: GA4DatalayerService = TestBed.get(GA4DatalayerService);
    expect(service).toBeTruthy();
  });
});
