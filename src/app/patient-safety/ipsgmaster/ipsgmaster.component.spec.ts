import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IpsgmasterComponent } from './ipsgmaster.component';

describe('IpsgmasterComponent', () => {
  let component: IpsgmasterComponent;
  let fixture: ComponentFixture<IpsgmasterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IpsgmasterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IpsgmasterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
