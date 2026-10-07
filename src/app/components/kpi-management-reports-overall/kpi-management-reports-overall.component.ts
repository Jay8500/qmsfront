import { Component, ViewChild } from '@angular/core';
import { NgApexchartsModule } from 'ng-apexcharts';

import {
  ChartComponent,
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexDataLabels,
  ApexStroke,
  ApexMarkers,
  ApexYAxis,
  ApexGrid,
  ApexTitleSubtitle,
  ApexLegend,
  ApexNoData
} from "ng-apexcharts";

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  stroke: ApexStroke;
  dataLabels: ApexDataLabels;
  markers: ApexMarkers;
  colors: string[];
  yaxis: ApexYAxis;
  grid: ApexGrid;
  legend: ApexLegend;
  title: ApexTitleSubtitle;
  noData?:ApexNoData;
};

@Component({
    selector: 'app-kpi-management-reports-overall',
    imports: [NgApexchartsModule],
    templateUrl: './kpi-management-reports-overall.component.html',
    styleUrls: ['./kpi-management-reports-overall.component.scss']
})
export class KpiManagementReportsOverallComponent {

  @ViewChild("chart") chart!: ChartComponent;
  public chartOptions: ChartOptions;

  constructor() {
    this.chartOptions = {
      series: [],
      chart: {
        height: window.innerWidth < 480 ? 280 : 350,
        width: window.innerWidth < 480 ? 280 : 650,
        type: "line",
        dropShadow: {
          enabled: true,
          color: "#000",
          top: 18,
          left: 7,
          blur: 10,
          opacity: 0.2
        },
        toolbar: {
          show: false
        }
      },
      colors: [],
      dataLabels: {
        enabled: false
      },
      stroke: {
        curve: "smooth",
        width: 2
      },
      title: {
        text: "",
        align: "left"
      },
      grid: {
        borderColor: "#e7e7e7",
        row: {
          colors: ["#f3f3f3", "transparent"],
          opacity: 0.5
        }
      },
      markers: {
        size: 0
      },
      xaxis: {
        categories: [],
        title: {
          text: ""
        }
      },
      yaxis: {
        title: {
          text: ""
        },
        min: 5,
        max: 100
      },
      legend: {
        position: "bottom",
        horizontalAlign: "center",
        floating: true,
        offsetY: 30,
      },
          noData : {
            text : 'No data found',
            align : 'center',
            verticalAlign : 'middle',
            offsetX:0,
            offsetY:0,
            style : {
              color : '#888888',
              fontSize : '16px',
              fontFamily : 'Helvertica, Arial, san-serif'
            }
          }
    };
  }

  plotData(dataSet,chartType?){
    let getLabels:any = [... new Set(dataSet.map((el:any)=> ( el.month ))) ];
    let grouped :any = dataSet.reduce((acc, { label , month, value }) => {
      if(!acc[label]) acc[label] = {};
      acc[label][month] = value;
      return acc;
    },{});
    let series = Object.entries(grouped).map(([label,monthMap]:any) =>  ({
      name : label,
      data : getLabels.map(m =>monthMap[m] ?? 0 )
    }) )

    this.chartOptions = {
      series,
      chart: {
        height: window.innerWidth < 480 ? 280 : 350,
        width: window.innerWidth < 480 ? 280 : 650,
        type: "line",
        dropShadow: {
          enabled: true,
          color: "#000",
          top: 18,
          left: 7,
          blur: 10,
          opacity: 0.2
        },
        toolbar: {
          show: false
        }
      },
      colors: [],
      dataLabels: {
        enabled: false
      },
      stroke: {
        curve: "smooth",
        width: 2
      },
      title: {
        text: "",
        align: "left"
      },
      grid: {
        borderColor: "#e7e7e7",
        row: {
          colors: ["#f3f3f3", "transparent"],
          opacity: 0.5
        }
      },
      markers: {
        size: 0
      },
      xaxis: {
        categories: getLabels,
        title: {
          text: ""
        }
      },
      yaxis: {
        title: {
          text: "Units of Measure"
        },
        min: 5,
        max: 100
      },
      legend: {
        position: "bottom",
        horizontalAlign: "center",
        floating: true,
        offsetY: 30,
      },
          noData : {
            text : 'No data found',
            align : 'center',
            verticalAlign : 'middle',
            offsetX:0,
            offsetY:0,
            style : {
              color : '#888888',
              fontSize : '16px',
              fontFamily : 'Helvertica, Arial, san-serif'
            }
          }
    };
  }

  updateSeries(dataSet){
    let getLabels:any = [... new Set(dataSet.map((el:any)=> ( el.month ))) ];
    let grouped :any = dataSet.reduce((acc, { label , month, value }) => {
      if(!acc[label]) acc[label] = {};
      acc[label][month] = value;
      return acc;
    },{});
    let series = Object.entries(grouped).map(([label,monthMap]:any) =>  ({
      name : label,
      data : getLabels.map(m =>monthMap[m] ?? 0 )
    }) )

    this.chart.updateSeries(dataSet ,true)
  }

}
