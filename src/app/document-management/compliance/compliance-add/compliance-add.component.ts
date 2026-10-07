import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Location } from '@angular/common';

@Component({
    selector: 'app-compliance-add',
    imports: [RouterLink],
    templateUrl: './compliance-add.component.html',
    styleUrl: './compliance-add.component.scss'
})
export class ComplianceAddComponent {

  constructor(private location: Location) {}
  
  goBack(): void {
    this.location.back();
  } 
  
}
