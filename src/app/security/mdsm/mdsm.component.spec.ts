import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MdsmComponent } from './mdsm.component';

describe('MdsmComponent', () => {
  let component: MdsmComponent;
  let fixture: ComponentFixture<MdsmComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MdsmComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MdsmComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
