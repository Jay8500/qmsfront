import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PasswordpolicyComponent } from './passwordpolicy.component';

describe('PasswordpolicyComponent', () => {
  let component: PasswordpolicyComponent;
  let fixture: ComponentFixture<PasswordpolicyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PasswordpolicyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PasswordpolicyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
