import { Component, ViewChild, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { NgApexchartsModule, ChartComponent } from 'ng-apexcharts';

import {
  ApexNonAxisChartSeries,
  ApexPlotOptions,
  ApexChart,
  ApexLegend,
  ApexResponsive,
   ApexNoData
} from "ng-apexcharts";

export type ChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  labels: string[];
  colors: string[];
  legend: ApexLegend;
  plotOptions: ApexPlotOptions;
  responsive: ApexResponsive[];
  noData?:ApexNoData;
};

@Component({
    selector: 'app-type-riskchart',
    imports: [NgApexchartsModule],
    templateUrl: './type-riskchart.component.html',
    styleUrl: './type-riskchart.component.scss',
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class TypeRiskchartComponent {

  @ViewChild("chart") chart!: ChartComponent;
      public chartOptions: ChartOptions;

      constructor() {
        this.chartOptions = {
          series: [],
          chart: {
            // height: window.innerWidth < 480 ? 200 : 390,
            type: "radialBar"
          },
          plotOptions: {
            radialBar: {
              offsetY: 0,
              startAngle: 0,
              endAngle: 270,
              hollow: {
                margin: 5,
                size: "30%",
                background: "transparent",
                image: undefined
              },
              dataLabels: {
                name: {
                  show: false
                },
                value: {
                  show: false
                }
              }
            }
          },
          colors: [],
          labels: [],
          legend: {
            show: true,
            floating: true,
            fontSize: "10px",
            position: "left",
            // offsetX: 70,
            // offsetY: 10,
            labels: {
              useSeriesColors: true
            },
            formatter: function(seriesName, opts) {
              return seriesName + ":  " + opts.w.globals.series[opts.seriesIndex];
            },
            itemMargin: {
              horizontal: 3
            }
          },
          responsive: [
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

    plotData(dataSet,chartType?){
        let getLabels = dataSet.map((el:any)=> ( el.label ));
        let getData = dataSet.map((el:any)=> ( el.value ));
       this.chartOptions = {
            series:getData,
          chart: {
            // height: window.innerWidth < 480 ? 200 : 390,
            type: "radialBar"
          },
          plotOptions: {
            radialBar: {
              offsetY: 0,
              startAngle: 0,
              endAngle: 270,
              hollow: {
                margin: 5,
                size: "30%",
                background: "transparent",
                image: undefined
              },
              dataLabels: {
                name: {
                  show: false
                },
                value: {
                  show: false
                }
              }
            }
          },
          colors: [],
          labels: getLabels,
          legend: {
            show: true,
            floating: true,
            fontSize: "10px",
            position: "left",
            // offsetX: 70,
            // offsetY: 10,
            labels: {
              useSeriesColors: true
            },
            formatter: function(seriesName, opts) {
              return seriesName + ":  " + opts.w.globals.series[opts.seriesIndex];
            },
            itemMargin: {
              horizontal: 3
            }
          },
          responsive: [
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
