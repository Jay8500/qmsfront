import { Component, ViewChild, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { NgApexchartsModule, ChartComponent } from 'ng-apexcharts';

import {
  ApexNonAxisChartSeries,
  ApexResponsive,
  ApexChart,
  ApexLegend,
  ApexFill,
  ApexStroke,
  ApexDataLabels,
  ApexNoData
} from "ng-apexcharts";

export type ChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  labels: string[];
  responsive: ApexResponsive[];
  colors: string[];
  legend: ApexLegend;
  fill: ApexFill;
  stroke?: ApexStroke;
  dataLabels?: ApexDataLabels;
  noData?:ApexNoData;

};

@Component({
    selector: 'app-incident-happens',
    imports: [NgApexchartsModule],
    templateUrl: './incident-happens.component.html',
    styleUrl: './incident-happens.component.scss'
})
export class IncidentHappensComponent {
    @ViewChild("chart") chart!: ChartComponent;
      public chartOptions: ChartOptions;
      public info:string = '';

      constructor() {
        this.chartOptions = {
          series: [],
          chart: {
            type: "donut",
            height: window.innerWidth < 480 ? 285 : 330,
          },
          labels: [],
          colors: [],
          fill: {
            type: "solid"
          },
          stroke: {
            show: false,
            width: 0,
          },
          dataLabels: {
            enabled: false
          },
          legend: {
            position: "bottom",
            fontSize: "14px",
            fontWeight: 500,
            labels: {
              colors: "#333"
            },
            markers: {
              shape: "circle"
            },
            itemMargin: {
              horizontal: 10,
              vertical: 5
            }
          },
          responsive: [
            {
              breakpoint: 480,
              options: {
                legend: {
                  position: "bottom"
                }
              }
            }
          ],
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

       plotData(dataSet,chartType?,info?){
         if(dataSet.length==0) return;
         this.info = info
        let getLabels = dataSet.map((el:any)=> ( el.label ));
        let getData = dataSet.map((el:any)=> ( el.value ));
        this.chartOptions = {
          series: getData,
          chart: {
            type: chartType||"donut",
            // height: window.innerWidth < 480 ? 240 : 320,
          },
          labels: getLabels,
          colors: [],
          fill: {
            type: "solid"
          },
          stroke: {
            show: false,
            width: 0,
          },
          dataLabels: {
            enabled: false
          },
          legend: {
            position: "bottom",
            fontSize: "14px",
            fontWeight: 500,
            labels: {
              colors: "#333"
            },
            markers: {
              shape: "circle"
            },
            itemMargin: {
              horizontal: 10,
              vertical: 5
            }
          },
          responsive: [
            {
              breakpoint: 480,
              options: {
                chart: {
                  width: 250
                },
                legend: {
                  position: "bottom"
                }
              }
            }
          ],
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
