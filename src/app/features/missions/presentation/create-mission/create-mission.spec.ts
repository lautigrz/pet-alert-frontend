import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateMission } from './create-mission';

describe('CreateMission', () => {
  let component: CreateMission;
  let fixture: ComponentFixture<CreateMission>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateMission]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateMission);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
