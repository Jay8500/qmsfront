import { Component, ViewChild } from '@angular/core';
import { NgApexchartsModule, ChartComponent } from 'ng-apexcharts';

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
  ApexNoData
} from "ng-apexcharts";

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  stroke: ApexStroke;
  tooltip: ApexTooltip;
  legend: ApexLegend;
  colors: string[];
  fill: ApexFill;
  responsive?: ApexResponsive[];
  dataLabels?: ApexDataLabels;
  noData?:ApexNoData;
};

@Component({
    selector: 'app-suggestions-prem',
    imports: [NgApexchartsModule],
    templateUrl: './suggestions-prem.component.html',
    styleUrl: './suggestions-prem.component.scss'
})
export class SuggestionsPremComponent {
  @ViewChild("chart") chart!: ChartComponent;

  public chartOptions: ChartOptions;

  constructor() {
    this.chartOptions = {
      series: [  ],
      chart: {
        // width: 360,
        // height: 320,
        height: window.innerWidth < 480 ? 240 : 320,
        width: window.innerWidth < 480 ? 280 : 360,
        type: "area"
      },
      dataLabels: {
        enabled: false
      },
      colors: ["#1D7ECE", "#FFB11F"],
      stroke: {
        curve: "smooth"
      },
      xaxis: {
        type: "category",
        categories: []
      },
      tooltip: {
        x: {
          formatter: (val: number) => [][val] ?? ''
        }
      },
      legend: {
        position: "bottom",
        horizontalAlign: "center"
      },
      fill: {
        type: "gradient",
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.4,
          opacityTo: 0.1,
          stops: [0, 8, 10]
        }
      }
    };
  }

  plotData(dataSet,chartType?){
     dataSet = dataSet[0];
     let crtDtaSt: any = {"labels": [],"series": [],"chartNames": ['Suggestions', 'Compliance']};
     let allMonths :any = [];
     if(Object.keys(dataSet['suggestions']  || {}).length > 0 ){
        allMonths = [];
        allMonths.push(Object.keys(dataSet['suggestions'] ))
      };

     if(Object.keys(dataSet['compliance']  || {}).length > 0 ){
        allMonths = [];
        allMonths.push(Object.keys(dataSet['compliance'] ))
     };

     let labels:any = Array.from(new Set(allMonths));
      if(Object.keys(dataSet['suggestions']  || {}).length > 0 ){
            crtDtaSt['series'].push(
              {
                name: "Suggestions",
                data: labels.map(mnth => dataSet.suggestions[mnth] || 0)
              });
      };
     if(Object.keys(dataSet['compliance']  || {}).length > 0 ){
            crtDtaSt['series'].push(
            {
              name: "Compliance",
              data: labels.map(mnth => dataSet.compliance[mnth] || 0)
            });
    };
    crtDtaSt['labels'] = labels;
     this.chartOptions = {
      series: crtDtaSt['series'],
      chart: {
        // width: 360,
        // height: 320,
        height: window.innerWidth < 480 ? 240 : 320,
        width: window.innerWidth < 480 ? 280 : 360,
        type: "area"
      },
      dataLabels: {
        enabled: false
      },
      colors: [],
      stroke: {
        curve: "smooth"
      },
      xaxis: {
        type: "category",
        categories: crtDtaSt['labels']
      },
      tooltip: {
        x: {
          formatter: (val: number) =>crtDtaSt['labels'][val] ?? ''
        }
      },
      legend: {
        position: "bottom",
        horizontalAlign: "center"
      },
      fill: {
        type: "gradient",
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.4,
          opacityTo: 0.1,
          stops: [0, 8, 10]
        }
      }
    };
  }

  updateSeries(dataSet){
     dataSet = dataSet[0];
        let crtDtaSt: any = {"labels": [],"series": [],"chartNames": ['Suggestions', 'Compliance']};
     let allMonths :any = [];
     if(Object.keys(dataSet['suggestions']  || {}).length > 0 ){
        allMonths = [];
        allMonths.push(Object.keys(dataSet['suggestions'] ))
      };

     if(Object.keys(dataSet['compliance']  || {}).length > 0 ){
        allMonths = [];
        allMonths.push(Object.keys(dataSet['compliance'] ))
     };

     let labels:any = Array.from(new Set(allMonths));
      if(Object.keys(dataSet['suggestions']  || {}).length > 0 ){
            crtDtaSt['series'].push(
              {
                name: "Suggestions",
                data: labels.map(mnth => dataSet.suggestions[mnth] || 0)
              });
      };
     if(Object.keys(dataSet['compliance']  || {}).length > 0 ){
            crtDtaSt['series'].push(
            {
              name: "Compliance",
              data: labels.map(mnth => dataSet.compliance[mnth] || 0)
            });
    };
    crtDtaSt['labels'] = labels;
       this.chart.updateSeries(crtDtaSt['series'] ,true)
  }

}
