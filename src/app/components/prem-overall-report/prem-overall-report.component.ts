import { Component, ViewChild } from '@angular/core';
import { NgApexchartsModule } from 'ng-apexcharts';

import {
  ApexAxisChartSeries,
  ApexChart,
  ChartComponent,
  ApexDataLabels,
  ApexPlotOptions,
  ApexYAxis,
  ApexLegend,
  ApexStroke,
  ApexXAxis,
  ApexFill,
  ApexTooltip
} from "ng-apexcharts";

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  dataLabels: ApexDataLabels;
  plotOptions: ApexPlotOptions;
  yaxis: ApexYAxis;
  xaxis: ApexXAxis;
  fill: ApexFill;
  tooltip: ApexTooltip;
  stroke: ApexStroke;
  colors: string[];
  legend: ApexLegend;
};

@Component({
    selector: 'app-prem-overall-report',
    imports: [NgApexchartsModule],
    templateUrl: './prem-overall-report.component.html',
    styleUrls: ['./prem-overall-report.component.scss'] // ✅ fixed plural
})
export class PremOverallReportComponent {

  @ViewChild("chart") chart!: ChartComponent;
  public chartOptions: ChartOptions;

  constructor() {
    this.chartOptions = {
      series: [
        {
          name: "In Patient",
          data: [44, 55, 57, 56, 61]
        },
        {
          name: "Discharge",
          data: [76, 85, 101, 98, 87]
        },
        {
          name: "Out Patient",
          data: [35, 41, 36, 26, 45]
        }
      ],
      chart: {
        type: "bar",
        height: window.innerWidth < 480 ? 260 : 330,
        width: window.innerWidth < 480 ? 280 : 670,
      },
      colors: [
        "#FCCA46", 
        "#FF82AC",
        "#5680FF" 
      ],
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: "45%",
          borderRadius: 6 
        }
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        show: true,
        width: 2,
        colors: ["transparent"]
      },
      xaxis: {
        categories: [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
        ]
      },
      yaxis: {
        title: {
          text: "Units of Measure",
        }
      },
      fill: {
        opacity: 1
      },
      tooltip: {
        y: {
          formatter: function(val) {
            return "$ " + val + " thousands";
          }
        }
      },
      legend: { 
        show: true,
        position: 'top',
        horizontalAlign: 'center'
      }
    };
  }
}
