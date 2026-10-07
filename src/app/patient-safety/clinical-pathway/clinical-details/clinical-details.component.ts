import { Component, OnInit, inject } from '@angular/core';
import { Location, CommonModule } from '@angular/common';
import { HqmsService } from '../../../services/hqms.service';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-clinical-details',
  templateUrl: './clinical-details.component.html',
  imports: [CommonModule],
  styleUrl: './clinical-details.component.scss'
})
export class ClinicalDetailsComponent implements OnInit {
  public router = inject(Router);
  public createCPAudits = {
    patient_name: null,
    status: null,
    cp_type_name: null,
    doa_name: null,
    dos_name: null,
    dod_name: null,
    consultant_name: null,
    sections: [],
    compliance: null,
    displayCol: null,
    discharge_form: [],
    capa_details: []
  }
  constructor(private location: Location, public _hqms: HqmsService, private activatedRoute: ActivatedRoute,public _datePipe: DatePipe) { }

  goBack(): void {
    this.router.navigateByUrl('/clinical-dashboard');
  }

  async ngOnInit() {
    let state = history.state;
    await this.readOnlyData(state['data']['id'])
  }

  async readOnlyData(cpAdtId: any) {
    try {
      let info: any = await this._hqms.customGetApiCall('GET', 'fnCpAuditApi',
        {
          "cp_audit_id": cpAdtId,
        });
      if (info.status == 200) {
        let editInfo: any = info['data'][0];
        this.createCPAudits["patient_name"] = editInfo.patient_name;
        this.createCPAudits["status"] = editInfo.status;
        this.createCPAudits["cp_type_name"] = editInfo.cp_type_name;
        this.createCPAudits["doa_name"] = editInfo.doa_name;
        this.createCPAudits["dos_name"] = editInfo.dos_name;
        this.createCPAudits["dod_name"] = editInfo.dod_name;
        this.createCPAudits["consultant_name"] = editInfo.consultant_name;
        this.createCPAudits["compliance"] = editInfo.compliance;
        this.createCPAudits["displayCol"] = editInfo.compliance;
        this.createCPAudits["discharge_form"] = editInfo.discharge_form;
        this.createCPAudits["capa_details"] = editInfo.capa_details;
        this.createCPAudits["sections"] = editInfo.sections.map((sc) => ({ ...sc,
           questions: sc.questions.map((qs) => ({ ...qs, answer_text: (qs.answer_text||'').toUpperCase() })) }));
      };
    } catch (e) {
    };
  }

  getComplianceClass(compliance: any): any {
    if (compliance > 0) {
      if (compliance < 45) {
        return 'text-danger';   // red
      } else if (compliance >= 45 && compliance < 75) {
        return 'text-warning';  // orange
      } else {
        return 'text-success';  // green
      }
    }
  }
}
