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
    selector: 'app-self-reviewer-score',
    imports: [NgApexchartsModule],
    templateUrl: './self-reviewer-score.component.html',
    styleUrl: './self-reviewer-score.component.scss'
})
export class SelfReviewerScoreComponent {

  @ViewChild("chart") chart!: ChartComponent;
  
    public chartOptions: ChartOptions;
    private monthCategories = ["Unit 1", "Unit 2", "Unit 3", "Unit 4", "Unit 5", "Unit 6"];
  
    constructor() {
      this.chartOptions = {
        series: [
          {
            name: "Reviewer",
            data: [0, 2, 4, 6, 8, 5]
          },
          {
            name: "Self",
            data: [0, 4, 3, 5, 5, 2]
          }
        ],
        chart: {
          // width: 360,
          // height: 320,
          height: window.innerWidth < 480 ? 240 : 320,
          width: window.innerWidth < 480 ? 280 : 360,
          type: "area"
        },
        dataLabels: {
          enabled: false
        },
        colors: ["#1D7ECE", "#FFB11F"],
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
