import { Component, ViewChild, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { NgApexchartsModule, ChartComponent } from "ng-apexcharts";

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
  ApexTitleSubtitle,
  ApexTooltip,
  ApexResponsive,
  ApexNoData,
} from "ng-apexcharts";

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  labels: string[];
  responsive: ApexResponsive[];
  colors: string[];
  legend: ApexLegend;
  fill: ApexFill;
  stroke: ApexStroke;
  title: ApexTitleSubtitle;
  dataLabels: ApexDataLabels;
  plotOptions: ApexPlotOptions;
  yaxis: ApexYAxis;
  xaxis: ApexXAxis;
  tooltip: ApexTooltip;
  noData?: ApexNoData;
};

@Component({
  selector: "app-periods-wise-incidents",
  imports: [NgApexchartsModule],
  templateUrl: "./periods-wise-incidents.component.html",
  styleUrl: "./periods-wise-incidents.component.scss",
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class PeriodsWiseIncidentsComponent {
  @ViewChild("chart") chart!: ChartComponent;
  public chartOptions: ChartOptions;

  constructor() {
    this.chartOptions = {
      series: [
        // { name: "Patient", data: [20, 20, 20, 20, 20] },
        // { name: "Visitors", data: [20, 20, 20, 30, 30] },
        // { name: "Hospital Staff", data: [20, 20, 20, 20, 20] },
        // { name: "Others", data: [20, 20, 20, 20, 20] }
      ],
      chart: {
        type: "bar",
        height: window.innerWidth < 480 ? 250 : 280,
        width: window.innerWidth < 480 ? 270 : 350,
        stacked: true,
      },
      plotOptions: {
        bar: {
          horizontal: true,
          barHeight: "45%",
          dataLabels: {
            position: "center",
          },
        },
      },
      stroke: {
        width: 1,
        colors: [],
      },
      title: {
        text: "",
      },
      xaxis: {
        categories: [], //"Jan", "Feb", "Mar", "Apr"
        labels: { show: false },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        labels: { show: true },
        axisBorder: { show: true },
        axisTicks: { show: true },
      },
      tooltip: {
        y: {
          formatter: function (val) {
            return val + "K";
          },
        },
      },
      fill: {
        opacity: 1,
      },
      legend: {
        position: "bottom",
        horizontalAlign: "left",
        offsetX: 0,
      },
      labels: [],
      responsive: [],
      colors: [],
      dataLabels: {
        enabled: true,
      },
      noData: {
        text: "No data found",
        align: "center",
        verticalAlign: "middle",
        offsetX: 0,
        offsetY: 0,
        style: {
          color: "#888888",
          fontSize: "16px",
          fontFamily: "Helvertica, Arial, san-serif",
        },
      },
    };
  }

  plotData(dataSet, chartType?) {
    let seriesTransform = this.transformData(dataSet, chartType);
    this.chartOptions = {
      series: seriesTransform,
      chart: {
        type: "bar",
        height: window.innerWidth < 480 ? 250 : 280,
        width: window.innerWidth < 480 ? 270 : 350,
        stacked: true,
      },
      plotOptions: {
        bar: {
          horizontal: true,
          barHeight: "45%",
          dataLabels: {
            position: "center",
          },
        },
      },
      stroke: {
        width: 1,
        colors: [],
      },
      title: {
        text: "",
      },
      xaxis: {
        categories: dataSet.map((item) => item.label), //"Jan", "Feb", "Mar", "Apr"
        labels: { show: false },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        labels: { show: true },
        axisBorder: { show: true },
        axisTicks: { show: true },
      },
      tooltip: {
        y: {
          formatter: function (val) {
            return val + "";
          },
        },
      },
      fill: {
        opacity: 1,
      },
      legend: {
        position: "bottom",
        horizontalAlign: "left",
        offsetX: 0,
      },
      labels: [],
      responsive: [],
      colors: [],
      dataLabels: {
        enabled: true,
      },
      noData: {
        text: "No data found",
        align: "center",
        verticalAlign: "middle",
        offsetX: 0,
        offsetY: 0,
        style: {
          color: "#888888",
          fontSize: "16px",
          fontFamily: "Helvertica, Arial, san-serif",
        },
      },
    };
  }

  updateSeries(dataSet, seriesName) {
    this.chart.updateSeries(this.transformData(dataSet, seriesName), true);
  }

  transformData(data: any, seriesName: string) {
    return [
      {
        name: seriesName,
        data: data.map((item) => item.value),
      },
    ];
  }
}
