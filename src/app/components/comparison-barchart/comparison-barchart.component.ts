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
    selector: 'app-comparison-barchart',
    imports: [NgApexchartsModule],
    templateUrl: './comparison-barchart.component.html',
    styleUrl: './comparison-barchart.component.scss',
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ComparisonBarchartComponent {
  @ViewChild('chart') chart!: ChartComponent;
  public chartOptions!: ChartOptions;

  constructor() {

    this.chartOptions = {
      series: [

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
        categories: [],
      },
      yaxis: {
        title: {
          text: '',
        },
      },
      fill: {
        opacity: 1,
      },
      colors: [],
      labels: [],
      legend: {
        position: 'top',
        horizontalAlign: 'right',
      },
      responsive: [],
      tooltip: {
        y: {
          formatter: (val: number): string => `${val}`,
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
      try{
       this.chartOptions = {
        series: dataSet.series,
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
            categories: [],
          },
          yaxis: {
            title: {
              text: '',
            },
          },
          fill: {
            opacity: 1,
          },
          colors: [],
          labels: dataSet.labels,
          legend: {
            position: 'top',
            horizontalAlign: 'right',
          },
          responsive: [],
          tooltip: {
            y: {
              formatter: (val: number): string => `${val}`,
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
        }catch(e){
        }

  }

  updateSeries(dataSet){
        let getLabels = dataSet.map((el:any)=> ( el.label ));
        let getData = dataSet.map((el:any)=> ( el.value ));
        this.chart.updateSeries(getData ,true)
  }
}
