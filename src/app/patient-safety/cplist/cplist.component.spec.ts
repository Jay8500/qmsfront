import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CplistComponent } from './cplist.component';

describe('CplistComponent', () => {
  let component: CplistComponent;
  let fixture: ComponentFixture<CplistComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CplistComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CplistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
