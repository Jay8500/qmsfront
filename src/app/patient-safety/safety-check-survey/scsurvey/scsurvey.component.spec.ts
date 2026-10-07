import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScsurveyComponent } from './scsurvey.component';

describe('ScsurveyComponent', () => {
  let component: ScsurveyComponent;
  let fixture: ComponentFixture<ScsurveyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScsurveyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScsurveyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
