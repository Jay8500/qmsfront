import {
  Component,
  signal,
  QueryList,
  ViewChildren,
  inject,
  OnInit,
  ViewChild,
} from "@angular/core";
import { Router, ActivatedRoute, ParamMap } from "@angular/router";
import { Location, CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { SelectModule } from "primeng/select";
import { HqmsService } from "../../../services/hqms.service";
import { Validations } from "../../../validations";
import { SharedModule } from "../../../shared/shared.module";

@Component({
  selector: "app-kpi-master-add",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SelectModule,
    SharedModule,
  ],
  templateUrl: "./kpi-master-add.component.html",
})
export class KpiMasterAddComponent implements OnInit {
  private validations = inject(Validations);
  readonly FORM_NAME = "KpiMasterForm";
  public router = inject(Router);
  public pageMode = "NEW";
  public errorMsg: any = {
    kpi_name: "", kpi_category_id: "", department_id: "", kpi_type_id: "",
    frequency_id: "", unit_of_measure_id: "", numerator_label: "", denominator_label: "",
    kpi_formula: "", target_benchmark: "", complaint_benchmark: "",
    partial_complaint_benchmark: "", non_complaint_benchark: "",
    kpi_definition: "", exclusion_criteria: "",
  };
  public kpiCategoryList: any = [];
  public departmentList: any = [];
  public kpiTypeList: any = [];
  public unitofMeasureList: any = [];
  public monitoringFrequencyList: any = [];
  // public deviationReasonsList: any = [];
  public fieldTypeList: any = [
    {
      label: "Text",
      value: "1",
    },
    {
      label: "Date",
      value: "2",
    },
    {
      label: "Dropdown",
      value: "3",
    },
  ];
  public kpiMastrAdd: any = JSON.stringify({
    action: "I",
    kpi_id: null,
    kpi_name: null,
    numerator_label: null,
    denominator_label: null,
    kpi_category_id: null,
    kpi_type_id: null,
    kpi_definition: null,
    exclusion_criteria: null,
    unit_of_measure_id: null,
    kpi_formula: null,
    frequency_id: null,
    department_id: null,
    // Benchmark ---
    benchmark: [
      {
        kpi_benchmark_id: null,
        target_benchmark: null,
        complaint_benchmark: null,
        partial_complaint_benchmark: null,
        non_complaint_benchark: null,
        // "deviation_id": [],
      },
    ],
    qr_barcode_track: true,
    evidence_mandatory: true,
    is_active: true,
    custom_fields: [
      {
        index: 0,
        kpi_custom_field_id: null,
        field_name: null,
        field_value: null,
        options_json: [],
        is_active: true,
      },
    ],
  });
  public createKpiMaster: any = signal<any>({
    ...JSON.parse(this.kpiMastrAdd),
  });

  onGetErrorMsgs(ctrl: any, item?: any) {
    if (item) {
      const result = this.validations.validateField(this.FORM_NAME, ctrl, item[ctrl]);
      item[ctrl + "_error"] = result?.message || "";
    } else {
      const result = this.validations.validateField(this.FORM_NAME, ctrl, this.createKpiMaster()[ctrl]);
      this.errorMsg[ctrl] = result?.message || "";
    }
  }

  onGetBenchmarkErrorMsgs(ctrl: string, comparedTo?: string) {
    const compared = comparedTo ? () => this.createKpiMaster().benchmark[0][comparedTo] : undefined;
    const result = this.validations.validateField(this.FORM_NAME, ctrl, this.createKpiMaster().benchmark[0][ctrl], compared);
    this.errorMsg[ctrl] = result?.message || "";
  }

  constructor(
    private location: Location,
    public _hqms: HqmsService,
    private activatedRoute: ActivatedRoute,
  ) {}

  async ngOnInit() {
    try {
      //kpi category
      // let getkpiCategory: any = await this._hqms.customGetApiCall('GET', 'fnKpiCategoryApi', {});
      // if (getkpiCategory.status == 200) {
      //   this.kpiCategoryList = getkpiCategory.data.map((ele: any) => ({
      //     label: ele.category_name,
      //     value: ele.category_id
      //   }))
      // };

      //Department
      let getDepartmentType: any = await this._hqms.customGetApiCall(
        "GET",
        "fnTemplateListGet",
        {
          flag: "DEPARTMENT",
        },
        true,
      );
      if (getDepartmentType.status == 200) {
        this.departmentList = getDepartmentType.data.map((ele: any) => ({
          label: ele.department_name,
          value: ele.department_id,
        }));
      }

      //All Entity Dropdowns
      let info: any = await this._hqms.customGetApiCall(
        "GET",
        "commanEntityValuesGetApi",
        {
          entity_codes:
            "KPITYPE | DEVIATIONS |UNITOFMEASURE| MONITORINGFREQUENCY | KPICATEGORY",
        },
        true,
      );
      if (info.status == 200) {
        this.kpiTypeList = info.data["entities"]["KPITYPE"]["values"].map(
          (ele: any) => ({
            label: ele.display_value,
            value: ele.entity_value_id,
          }),
        );
        // this.deviationReasonsList = info.data['entities']['DEVIATIONS']['values'].map((ele: any) => ({
        //   label: ele.display_value,
        //   value: ele.entity_value_id,
        // }));
        this.unitofMeasureList = info.data["entities"]["UNITOFMEASURE"][
          "values"
        ].map((ele: any) => ({
          label: ele.display_value,
          value: ele.entity_value_id,
        }));
        this.monitoringFrequencyList = info.data["entities"][
          "MONITORINGFREQUENCY"
        ]["values"].map((ele: any) => ({
          label: ele.display_value,
          value: ele.entity_value_id,
        }));
        this.kpiCategoryList = info.data["entities"]["KPICATEGORY"][
          "values"
        ].map((ele: any) => ({
          label: ele.display_value,
          value: ele.entity_value_id,
        }));
      }
      let state = history.state;
      this.pageMode = state["data"]["mode"];
      if (this.pageMode != "NEW") {
        await this.editKPIMstr(state["data"]["id"]);
      }
    } catch (e) {}
  }

  async editKPIMstr(kpiId: any) {
    try {
      let getKpiMastrEdit: any = await this._hqms.customGetApiCall(
        "GET",
        "fnKpiMstrApi",
        {
          action: "U",
          kpi_id: kpiId,
        },
      );
      if (getKpiMastrEdit.status == 200) {
        let editInfo = getKpiMastrEdit["data"];
        if (editInfo.length > 0) {
          editInfo = editInfo[0];
          this.createKpiMaster.set({
            action: "U", //INSERT
            kpi_id: editInfo.kpi_id,
            kpi_name: editInfo.kpi_name,
            numerator_label: editInfo.numerator_label,
            denominator_label: editInfo.denominator_label,
            kpi_category_id: editInfo.kpi_category_id,
            kpi_type_id: editInfo.kpi_type_id,
            unit_of_measure_id: editInfo.unit_of_measure_id,
            frequency_id: editInfo.frequency_id,
            department_id: editInfo.department_id,
            kpi_definition: editInfo.kpi_definition,
            exclusion_criteria: editInfo.exclusion_criteria,
            kpi_formula: editInfo.kpi_formula,
            // Benchmark ---
            benchmark: [
              {
                kpi_benchmark_id: editInfo["benchmark"][0].kpi_benchmark_id,
                target_benchmark: editInfo["benchmark"][0].target_benchmark,
                complaint_benchmark:
                  editInfo["benchmark"][0].complaint_benchmark,
                partial_complaint_benchmark:
                  editInfo["benchmark"][0].partial_complaint_benchmark,
                non_complaint_benchark:
                  editInfo["benchmark"][0].non_complaint_benchark,
                // "deviation_id": editInfo['benchmark'][0].deviation_id,
              },
            ],
            //---
            qr_barcode_track: editInfo.qr_barcode_track, //toggle
            evidence_mandatory: editInfo.evidence_mandatory, //toggle
            is_active: editInfo.is_active, //toggle
            custom_fields: editInfo.custom_fields,
          });
        }
      }
    } catch (e) {}
  }

  isLastActiveVisible(currentIndex: number): boolean {
    let activeConfigs = this.createKpiMaster().custom_fields.filter(
      (c: any) => c.is_active,
    );
    let lastActiveItem = activeConfigs[activeConfigs.length - 1];
    let canAddmore = activeConfigs.length > 0;
    return canAddmore;
  }

  onAddField(cstmFld: any) {
    let nxtCstmFlds: any = JSON.parse(JSON.stringify(cstmFld));
    nxtCstmFlds["index"] = nxtCstmFlds.index + 1;
    nxtCstmFlds["kpi_custom_field_id"] = null;
    nxtCstmFlds["field_name"] = null;
    nxtCstmFlds["field_value"] = null;
    nxtCstmFlds["options_json"] = [];
    nxtCstmFlds["is_active"] = true;
    this.createKpiMaster().custom_fields.push(nxtCstmFlds);
  }

  onDeleteField(dosePrp: any, index: number) {
    if (index > 0) {
      dosePrp.is_active = false;
    }
  }

  async onSubmitClick() {
    Object.keys(this.errorMsg).forEach((ctrl) => {
      if (["target_benchmark", "complaint_benchmark", "partial_complaint_benchmark", "non_complaint_benchark"].includes(ctrl)) {
        this.onGetBenchmarkErrorMsgs(ctrl);
      } else {
        this.onGetErrorMsgs(ctrl);
      }
    });
    this.createKpiMaster().custom_fields.forEach((cf: any) => {
      if (cf.is_active) {
        this.onGetErrorMsgs("field_name", cf);
        this.onGetErrorMsgs("field_value", cf);
      }
    });
    let isValid = this._hqms.showErrorSummary(this.errorMsg);
    if (isValid) {
      this._hqms.hqmsToasterService({
        key: "kpiMaster",
        severity: "warn",
        summary: "KPI Master",
        detail: "Check the errors",
      });
      return;
    }
    let getKpiInfo = JSON.parse(JSON.stringify(this.createKpiMaster()));
    if (this.pageMode == "NEW") {
      getKpiInfo["custom_fields"] = getKpiInfo["custom_fields"].filter(
        (cf) => cf.is_active == true,
      );
    }
    getKpiInfo["custom_fields"].forEach((cf) => {
      cf.options_json = [1, 2].includes(cf.field_value)
        ? null
        : cf.options_json;
      delete cf.index;
    });

    let confirmKpi = await this._hqms.showConfirmMessage();
    if (confirmKpi) {
      var saveResult: any = await this._hqms.customSaveApiCall(
        "POST",
        "fnKpiMstrApi",
        getKpiInfo,
      );
      if (saveResult.status == 200) {
        this._hqms.hqmsToasterService({
          key: "kpi",
          severity: "success",
          summary: "KPI Master",
          detail: saveResult.message,
        });
        this.onClearClick();
        this.router.navigateByUrl("/kpi-master-dashboard");
      } else if (saveResult.status == 204 || saveResult.status == 501) {
        this._hqms.hqmsToasterService({
          key: "kpi",
          severity: "warn",
          summary: "KPI Master",
          detail: saveResult.message,
        });
      }
    }
  }

  onClearClick() {
    this.createKpiMaster.set({ ...JSON.parse(this.kpiMastrAdd) });
    Object.keys(this.errorMsg).forEach((key) => (this.errorMsg[key] = ""));
  }

  goBack(): void {
    this.router.navigateByUrl("/kpi-master-dashboard");
  }
}
