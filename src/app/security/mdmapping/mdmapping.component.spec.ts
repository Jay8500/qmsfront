import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MdmappingComponent } from './mdmapping.component';

describe('MdmappingComponent', () => {
  let component: MdmappingComponent;
  let fixture: ComponentFixture<MdmappingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MdmappingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MdmappingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
