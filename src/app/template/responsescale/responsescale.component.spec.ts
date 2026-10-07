import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResponsescaleComponent } from './responsescale.component';

describe('ResponsescaleComponent', () => {
  let component: ResponsescaleComponent;
  let fixture: ComponentFixture<ResponsescaleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResponsescaleComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResponsescaleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
