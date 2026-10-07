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
  ApexLegend,
  ApexNoData
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
  noData?:ApexNoData;
};


@Component({
    selector: 'app-locations-wise-incident',
    imports: [NgApexchartsModule],
    templateUrl: './locations-wise-incident.component.html',
    styleUrl: './locations-wise-incident.component.scss'
})
export class LocationsWiseIncidentComponent {
  @ViewChild('chart') chart!: ChartComponent;
  public chartOptions!: ChartOptions;

      constructor() {
       this.chartOptions = {
          series: [
            // {
            //   name: "ICU-2nd Floor",
            //   data: [2]
            // },
            // {
            //   name: "Bill Counter",
            //   data: [3]
            // },
            // {
            //   name: "Auditorium",
            //   data: [5]
            // },
            // {
            //   name: "Common Hall",
            //   data: [8]
            // }
          ],
          chart: {
            height: window.innerWidth < 480 ? 250 : 320,
            width: window.innerWidth < 480 ? 300 : 350,
            type: "bar",
            stacked: false,
            toolbar: {
              show: false
            }
          },
          title: {
            text: ""
          },
          dataLabels: {
            enabled: false
          },
          stroke: {
            show: true,
            width: 10,
            colors: ['transparent']
          },
          xaxis: {
            labels: {
              rotate: -45,
              trim: false,
              style: {
                fontSize: '12px'
              }
            },
            categories: [],
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
          colors: [],
          tooltip: {
            shared: true,
            intersect: false
          },
          plotOptions: {
            bar: {
              horizontal: true,
              columnWidth: '40%',
              borderRadius: 8,
              borderRadiusApplication: 'end',
              distributed: true
            }
          },
          legend: {
            show: true,
            position: 'top',
            horizontalAlign: 'center',
            labels: {
              useSeriesColors: true
            },
            showForSingleSeries: false
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
          if(dataSet.length == 0) return;

          let seriesTransform = this.transformData(dataSet,chartType);
           this.chartOptions = {
          series: seriesTransform,
          chart: {
            height: window.innerWidth < 480 ? 250 : 320,
            width: window.innerWidth < 480 ? 300 : 350,
            type: "bar",
            stacked: false,
            toolbar: {
              show: false
            }
          },
          title: {
            text: ""
          },
          dataLabels: {
            enabled: false
          },
          stroke: {
            show: true,
            width: 10,
            colors: ['transparent']
          },
          xaxis: {
            labels: {
              rotate: -45,
              trim: false,
              style: {
                fontSize: '12px'
              }
            },
            categories: dataSet.map(item=>item.label),
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
          colors: [],
          tooltip: {
            shared: true,
            intersect: false
          },
          plotOptions: {
            bar: {
              horizontal: true,
              columnWidth: '40%',
              borderRadius: 8,
              borderRadiusApplication: 'end',
              distributed: true
            }
          },
          legend: {
            show: true,
            position: 'top',
            horizontalAlign: 'center',
            labels: {
              useSeriesColors: true
            },
            showForSingleSeries: false
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


     updateSeries(dataSet,seriesName){
       this.chart.updateSeries(this.transformData(dataSet,seriesName) ,true)
     }

      transformData(data:any,seriesName:string){
        return [
          {
            name : seriesName,
            data : data.map(item=>item.value)
          }
        ]
      }
}
