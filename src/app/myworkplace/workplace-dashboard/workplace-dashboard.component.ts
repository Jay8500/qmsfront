import { Component, OnInit,inject } from '@angular/core';
import { WorkplaceCalendarComponent } from '../../components/workplace-calendar/workplace-calendar.component';
import { HqmsService } from '../../services/hqms.service';
import { RouterLink, RouterOutlet, Router, ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-workplace-dashboard',
    imports: [ WorkplaceCalendarComponent],
    templateUrl: './workplace-dashboard.component.html',
    styleUrl: './workplace-dashboard.component.scss'
})
export class WorkplaceDashboardComponent implements OnInit{
    public router = inject(Router);
    public _RmtInfo :any = [];
    public _AmtInfo :any = [];
    public _MtInfo :any = [];

    constructor( public _hqms: HqmsService){};

    async ngOnInit() {
        try{
          await this.getRmtInfo();
          await this.getAmtInfo();
          await this.getMtInfo();
        }catch(e){};
    }

    async getRmtInfo(){
        this._RmtInfo = [];
       try{
            let info: any = await this._hqms.customGetApiCall('GET', 'fnMywWorkspaceApi', { flag : 'RMT' });
            if (info.status == 200) {
                this._RmtInfo = info.data;
            }
       }catch(e){ this._RmtInfo = [];};
    }

    async getAmtInfo(){
        this._AmtInfo = [];
       try{
            let info: any = await this._hqms.customGetApiCall('GET', 'fnMywWorkspaceApi', { flag : 'AMT'});
            if (info.status == 200) {
                this._AmtInfo = info.data;
            }
       }catch(e){this._AmtInfo = [];};
    }

    async getMtInfo(){
        this._MtInfo = [];
       try{
            let info: any = await this._hqms.customGetApiCall('GET', 'fnMywWorkspaceApi', {flag : 'MT' });
            if (info.status == 200) {
                this._MtInfo = info.data;
            }
       }catch(e){this._MtInfo = [];};
    }
}
