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
  ApexResponsive,
  ApexNoData
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
  noData?:ApexNoData;
};

@Component({
    selector: 'app-grievance-complaint-type',
    imports: [NgApexchartsModule],
    templateUrl: './grievance-complaint-type.component.html',
    styleUrl: './grievance-complaint-type.component.scss',
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class GrievanceComplaintTypeComponent {
  @ViewChild('chart') chart!: ChartComponent;
    public chartOptions!: ChartOptions;

    constructor() {
      this.chartOptions = {
        series: [],
        chart: {
          type: 'bar',
          width: '100%',
          height: window.innerWidth < 480 ? 260 : 340,
        },
        plotOptions: {
          bar: {
            horizontal: true,
            borderRadius: 4,
            distributed: true,
            dataLabels: {
              position: 'center' // position inside the bar
            }
          },
        },
        dataLabels: {
          enabled: true,
          formatter: function (val: number) {
            return `${val}%`; // show percentage
          },
          style: {
            colors: ['#fff'], // white text
            fontWeight: 'bold'
          }
        },
        stroke: {
          show: true,
          width: 2,
          colors: ['transparent'],
        },
        xaxis: {
          categories: [
            // 'Facility', 'Misunderstanding', 'Rude Behavior', 'False Accusation', 'Misbehavior'
            ],
          labels: {
            show: true,
          },
          axisBorder: {
            show: false,
          },
          axisTicks: {
            show: false,
          },
          title: {
            text: '',
          },
        },
        yaxis: {
          labels: {
            show: false,
          },
          axisBorder: {
            show: false,
          },
          axisTicks: {
            show: false,
          },
          title: {
            text: '',
          },
        },
        fill: {
          opacity: 1,
        },
        colors: ['#D92D20', '#1D8C3A', '#062A64', '#FFBB38', '#FFA1C1'],
        labels: [],
        legend: {
          show: true,
        },
        responsive: [],
        tooltip: {
          y: {
            formatter: (val: number): string => `${val}%`,
          },
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
      let getLabels = dataSet.map((el:any)=> ( el.label ));
      let getData = dataSet.map((el:any)=> ( el.value ));
      this.chartOptions = {
        series: [
          {
            name: 'Series',
            data: getData,
          }
        ],
        chart: {
          type: 'bar',
          width: '100%',
          height: window.innerWidth < 480 ? 260 : 340,
        },
        plotOptions: {
          bar: {
            horizontal: true,
            borderRadius: 4,
            distributed: true,
            dataLabels: {
              position: 'center' // position inside the bar
            }
          },
        },
        dataLabels: {
          enabled: true,
          formatter: function (val: number) {
            return `${val}%`; // show percentage
          },
          style: {
            colors: ['#fff'], // white text
            fontWeight: 'bold'
          }
        },
        stroke: {
          show: true,
          width: 2,
          colors: ['transparent'],
        },
        xaxis: {
          categories: getLabels,
          labels: {
            show: true,
          },
          axisBorder: {
            show: false,
          },
          axisTicks: {
            show: false,
          },
          title: {
            text: '',
          },
        },
        yaxis: {
          labels: {
            show: false,
          },
          axisBorder: {
            show: false,
          },
          axisTicks: {
            show: false,
          },
          title: {
            text: '',
          },
        },
        fill: {
          opacity: 1,
        },
        colors: [],
        labels: getLabels,
        legend: {
          show: true,
        },
        responsive: [],
        tooltip: {
          y: {
            formatter: (val: number): string => `${val}%`,
          },
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
        let getLabels = dataSet.map((el:any)=> ( el.label ));
        let getData = dataSet.map((el:any)=> ( el.value ));
       this.chart.updateSeries(getData ,true)
     }
}
