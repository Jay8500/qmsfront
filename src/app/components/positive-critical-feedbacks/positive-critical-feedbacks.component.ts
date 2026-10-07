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
    selector: 'app-positive-critical-feedbacks',
    imports: [NgApexchartsModule],
    templateUrl: './positive-critical-feedbacks.component.html',
    styleUrl: './positive-critical-feedbacks.component.scss',
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class PositiveCriticalFeedbacksComponent {
  @ViewChild('chart') chart!: ChartComponent;
    public chartOptions!: ChartOptions;
  
    constructor() {
      this.chartOptions = {
        series: [
          {
            name: 'Positive',
            data: [44, 55, 57],
          },
          {
            name: 'Critical',
            data: [35, 41, 36],
          },
        ],
        chart: {
          type: 'bar',
          height: 350,
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
          categories: ['Jan', 'Feb', 'Mar'],
        },
        yaxis: {
          title: {
            text: '',
          },
        },
        fill: {
          opacity: 1,
        },
        colors: ['#062A64', '#FF6195'],
        labels: [],
        legend: {
          position: 'bottom',
          horizontalAlign: 'center',
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
