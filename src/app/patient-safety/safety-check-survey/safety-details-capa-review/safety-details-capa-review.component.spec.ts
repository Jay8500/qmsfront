import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SafetyDetailsCapaReviewComponent } from './safety-details-capa-review.component';

describe('SafetyDetailsCapaReviewComponent', () => {
  let component: SafetyDetailsCapaReviewComponent;
  let fixture: ComponentFixture<SafetyDetailsCapaReviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SafetyDetailsCapaReviewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SafetyDetailsCapaReviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
