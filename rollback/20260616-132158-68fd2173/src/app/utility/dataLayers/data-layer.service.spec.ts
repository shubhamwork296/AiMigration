import { TestBed } from '@angular/core/testing';

import { DataLayerService } from './data-layer.service';

describe('DataLayerService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: DataLayerService = TestBed.get(DataLayerService);
    expect(service).toBeTruthy();
  });
});
