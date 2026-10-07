import { Component, ViewChild } from '@angular/core';
import { NgApexchartsModule, ChartComponent } from 'ng-apexcharts';

import {
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexStroke,
  ApexTooltip,
  ApexLegend,
  ApexFill,
  ApexResponsive,
  ApexDataLabels
} from "ng-apexcharts";

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  stroke: ApexStroke;
  tooltip: ApexTooltip;
  legend: ApexLegend;
  colors: string[];         
  fill: ApexFill;
  responsive?: ApexResponsive[];
  dataLabels?: ApexDataLabels;
};

@Component({
    selector: 'app-performance-over-years',
    imports: [NgApexchartsModule],
    templateUrl: './performance-over-years.component.html',
    styleUrl: './performance-over-years.component.scss'
})
export class PerformanceOverYearsComponent {
  @ViewChild("chart") chart!: ChartComponent;
    
      public chartOptions: ChartOptions;
      private monthCategories = ["2019", "2020", "2021", "2022r", "2023", "2024"];
  
      constructor() {
        this.chartOptions = {
          series: [
            {
              name: "Suggestions",
              data: [0, 2, 4, 6, 8, 5]
            }
          ],
          chart: {
            height: window.innerWidth < 480 ? 160 : 320,
            type: "area"
          },
          dataLabels: {
            enabled: false
          },
          colors: ["#D92D20"],
          stroke: {
            curve: "smooth"
          },
          xaxis: {
            type: "category",
            categories: this.monthCategories
          },
          tooltip: {
            x: {
              formatter: (val: number) => this.monthCategories[val] ?? ''  
            }
          },
          legend: {
            position: "bottom",
            horizontalAlign: "center"
          },
          fill: {
            type: "gradient",
            gradient: {
              shadeIntensity: 1,
              opacityFrom: 0.4,
              opacityTo: 0.1,
              stops: [0, 8, 10]
            }
          }
        };
      }
}
