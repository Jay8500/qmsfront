import { Component, signal, QueryList, ViewChildren, inject, OnInit, ViewChild, computed } from '@angular/core';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { Location } from '@angular/common';
import { HqmsService } from '../../../services/hqms.service';
@Component({
    selector: 'app-prom-details',
    standalone:true,
    templateUrl: './prom-details.component.html',
    styleUrl: './prom-details.component.scss'
})
export class PromDetailsComponent  implements OnInit{
    public router = inject(Router);

    constructor(
    public _hqms: HqmsService,
    private activatedRoute: ActivatedRoute
  ) { }
  public ccMaster:any = {};

  goBack(): void {
    this.router.navigateByUrl('/prom-dashboard');
  }

  async ngOnInit() {
    try {
      let state = history.state;
      await this.careContinuityGet(state['data']['id']);
    } catch (e) { };
  }

  async careContinuityGet(promIf) {
    try{
      let info: any = await this._hqms.customGetApiCall('GET', 'fnPromApi',
      { "prom_feedback_id": promIf });
      if (info.status == 200) {
        console.log("info.data[0] ",info.data[0])
        this.ccMaster = {...info.data[0]}
      }
    }catch(e){};
  }


}
