import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppsettingComponent } from './appsetting.component';

describe('AppsettingComponent', () => {
  let component: AppsettingComponent;
  let fixture: ComponentFixture<AppsettingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppsettingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AppsettingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
