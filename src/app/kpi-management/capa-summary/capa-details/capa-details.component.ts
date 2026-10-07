import { Component, signal, OnInit, NO_ERRORS_SCHEMA } from '@angular/core';
import { Location } from '@angular/common';
import { HqmsService } from '../../../services/hqms.service';
import { SharedModule } from '../../../shared/shared.module';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-capa-details',
  imports: [FormsModule, SharedModule],
  templateUrl: './capa-details.component.html',
  schemas: [NO_ERRORS_SCHEMA]
})
export class CapaDetailsComponent implements OnInit {
  public readOnlyCapa: any = signal({
    "action": "I", //INSERT
    "kpi_id": null,
    "kpi_code": null,
    "kpi_name": null,
    "kpi_type_name": null,
    "department_name": null,
    "frequency_name": null,
    "unit_of_measure_name": null,
    "kpi_formula": null,
    "target_benchmark": null,
    "kpi_actual_score_status": null,
    // "description": null,
    // "interpretation_learning": null,
    "capa_details" : [],
    "complaint_benchmark": null,
    "partial_complaint_benchmark": null,
    "non_complaint_benchark": null,
    "benchmark_reference": null,
    "is_active": true,
    "updated_at": null,
    "status": null,
  })
  constructor(private location: Location, public _hqms: HqmsService, ) { }

  async ngOnInit() {
    try {
      let state = history.state;
      if (state ?.data) {
        await this.editCapa(state['data']['id'])
      }
    } catch (e) {

    };
  }

  async editCapa(dcId: any) {
    try {
      let getCapaInfo: any = await this._hqms.customGetApiCall('GET', 'fnKpiCapaSummaryList',
        {
          "kpi_data_capture_id": dcId
        });
      if (getCapaInfo.status == 200) {
        let editInfo = getCapaInfo['data'];
        if (editInfo.length > 0) {
          editInfo = editInfo[0];
          this.readOnlyCapa.set({
            "action": "U",
            "kpi_id": editInfo.kpi_id,
            "kpi_code": editInfo.kpi_code,
            "kpi_name": editInfo.kpi_name,
            "kpi_type_name": editInfo.kpi_type_name,
            "department_name": editInfo.department_name,
            "frequency_name": editInfo.frequency_name,
            "unit_of_measure_name": editInfo.unit_of_measure_name,
            "kpi_formula": editInfo.kpi_formula,
            "target_benchmark": editInfo.benchmark[0]['target_benchmark'],
            "kpi_actual_score_status": editInfo.kpi_actual_score_status,
            "capa_details": editInfo.capa_details,
            "complaint_benchmark": editInfo.benchmark[0]['complaint_benchmark'],
            "partial_complaint_benchmark": editInfo.benchmark[0]['partial_complaint_benchmark'],
            "non_complaint_benchark": editInfo.benchmark[0]['non_complaint_benchark'],
            "benchmark_reference": editInfo.benchmark[0]['benchmark_reference'],
            "is_active": editInfo.is_active,
            "updated_at": editInfo.updated_at,
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

