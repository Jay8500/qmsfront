import { Component, ViewChild, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { NgApexchartsModule, ChartComponent } from 'ng-apexcharts';

import {
  ApexAxisChartSeries,
  ApexChart,
  ApexDataLabels,
  ApexPlotOptions,
  ApexYAxis,
  ApexLegend,
  ApexStroke,
  ApexXAxis,
  ApexFill,
  ApexTooltip,
  ApexResponsive
} from 'ng-apexcharts';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  labels: string[];
  responsive: ApexResponsive[];
  colors: string[];
  legend: ApexLegend;
  fill: ApexFill;
  stroke: ApexStroke;
  dataLabels: ApexDataLabels;
  plotOptions: ApexPlotOptions;
  yaxis: ApexYAxis;
  xaxis: ApexXAxis;
  tooltip: ApexTooltip;
};

@Component({
    selector: 'app-recent-compliance',
    imports: [NgApexchartsModule],
    templateUrl: './recent-compliance.component.html',
    styleUrl: './recent-compliance.component.scss',
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class RecentComplianceComponent {

  @ViewChild('chart') chart!: ChartComponent;
  public chartOptions!: ChartOptions;

  constructor() {
    this.chartOptions = {
      series: [
        {
          name: 'Non-Compliance',
          data: [44, 55, 57, 45],
        },
        {
          name: 'Compliance',
          data: [35, 41, 36, 35],
        },
      ],
      chart: {
        type: 'bar',
        height: window.innerWidth < 480 ? 240 : 320,
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '40%',
          borderRadius: 4,
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        show: true,
        width: 2,
        colors: ['transparent'],
      },
      xaxis: {
        categories: ['Jan', 'Feb', 'Mar', 'Apr'],
      },
      yaxis: {
        title: {
          text: '',
        },
      },
      fill: {
        opacity: 1,
      },
      colors: ['#1814F3', '#16DBCC'],
      labels: [],
      legend: {
        position: 'top',
        horizontalAlign: 'right',
      },
      responsive: [],
      tooltip: {
        y: {
          formatter: (val: number): string => `$ ${val} thousands`,
        },
      },
    };
  }
}
