import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PremmasterComponent } from './premmaster.component';

describe('PremmasterComponent', () => {
  let component: PremmasterComponent;
  let fixture: ComponentFixture<PremmasterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PremmasterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PremmasterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
