import { Component, ViewChild, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { NgApexchartsModule, ChartComponent } from 'ng-apexcharts';

import {
  ApexNonAxisChartSeries,
  ApexResponsive,
  ApexChart,
  ApexLegend,
  ApexFill,
  ApexStroke,
  ApexDataLabels
} from "ng-apexcharts";

export type ChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  labels: string[];
  responsive: ApexResponsive[];
  colors: string[];         
  legend: ApexLegend;       
  fill: ApexFill;          
  stroke?: ApexStroke;
  dataLabels?: ApexDataLabels;
};

@Component({
    selector: 'app-doctor-feedbacks',
    imports: [NgApexchartsModule],
    templateUrl: './doctor-feedbacks.component.html',
    styleUrl: './doctor-feedbacks.component.scss',
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class DoctorFeedbacksComponent {
  @ViewChild("chart") chart!: ChartComponent;
      public chartOptions: ChartOptions;
    
      constructor() {
        this.chartOptions = {
          series: [40, 25, 25, 25, 35],
          chart: {
            type: "pie",
            height: window.innerWidth < 480 ? 280 : 335,
          },
          labels: ["Dr. Dhayanithi", "Dr. Dinesh Kumar", "Dr. Gowtham", "Dr. Billy ", "Dr. Prathap Singh"],
          colors: ["#34B3F1", "#34D1A6", "#FFB024", "#FF8446", "#F24949"],
          fill: {
            type: "solid"
          },
          stroke: {
            show: false,
            width: 0,
          },
          dataLabels: {
            enabled: false
          },
          legend: {
            position: "bottom",
            fontSize: "14px",
            fontWeight: 500,
            labels: {
              colors: "#333"
            },
            markers: {
              shape: "circle"
            },
            itemMargin: {
              horizontal: 10,
              vertical: 5
            }
          },
          responsive: [
            {
              breakpoint: 480,
              options: {
                chart: {
                  width: 250
                },
                legend: {
                  position: "bottom"
                }
              }
            }
          ]
        };
      }
}
