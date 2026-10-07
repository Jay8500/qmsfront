import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RiskevaluationComponent } from './riskevaluation.component';

describe('RiskevaluationComponent', () => {
  let component: RiskevaluationComponent;
  let fixture: ComponentFixture<RiskevaluationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RiskevaluationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RiskevaluationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
