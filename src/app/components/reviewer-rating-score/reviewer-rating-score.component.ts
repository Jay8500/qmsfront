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
    selector: 'app-reviewer-rating-score',
    imports: [NgApexchartsModule],
    templateUrl: './reviewer-rating-score.component.html',
    styleUrl: './reviewer-rating-score.component.scss'
})
export class ReviewerRatingScoreComponent {
  @ViewChild("chart") chart!: ChartComponent;
          public chartOptions: ChartOptions;
        
          constructor() {
            this.chartOptions = {
              series: [20, 20, 20, 20, 20],
              chart: {
                type: "donut",
                height: window.innerWidth < 480 ? 240 : 320,
              },
              labels: ["Expert", "Proficient", "Competent", "Beginner", 'Novice'],
              colors: ["#1D8C3A", "#2F6FF2", "#FCAF1F", "#ED5B8B", "#D92D20"],          
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
