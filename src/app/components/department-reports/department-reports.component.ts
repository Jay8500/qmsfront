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
    selector: 'app-department-reports',
    imports: [NgApexchartsModule],
    templateUrl: './department-reports.component.html',
    styleUrl: './department-reports.component.scss'
})
export class DepartmentReportsComponent {

  @ViewChild("chart") chart!: ChartComponent;
      public chartOptions: ChartOptions;
    
      constructor() {
        this.chartOptions = {
          series: [25, 25, 25, 50],
          chart: {
            type: "pie",
            width: 380
          },
          labels: ["ICU", "Surgery", "OPD", "Radiology", ],
          colors: ["#4C78FF", "#FF82AC", "#16DBCC", "#FFBB38"],
          fill: {
            type: "solid",
            opacity: 1
          },
          stroke: {
            show: false
          },
          dataLabels: {
            enabled: true,
            style: {
              fontSize: '14px',
              fontWeight: 'bold'
            }
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
          // plotOptions: {
          //   pie: {
          //     donut: {
          //       size: '100%',
          //       labels: {
          //         show: true,
          //         total: {
          //           show: true,
          //           label: 'Total',
          //           fontSize: '16px',
          //           fontWeight: 600
          //         },
          //         value: {
          //           show: false
          //         },
          //         name: {
          //           show: false
          //         }
          //       }
          //     }
          //   }
          // },
          // theme: {
          //   monochrome: {
          //     enabled: false
          //   }
          // },
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
