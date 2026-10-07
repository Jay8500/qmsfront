import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CarecontiuitymasterComponent } from './carecontiuitymaster.component';

describe('CarecontiuitymasterComponent', () => {
  let component: CarecontiuitymasterComponent;
  let fixture: ComponentFixture<CarecontiuitymasterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CarecontiuitymasterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CarecontiuitymasterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
