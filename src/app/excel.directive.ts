import { Directive, inject,HostListener,Input } from '@angular/core';
import { HqmsService } from './services/hqms.service';
export interface EXCELConfig{
  param :any;
  screenName:string;
  data : any;
  methodName:string;
}
@Directive({
  selector: '[EXCEL]',
})
export class ExcelDirective {
  private hqmsSrvce = inject(HqmsService);
  @Input('EXCEL') config!:EXCELConfig;
  constructor() { }

 @HostListener('click')
 onClick(){
   if(this.config.data == 0){
      this.hqmsSrvce.hqmsToasterService({
        severity: 'warn',
        summary: this.config['screenName']||'',
        detail: 'No data found',
      });
      return;
   }
   this.config['param']["parExportTo"] = "Xlsx";
     this.config['param']["parReportHeaders"] =
     {
        "parRptScreenName":this.config['screenName']
      };
   delete this.config['param']['page_no'];
   delete this.config['param']['page_size'];
  this.hqmsSrvce.reportGetApiCall('GET',this.config['methodName'],this.config['param'],this.config['screenName']);
 }

}
