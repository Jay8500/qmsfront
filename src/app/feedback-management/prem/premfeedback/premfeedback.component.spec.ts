import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PremfeedbackComponent } from './premfeedback.component';

describe('PremfeedbackComponent', () => {
  let component: PremfeedbackComponent;
  let fixture: ComponentFixture<PremfeedbackComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PremfeedbackComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PremfeedbackComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
