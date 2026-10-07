import { Component, ViewChild, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { NgApexchartsModule } from 'ng-apexcharts';

import {
  ApexChart,
  ApexAxisChartSeries,
  ChartComponent,
  ApexDataLabels,
  ApexPlotOptions,
  ApexYAxis,
  ApexLegend,
  ApexGrid
} from "ng-apexcharts";

type ApexXAxis = {
  type?: "category" | "datetime" | "numeric";
  categories?: any;
  labels?: {
    style?: {
      colors?: string | string[];
      fontSize?: string;
    };
  };
};

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  dataLabels: ApexDataLabels;
  plotOptions: ApexPlotOptions;
  yaxis: ApexYAxis;
  xaxis: ApexXAxis;
  grid: ApexGrid;
  colors: string[];
  legend: ApexLegend;
};


@Component({
    selector: 'app-department-incident-happen',
    imports: [NgApexchartsModule],
    templateUrl: './department-incident-happen.component.html',
    styleUrl: './department-incident-happen.component.scss'
})
export class DepartmentIncidentHappenComponent {
  
  @ViewChild("chart") chart!: ChartComponent;
  public chartOptions: ChartOptions;
  
  constructor() {
    this.chartOptions = {
      series: [
        {
          name: "distibuted",
          data: [21, 22, 10, 28, 16, 21]
        }
      ],
      chart: {
        height: window.innerWidth < 480 ? 200 : 330,
        width: '100%',
        type: "bar",
        events: {
          click: function(chart, w, e) {
            // console.log(chart, w, e)
          }
        }
      },
      colors: [
        "#FFBB38"
      ],
      plotOptions: {
        bar: {
          columnWidth: "55%",
          distributed: true
        }
      },
      dataLabels: {
        enabled: false
      },
      legend: {
        show: false
      },
      grid: {
        show: false
      },
      xaxis: {
        categories: [
          ["ICU"],
          ["Lab"],
          ["Reception"],
          ["ER"],
          ["OPD"],
          ["PWD"],
        ],
        labels: {
          style: {
            colors: [
              "#392E2E"
            ],
            fontSize: "12px"
          }
        }
      },
      // ✅ Added minimal yaxis config to fix TS2741 error
      yaxis: {
        labels: {
          style: {
            colors: "#000",
            fontSize: "12px"
          }
        }
      }
    };
  }

}
