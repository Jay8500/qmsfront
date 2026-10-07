import { Component, OnInit  } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Location } from '@angular/common';
import {FormsModule, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';

interface City {
    name: string;
    code: string;
}

@Component({
  selector: 'app-incident-add',
  standalone: true,
  imports: [RouterLink, FormsModule, ReactiveFormsModule, DropdownModule, CalendarModule],
  templateUrl: './incident-add.component.html',
  styleUrl: './incident-add.component.scss'
})
export class IncidentAddComponent implements OnInit {

  cities: City[] | undefined;

  selectedCity: City | undefined;

  date: Date | undefined;
  date2: Date | undefined;
  date3: Date | undefined;

   constructor(private location: Location) {} 

    ngOnInit() {
        this.cities = [
            { name: 'New York', code: 'NY' },
            { name: 'Rome', code: 'RM' },
            { name: 'London', code: 'LDN' },
            { name: 'Istanbul', code: 'IST' },
            { name: 'Paris', code: 'PRS' }
        ];
    } 
 

  goBack(): void {
    this.location.back();
  }

}
