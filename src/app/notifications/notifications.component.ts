
import { Component ,OnInit} from '@angular/core';
import { RouterLink } from '@angular/router';
import {DatePipe,CommonModule} from '@angular/common';
import { HqmsService } from '../services/hqms.service';
@Component({
    selector: 'app-notifications',
    templateUrl: './notifications.component.html',
    styleUrl: './notifications.component.scss',
     imports: [CommonModule],
})
export class NotificationsComponent implements OnInit{
  // Filter Dropdown
    constructor(private _hqms: HqmsService,  public _datePipe : DatePipe) { }

  selectedRange: string = 'Last 7 days';
  public date_range:any = null;
  async setRange(value: string) {
    let getSrvrDt:any = await this._hqms.getServerDate('DATE');
     let today:any = new Date(getSrvrDt) ;
     let endDateToday:any = new Date();
     let prev7Day :any= null;
     this.date_range = null;
     this.selectedRange = value;
    switch (value) {
      case 'Last 7 days':
         prev7Day = new Date(today.setDate(today.getDate() - 7));
         this.date_range = `${this._datePipe.transform(prev7Day, "dd-MMM-yyyy")} - ${this._datePipe.transform(endDateToday, "dd-MMM-yyyy")}`;
        break;
      case 'Last 30 days':
         prev7Day = new Date(today.setDate(today.getDate() - 30));
         this.date_range = `${this._datePipe.transform(prev7Day, "dd-MMM-yyyy")} - ${this._datePipe.transform(endDateToday, "dd-MMM-yyyy")}`;
        break;
      case 'Last Month':
         let firstDayLastMonth = new Date(today.getFullYear(),today.getMonth()-1,1);
         let lastDayLastMonth =  new Date(today.getFullYear(),today.getMonth(),0);
         this.date_range = `${this._datePipe.transform(firstDayLastMonth, "dd-MMM-yyyy")} - ${this._datePipe.transform(lastDayLastMonth, "dd-MMM-yyyy")}`;
        break;
      case 'Last 6 Months':
         prev7Day = new Date(today.setDate(today.getDate() - 180));
         this.date_range = `${this._datePipe.transform(prev7Day, "dd-MMM-yyyy")} - ${this._datePipe.transform(endDateToday, "dd-MMM-yyyy")}`;
        break;
      case 'Last Year':
        prev7Day = new Date(today.setDate(today.getDate() - 365));
         this.date_range = `${this._datePipe.transform(prev7Day, "dd-MMM-yyyy")} - ${this._datePipe.transform(endDateToday, "dd-MMM-yyyy")}`;
        break;
    };
    await this.onClickGetNtfcns()
  }

  public ntfctnsInfo:any = [];

  async ngOnInit(){
   try{
      await this.setRange(this.selectedRange);
   }catch(e){};
  }

  async onClickGetNtfcns(){
   try{
      let fromDt  = null;
      let toDate = null;
      if(this.date_range != null){
        let dates = this.date_range.split(" - ");
         fromDt = dates[0];
         toDate = (dates.length > 1 ? dates[1] : dates[0]);
      };
    let ntfcnInfo: any = await this._hqms.customGetApiCall('GET', 'fnNtfcnList', {from_dt : fromDt, to_dt :toDate  });
    if (ntfcnInfo.status == 200) {
      this.ntfctnsInfo =ntfcnInfo['data'].map((ele:any)=>  ({ ...ele,
         scheduleddt :  ele.scheduleddt != null ?  `${ele.scheduleddt} at ${ele.scheduled_time}`:null,
          isMsgRead :false
       }))
    };
   }catch(e){};
  }

  async onDeleteNtfcn(ntfcn:any){
    try{
      let ntfcnInfo: any = await this._hqms.customSaveApiCall("POST", "fnNtfcnList", { notification_id : ntfcn['notification_id']  });
       if (ntfcnInfo.status == 200) {
        ntfcn.isMsgRead = true;
        await this.setRange(this.selectedRange);
       };
    }catch(e){
        console.log("e e ",e)
    };
  }
}
