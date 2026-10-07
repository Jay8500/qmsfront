import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdatevaccineComponent } from './updatevaccine.component';

describe('UpdatevaccineComponent', () => {
  let component: UpdatevaccineComponent;
  let fixture: ComponentFixture<UpdatevaccineComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpdatevaccineComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpdatevaccineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
