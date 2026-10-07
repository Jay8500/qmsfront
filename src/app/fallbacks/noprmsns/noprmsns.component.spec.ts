import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NoprmsnsComponent } from './noprmsns.component';

describe('NoprmsnsComponent', () => {
  let component: NoprmsnsComponent;
  let fixture: ComponentFixture<NoprmsnsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NoprmsnsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NoprmsnsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
