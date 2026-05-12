import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExampleTest } from './example-test';

describe('CounterComponent', () => {
  let component: ExampleTest;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ExampleTest]
    });
    const fixture = TestBed.createComponent(ExampleTest);
    component = fixture.componentInstance;
    fixture.detectChanges();
  })
  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  it('should start with 0', () => {
    expect(component.count).toBe(0);
  });

  it('should increment count', () => {
    component.increment();
    expect(component.count).toBe(1);
  });

  it('should decrement count', () => {
    component.decrement();
    expect(component.count).toBe(-1);
  });
})
