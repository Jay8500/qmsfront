import { Component, ViewChild, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { NgApexchartsModule, ChartComponent } from 'ng-apexcharts';

import {
  ApexNonAxisChartSeries,
  ApexResponsive,
  ApexChart,
  ApexLegend,
  ApexFill,
  ApexStroke,
  ApexPlotOptions,
  ApexDataLabels,
  ApexNoData
} from "ng-apexcharts";

export type ChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  labels: string[];
  responsive: ApexResponsive[];
  plotOptions: ApexPlotOptions;
  grid: ApexGrid
  colors: string[];
  legend: ApexLegend;
  fill: ApexFill;
  stroke?: ApexStroke;
  dataLabels?: ApexDataLabels;
     noData?:ApexNoData;
};

@Component({
    selector: 'app-discharge-feedbacks',
    imports: [NgApexchartsModule],
    templateUrl: './discharge-feedbacks.component.html',
    styleUrl: './discharge-feedbacks.component.scss'
})
export class DischargeFeedbacksComponent {
  @ViewChild("chart") chart!: ChartComponent;
  public chartOptions: ChartOptions;

  constructor() {
    this.chartOptions = {
          series: [],
          chart: {
            // width: 380,
            width: window.innerWidth < 480 ? 345 : 380,
            type: "donut"
          },
          labels: [],
          colors: [],
          legend: {
            position: 'bottom'
          },
          fill: {
            type: 'fill'
          },
          stroke: {
            width: 1
          },
          dataLabels: {
            enabled: true
          },
          plotOptions: {
            pie: {
              startAngle: -90,
              endAngle: 90,
              offsetY: 10,
              donut: {
                size: '75%',
                labels: {
                  show: true,
                  name: {
                    show: true,
                    offsetY: 0,
                    fontSize: '26px',
                    color: '#6E7880',
                    formatter: () => 'Discharge'
                  },
                  value: {
                    show: true,
                    fontSize: '40px',
                    fontWeight: 500,
                    color: '#000',
                    offsetY: -50,
                    formatter: () => '278'
                  },
                  total: {
                    show: true
                  }
                }
              }
            }
          },

          grid: {
            padding: {
              bottom: -80
            }
          },
          responsive: [
            {
              breakpoint: 480,
              options: {
                legend: {
                  position: 'bottom'
                }
              }
            }
          ],noData : {
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
          series: getData,
          chart: {
            // width: 380,
            width: window.innerWidth < 480 ? 345 : 380,
            type: "donut"
          },
          labels: getLabels,
          colors: [],
          legend: {
            position: 'bottom'
          },
          fill: {
            type: 'fill'
          },
          stroke: {
            width: 1
          },
          dataLabels: {
            enabled: true
          },
          plotOptions: {
            pie: {
              startAngle: -90,
              endAngle: 90,
              offsetY: 10,
              donut: {
                size: '75%',
                labels: {
                  show: true,
                  name: {
                    show: true,
                    offsetY: 0,
                    fontSize: '26px',
                    color: '#6E7880',
                    formatter: () => 'Discharge'
                  },
                  value: {
                    show: true,
                    fontSize: '40px',
                    fontWeight: 500,
                    color: '#000',
                    offsetY: -50,
                    formatter: () => '278'
                  },
                  total: {
                    show: true
                  }
                }
              }
            }
          },

          grid: {
            padding: {
              bottom: -80
            }
          },
          responsive: [
            {
              breakpoint: 480,
              options: {
                legend: {
                  position: 'bottom'
                }
              }
            }
          ],noData : {
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
