import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Location } from '@angular/common';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-version-control-uploadinfo',
    imports: [RouterLink, NgbTooltip, FormsModule],
    templateUrl: './version-control-uploadinfo.component.html',
    styleUrl: './version-control-uploadinfo.component.scss'
})
export class VersionControlUploadinfoComponent {

  constructor(private location: Location) {}
  
  goBack(): void {
    this.location.back();
  } 

  selectedOptionEntry2: string = 'department';

  onDataEntryChange2(option: string) {
    this.selectedOptionEntry2 = option;
    console.log('Selected data entry option 2:', option);
  }

}
