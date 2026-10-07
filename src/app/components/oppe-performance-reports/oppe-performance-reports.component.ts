import { Component, ViewChild, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { NgApexchartsModule, ChartComponent } from 'ng-apexcharts';

import {
  ApexNonAxisChartSeries,
  ApexPlotOptions,
  ApexChart,
  ApexLegend,
  ApexResponsive,
  ApexFill,
  ApexStroke
} from 'ng-apexcharts';

export type ChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  labels: string[];
  colors?: string[];
  legend?: ApexLegend;
  plotOptions: ApexPlotOptions;
  responsive?: ApexResponsive[];
  fill: ApexFill;
  stroke: ApexStroke;
};

@Component({
    selector: 'app-oppe-performance-reports',
    imports: [NgApexchartsModule],
    templateUrl: './oppe-performance-reports.component.html',
    styleUrl: './oppe-performance-reports.component.scss',
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class OppePerformanceReportsComponent {

  @ViewChild("chart") chart!: ChartComponent;
    public chartOptions: ChartOptions;  
    constructor() {
     this.chartOptions = {
        series: [75], // your dynamic score
        chart: {
          // height: 350,
          // width: 500,
          width: window.innerWidth < 480 ? 260 : 400,          
          type: "radialBar",
          toolbar: {
            show: true
          }
        },
        plotOptions: {
          radialBar: {
            startAngle: -135,
            endAngle: 225,
            hollow: {
              margin: 0,
              size: "70%",
              background: "#fff",
              position: "front",
              dropShadow: {
                enabled: true,
                top: 3,
                left: 0,
                blur: 4,
                opacity: 0.24
              }
            },
            track: {
              background: "#fff",
              strokeWidth: "67%",
              margin: 0,
              dropShadow: {
                enabled: true,
                top: -3,
                left: 0,
                blur: 4,
                opacity: 0.35
              }
            },
            dataLabels: {
              show: true,
              name: {
                offsetY: -10,
                show: true,
                color: "#888",
                fontSize: "17px"
              },
              value: {
                formatter: function (val) {
                  return parseInt(val.toString(), 10).toString() + '%';
                },
                color: "#111",
                fontSize: "36px",
                show: true
              }
            }
          }
        },
        fill: {
          type: "gradient",
          gradient: {
            type: "horizontal",
            shade: "light",
            shadeIntensity: 0.4,
            inverseColors: false,
            opacityFrom: 1,
            opacityTo: 1,
            stops: [0, 50, 80, 100],
            colorStops: [
              {
                offset: 0,
                color: "#DB3421", // Green
                opacity: 1
              },
              {
                offset: 60,
                color: "#FFD700", // Yellow
                opacity: 1
              },
              {
                offset: 80,
                color: "#1D8C3A", // Red
                opacity: 1
              }
            ]
          }
        },
        stroke: {
          lineCap: "round"
        },
        labels: ["2020-2025"],
        legend: {
          show: false,         
        }
      };

    }
}
