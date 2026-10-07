import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScmasterComponent } from './scmaster.component';

describe('ScmasterComponent', () => {
  let component: ScmasterComponent;
  let fixture: ComponentFixture<ScmasterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScmasterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScmasterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
