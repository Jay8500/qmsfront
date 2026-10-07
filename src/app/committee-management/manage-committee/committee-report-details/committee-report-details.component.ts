import { Component, signal, QueryList, ViewChildren, ViewChild, inject, OnInit } from '@angular/core';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { Location } from '@angular/common';
import { HqmsService } from '../../../services/hqms.service';
import { SharedModule } from '../../../shared/shared.module';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-committee-report-details',
  imports: [SharedModule],
  templateUrl: './committee-report-details.component.html',
  styleUrl: './committee-report-details.component.scss'
})
export class CommitteeReportDetailsComponent implements OnInit {
  public santizer = inject(DomSanitizer)
  public router = inject(Router);
  public crdCtrl: any = {
    meeting_id: null,
    meeting_code: null,
    committee_name: null,
    committee_type_name: null,
    chair_person_name: null,
    co_chair_person_name: null,
    co_ordinator_name: null,
    venue_name: null,
    total_attendees: null,
    meeting_name: null,
    meeting_date: null,
    meeting_period: null,
    updated_by: null,
    meeting_agenda: null,
    meeting_participants: [],
    status: null,
  };

  constructor(private location: Location, public _hqms: HqmsService, private activatedRoute: ActivatedRoute) { }

  goBack(): void {
    this.location.back();
  }

  async ngOnInit() {
    let state = history.state;
    if (state != null) {
      await this.editCommitteeRpt(state['data']['id'])
    };
  }

  async editCommitteeRpt(meetingId: any) {
    try {
      let getCommitteeRptEdit: any = await this._hqms.customGetApiCall('GET', 'fnCommitteeReportsApi',
        {
          // "action": "E",
          "meeting_id": meetingId,
        });
      if (getCommitteeRptEdit.status == 200) {
        let editInfo = getCommitteeRptEdit['data'];
        if (editInfo.length > 0) {
          editInfo = editInfo[0];
          this.crdCtrl = {
            "meeting_id": editInfo.meeting_id,
            "meeting_code": editInfo.meeting_code,
            "committee_name": editInfo.committee_name,
            "committee_type_name": editInfo.committee_type_name,
            "chair_person_name": editInfo.chair_person_name,
            "co_chair_person_name": editInfo.co_chair_person_name,
            "co_ordinator_name": editInfo.co_ordinator_name,
            "venue_name": editInfo.venue_name,
            "total_attendees": editInfo.total_attendees,
            "meeting_name": editInfo.meeting_name,
            "meeting_date": editInfo.meeting_date,
            "meeting_period": editInfo.meeting_period,
            "updated_by": editInfo.updated_by,
            "meeting_agenda": editInfo.meeting_agenda,
            "meeting_participants": editInfo.meeting_participants,
            "status": editInfo.status,
          }
        }
      };
    } catch (e) {
    };
  }
}
