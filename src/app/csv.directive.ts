import { Directive, inject,HostListener,Input } from '@angular/core';
import { HqmsService } from './services/hqms.service';
export interface CSVConfig{
  data :any[];
  fileName?:string;
    columPlacement:any[];
  ignoreCols?:string[];
}
@Directive({
  selector: '[DCSV]',
  standalone:true
})
export class CsvDirective {
 private hqmsSrvce = inject(HqmsService);
  @Input('DCSV') config!:any;

  constructor() { }

 @HostListener('click')
 onClick(){
   try{
    if(this.config.data==0){
       this.hqmsSrvce.hqmsToasterService({
         key : 'test',
        severity: 'warn',
        summary: this.config['screenName']||'',
        detail: 'No data found',
      });
      return;
   }
   this.config['param']["parExportTo"] = "Csv";
     this.config['param']["parReportHeaders"] =
     {
        "parRptScreenName":this.config['screenName']
        }
   delete this.config['param']['page_no'];
   delete this.config['param']['page_size'];
  this.hqmsSrvce.reportGetApiCall('GET',this.config['methodName'],
  this.config['param'],
  this.config['screenName']);
 }catch(e){
 }
 }

}
