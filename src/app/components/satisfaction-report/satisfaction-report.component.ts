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
  ApexNoData
} from "ng-apexcharts";

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis | ApexYAxis[];
  title: ApexTitleSubtitle;
  labels: string[];
  stroke: any; // ApexStroke;
  dataLabels: any; // ApexDataLabels;
  fill: ApexFill;
  plotOptions: ApexPlotOptions;
  colors: string[];
  tooltip: ApexTooltip;
  noData?:ApexNoData;
};

@Component({
    selector: 'app-satisfaction-report',
    imports: [NgApexchartsModule],
    templateUrl: './satisfaction-report.component.html',
    styleUrl: './satisfaction-report.component.scss'
})
export class SatisfactionReportComponent {
  @ViewChild('chart') chart!: ChartComponent;
  public chartOptions!: ChartOptions;

  constructor() {
    this.chartOptions = {
      series: [
        // {
        //   name: "Satisfaction",
        //   type: "column",
        //   data: [4, 6, 6, 6, 9, 8]
        // },
        // {
        //   name: "Series",
        //   type: "line",
        //   data: [1, 3, 5, 6, 7, 8]
        // }
      ],
      chart: {
        // height: 320,
        // width: 400,
        width: window.innerWidth < 480 ? 280 : 360,
        height: window.innerWidth < 480 ? 240 : 320,
        type: "line",
        stacked: false,
      },
      stroke: {
        width: [0, 3]
      },
      title: {
        text: ""
      },
      dataLabels: {
        enabled: true,
        enabledOnSeries: [1]
      },
      labels: [
        // "01 Jan",
        // "02 Jan",
        // "03 Jan",
        // "04 Jan",
        // "05 Jan",
        // "06 Jan"
      ],
      xaxis: {
        type: "datetime",
        labels: {
          format: "MMM"
        }
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
            horizontal: false,
            columnWidth: '10%',
            borderRadius: 8
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
              name: "Satisfaction",
              type: "column",
              data: [4, 6, 6, 6, 9, 8]
            },
            {
              name: "Series",
              type: "line",
              data: [1, 3, 5, 6, 7, 8]
            }
          ],
          chart: {
            // height: 320,
            // width: 400,
            width: window.innerWidth < 480 ? 280 : 360,
            height: window.innerWidth < 480 ? 240 : 320,
            type: "line",
            stacked: false,
          },
          stroke: {
            width: [0, 3]
          },
          title: {
            text: ""
          },
          dataLabels: {
            enabled: true,
            enabledOnSeries: [1]
          },
          labels: [
            "01 Jan",
            "02 Jan",
            "03 Jan",
            "04 Jan",
            "05 Jan",
            "06 Jan"
          ],
          xaxis: {
            type: "datetime",
            labels: {
              format: "MMM"
            }
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
                horizontal: false,
                columnWidth: '10%',
                borderRadius: 8
              }
            }
        };
     }

     updateSeries(dataSet){
       console.log("dataSet ",dataSet)
        let getLabels = dataSet.map((el:any)=> ( el.label ));
        let getData = dataSet.map((el:any)=> ( el.value ));
       this.chart.updateSeries(getData ,true)
     }
}
