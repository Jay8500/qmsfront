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
    selector: 'app-kpi-indicators',
    imports: [NgApexchartsModule],
    templateUrl: './kpi-indicators.component.html',
    styleUrl: './kpi-indicators.component.scss'
})
export class KpiIndicatorsComponent {
  @ViewChild("chart") chart!: ChartComponent;

  public chartOptions: ChartOptions={
      series: [
            {
              name: "",
              data: []
            }
          ],
          chart: {
            height: window.innerWidth < 480 ? 160 : 320,
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
  private monthCategories = [];

  constructor() {
  }

  plotData(dataSet,seriesName:string="Suggestions"){
    try{
        let getLabels = dataSet.map((el:any)=> ( el.label ));
        let getData = dataSet.map((el:any)=> ( el.value ));
         this.chartOptions = {
          series: [
            {
              name: seriesName,
              data: getData
            }
          ],
          chart: {
            height: window.innerWidth < 480 ? 160 : 320,
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
            categories: getLabels
          },
          tooltip: {
            x: {
              formatter: (val: number) => getLabels[val] ?? ''
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
          console.log("e",e)
    };
  }

  updateSeries(dataSet){
        let getLabels = dataSet.map((el:any)=> ( el.label ));
        let getData = dataSet.map((el:any)=> ( el.value ));
        this.chart.updateSeries(getData ,true)
  }
}
