import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrommasterComponent } from './prommaster.component';

describe('PrommasterComponent', () => {
  let component: PrommasterComponent;
  let fixture: ComponentFixture<PrommasterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrommasterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrommasterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
