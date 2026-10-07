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
    rotate?: number;
    rotateAlways?: boolean;
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
    selector: 'app-goal-reports',
    imports: [NgApexchartsModule],
    templateUrl: './goal-reports.component.html',
    styleUrl: './goal-reports.component.scss'
})

export class GoalReportsComponent {

  @ViewChild("chart") chart!: ChartComponent;
  public chartOptions: ChartOptions;
  
  constructor() {
    this.chartOptions = {
      series: [
        {
          name: "Goals Achieved",
          data: [70, 50, 60, 40, 50, 80]
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
        show: false,
        position: 'top',
        horizontalAlign: 'right'
      },
      grid: {
        show: false
      },
      xaxis: {
        categories: [
          ["Goal 1"],
          ["Goal 2"],
          ["Goal 3"],
          ["Goal 4"],
          ["Goal 5"],
          ["Goal 6"],
        ],
        labels: {
          rotate: -45,
          rotateAlways: true,
          style: {
            fontSize: "12px"
          }
        }
      },
      // ✅ Added minimal yaxis config to fix TS2741 error
      yaxis: {
        min: 0,
        max: 100,
        tickAmount: 5,
        labels: {
          style: {
            colors: "#000",
            fontSize: "12px"
          },
          formatter: function(val: number) {
            return val + "%";
          }
        }
      }
    };
  }

}
