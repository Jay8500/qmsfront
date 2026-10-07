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
    selector: 'app-safety-culture-survey-overall',
    imports: [NgApexchartsModule],
    templateUrl: './safety-culture-survey-overall.component.html',
    styleUrl: './safety-culture-survey-overall.component.scss'
})
export class SafetyCultureSurveyOverallComponent {

  @ViewChild("chart") chart!: ChartComponent;
        public chartOptions: ChartOptions;
      
        constructor() {
          this.chartOptions = {
            series: [25, 25, 25, 25],
            chart: {
              type: "donut",
              height: window.innerWidth < 480 ? 285 : 330,
            },
            labels: ["Training", "Communication", "Culture", "Staffing", "Facility"],
            colors: ["#34D1A6", "#FFB11F", "#003488", "#FF5143", "#1D8C3A"],
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
                  legend: {
                    position: "bottom"
                  }
                }
              }
            ]
          };
        }
        
}
