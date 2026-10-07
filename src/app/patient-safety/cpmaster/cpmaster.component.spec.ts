import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CpmasterComponent } from './cpmaster.component';

describe('CpmasterComponent', () => {
  let component: CpmasterComponent;
  let fixture: ComponentFixture<CpmasterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CpmasterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CpmasterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
