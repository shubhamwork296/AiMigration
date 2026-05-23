import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddUserRoleMappingComponent } from './add-user-role-mapping.component';

describe('AddUserRoleMappingComponent', () => {
  let component: AddUserRoleMappingComponent;
  let fixture: ComponentFixture<AddUserRoleMappingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddUserRoleMappingComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddUserRoleMappingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
