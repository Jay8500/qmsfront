import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RiskqualityreviewComponent } from './riskqualityreview.component';

describe('RiskqualityreviewComponent', () => {
  let component: RiskqualityreviewComponent;
  let fixture: ComponentFixture<RiskqualityreviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RiskqualityreviewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RiskqualityreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
