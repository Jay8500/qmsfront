import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Location } from '@angular/common';

@Component({
    selector: 'app-prom-reports',
    // imports: [RouterLink],
    templateUrl: './prom-reports.component.html',
    styleUrl: './prom-reports.component.scss'
})
export class PromReportsComponent {
  constructor(private location: Location) {}

  goBack(): void {
    this.location.back();
  } 
}
