import { Component, ViewChild } from '@angular/core';
import { NgApexchartsModule, ChartComponent } from 'ng-apexcharts';

import {
  ApexNonAxisChartSeries,
  ApexResponsive,
  ApexChart,
  ApexLegend,
  ApexFill,
  ApexStroke,
  ApexDataLabels,
  ApexTheme,
  ApexPlotOptions,
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
  theme: ApexTheme;
  plotOptions: ApexPlotOptions;
    noData?:ApexNoData;
};

@Component({
    selector: 'app-department-risk',
    imports: [NgApexchartsModule],
    templateUrl: './department-risk.component.html',
    styleUrl: './department-risk.component.scss'
})
export class DepartmentRiskComponent {
  @ViewChild("chart") chart!: ChartComponent;
  public chartOptions: ChartOptions;

  constructor() {
    this.chartOptions = {
      series: [],
      chart: {
        type: "pie",
        height: window.innerWidth < 480 ? 240 : 340,
      },
      labels: [],
      colors: [],
      fill: {
        type: "solid",
        opacity: 1
      },
      stroke: {
        show: false
      },
      dataLabels: {
        enabled: true,
        style: {
          fontSize: '14px',
          fontWeight: 'bold'
        }
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
      plotOptions: {
        pie: {
          donut: {
            size: '100%',
            labels: {
              show: true,
              total: {
                show: true,
                label: 'Total',
                fontSize: '16px',
                fontWeight: 600
              },
              value: {
                show: false
              },
              name: {
                show: false
              }
            }
          }
        }
      },
      theme: {
        monochrome: {
          enabled: false
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
        type: "pie",
        height: window.innerWidth < 480 ? 240 : 340,
      },
      labels: getLabels,
      colors: [],
      fill: {
        type: "solid",
        opacity: 1
      },
      stroke: {
        show: false
      },
      dataLabels: {
        enabled: true,
        style: {
          fontSize: '14px',
          fontWeight: 'bold'
        }
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
      plotOptions: {
        pie: {
          donut: {
            size: '100%',
            labels: {
              show: true,
              total: {
                show: true,
                label: 'Total',
                fontSize: '16px',
                fontWeight: 600
              },
              value: {
                show: false
              },
              name: {
                show: false
              }
            }
          }
        }
      },
      theme: {
        monochrome: {
          enabled: false
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
