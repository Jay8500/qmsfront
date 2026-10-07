import { Component, ViewChild } from "@angular/core";
import { NgApexchartsModule, ChartComponent } from "ng-apexcharts";
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexStroke,
  ApexTooltip,
  ApexLegend,
  ApexFill,
  ApexResponsive,
  ApexDataLabels,
  ApexNoData,
} from "ng-apexcharts";

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  stroke: ApexStroke;
  tooltip: ApexTooltip;
  legend: ApexLegend;
  colors: string[];
  fill: ApexFill;
  responsive?: ApexResponsive[];
  dataLabels?: ApexDataLabels;
  noData?: ApexNoData;
};

@Component({
  selector: "app-training-wise-reports",
  imports: [NgApexchartsModule],
  templateUrl: "./training-wise-reports.component.html",
  styleUrl: "./training-wise-reports.component.scss",
})
export class TrainingWiseReportsComponent {
  @ViewChild("chart") chart!: ChartComponent;
  public chartOptions: ChartOptions;

  constructor() {
    this.chartOptions = {
      series: [],
      chart: {
        height: window.innerWidth < 480 ? 160 : 320,
        type: "area",
      },
      dataLabels: {
        enabled: false,
      },
      colors: [],
      stroke: {
        curve: "smooth",
      },
      xaxis: {},
      yaxis: {},
      tooltip: {
        // x: {
        //   formatter: (val: number) => this.monthCategories[val] ?? ''
        // }
      },
      legend: {
        position: "bottom",
        horizontalAlign: "center",
      },
      fill: {
        type: "gradient",
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.4,
          opacityTo: 0.1,
          stops: [0, 8, 10],
        },
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

  plotData(dataSet, headerText) {
    let getLabels = dataSet.map((el: any) => el.label);
    let getData = dataSet.map((el: any) => el.value);
    this.chartOptions = {
      series: [
        {
          name: headerText,
          data: getData,
        },
      ],
      chart: {
        height: window.innerWidth < 480 ? 160 : 320,
        type: "area",
      },
      dataLabels: {
        enabled: false,
      },
      colors: [],
      stroke: {
        width: [0, 3],
        curve: "smooth",
      },
      xaxis: {
        type: "category",
        categories: getLabels,
      },
      yaxis: {
        min: 0,
        forceNiceScale: true,
        labels: {
          formatter: (val) => {
            console.log("val ", val);
            return val.toFixed(0);
          },
        },
        tickAmount: undefined,
      },
      tooltip: {
        x: {
          formatter: (val: number) => getLabels[val] ?? "",
        },
      },
      legend: {
        position: "bottom",
        horizontalAlign: "center",
      },
      fill: {
        type: "gradient",
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.4,
          opacityTo: 0.1,
          stops: [0, 8, 10],
        },
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

  updateSeries(dataSet, headerText) {
    let getLabels = dataSet.map((el: any) => el.label);
    let getData = dataSet.map((el: any) => el.value);
    let formattedSeries = [
      {
        name: headerText,
        data: getData,
      },
    ];
    this.chart.updateOptions({
      yaxis: {
        min: 0,
        forceNiceScale: true,
        labels: {
          formatter: (val) => {
            return val.toFixed(0);
          },
        },
        tickAmount: undefined,
      },
      xaxis: {
        type: "category",
        categories: getLabels,
      },
    });
    this.chart.updateSeries(formattedSeries, true);
  }
}
