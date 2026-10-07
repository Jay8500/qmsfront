import { Component, ViewChild } from '@angular/core';
import { NgApexchartsModule, ChartComponent } from 'ng-apexcharts';

import {
  ApexAxisChartSeries,
  ApexChart,
  ApexFill,
  ApexYAxis,
  ApexTooltip,
  ApexTitleSubtitle,
  ApexXAxis,
  ApexLegend
} from "ng-apexcharts";

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis | ApexYAxis[];
  title: ApexTitleSubtitle;
  //labels: string[];
  stroke: any; 
  dataLabels: ApexDataLabels;
  fill: ApexFill;
  plotOptions: ApexPlotOptions;
  colors: string[];
  tooltip: ApexTooltip;
  legend: ApexLegend;
};

@Component({
    selector: 'app-false-culture',
    imports: [NgApexchartsModule],
    templateUrl: './false-culture.component.html',
    styleUrl: './false-culture.component.scss'
})
export class FalseCultureComponent {

  @ViewChild('chart') chart!: ChartComponent;
  public chartOptions!: ChartOptions;

  constructor() {
          this.chartOptions = {
      series: [
      {
        name: "Test1",  
        data: [2, 3, 1, 2, 3, 8]
      },
      ],
      chart: {
      height: window.innerWidth < 480 ? 240 : 320,
      type: "bar",
      stacked: false,
      toolbar: {
        show: false
      }
      },
      stroke: {
      width: [0, 3]
      },
      title: {
      text: "Traffic Sources"
      },
      dataLabels: {
      enabled: true,
      enabledOnSeries: [0]
      },
      xaxis: {
      labels: {
        rotate: -45,
        trim: false,
        style: {
          fontSize: '12px'
        }
      },
      categories: ["Goal 1", "Goal 2", "Goal 3", "Goal 4", "Goal 5", "Goal 6"],
      tickPlacement: "on"
      },
      yaxis: [
      {
        title: {
          text: ""
        }
      }
      ],
      fill: {
      type: "solid"
      },
      colors: ['#FFA29B', '#FFBB38', '#FFBB38', '#FFBB38', '#FFBB38', '#FFBB38'],
      tooltip: {
      shared: true,
      intersect: false
      },
      plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '10%',
        borderRadius: 8,
        distributed: true
      }
      },
      legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'center',
      labels: {
        colors: undefined,
        useSeriesColors: false
      },
      // 👇 This ensures it shows even for 1 series
      showForSingleSeries: true
      }
      };

  }

}
