import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DataCaptureComponent } from './data-capture.component';

describe('DataCaptureComponent', () => {
  let component: DataCaptureComponent;
  let fixture: ComponentFixture<DataCaptureComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataCaptureComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DataCaptureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
