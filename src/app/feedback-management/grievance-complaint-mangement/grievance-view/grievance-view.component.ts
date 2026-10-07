import { Component, signal, OnInit, inject } from '@angular/core';
import { Location } from '@angular/common';
import { HqmsService } from '../../../services/hqms.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-grievance-view',
  templateUrl: './grievance-view.component.html',
  styleUrl: './grievance-view.component.scss'
})
export class GrievanceViewComponent implements OnInit {
  public santizer = inject(DomSanitizer)
  public readOnlyGrievance: any = signal({
    "action": "I",
    "complaint_id": null,
    "mou_no": null,

    "mou_files": [],
    "is_active": true,
    "status": null,
  })

  constructor(private location: Location, public _hqms: HqmsService, ) { }

  async ngOnInit() {
    try {
      let state = history.state;
      if (state ?.data) {
        await this.editGrievance(state['data']['id'])
      };
    } catch (e) { }
  }

  async editGrievance(complaintId: any) {
    try {
      let getGrievanceListEdit: any = await this._hqms.customGetApiCall('GET', 'fnComplaintApi',
        {
          "action": "U",
          "complaint_id": complaintId,
        });
      if (getGrievanceListEdit.status == 200) {
        let editInfo = getGrievanceListEdit['data'];
        if (editInfo.length > 0) {
          editInfo = editInfo[0];
          this.readOnlyGrievance.set({
            "action": "U",
            "complaint_id": editInfo.complaint_id,
            "mou_no": editInfo.mou_no,
           
            "mou_files": editInfo['mou_files'].length > 0 ? editInfo['mou_files'].map((ele) => ({
              ...ele,
              fileOrImageUrl: ele.fileOrImageUrl != null ? this.santizer.bypassSecurityTrustResourceUrl(ele.fileOrImageUrl) : null
            })) : [],
            "is_active": editInfo.is_active,
            "status": editInfo.status,
          });
        };
      };
    } catch (e) {
    };
  }

  goBack(): void {
    this.location.back();
  }
}
