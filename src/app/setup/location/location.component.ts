import { Component, Directive, EventEmitter, inject, signal, Input, Output, OnInit, QueryList, ViewChildren, ViewChild, SecurityContext } from '@angular/core';
import { DecimalPipe, CommonModule, Location } from '@angular/common';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { HqmsService } from '../../services/hqms.service';
import { Validations } from '../../validations';
import { FileUploadModule, FileUpload } from 'primeng/fileupload';
import { FilterService, SelectItemGroup } from 'primeng/api';
import { FormsModule } from '@angular/forms';
import { AutoComplete } from 'primeng/autocomplete';
interface SearchEvent {
  originalEvent: Event;
  query: string;
};
@Component({
  selector: 'app-location',
  imports: [CommonModule, SharedModule, FormsModule, FileUploadModule],
  templateUrl: './location.component.html',
})
export class LocationComponent implements OnInit {
  private validations = inject(Validations);
  public santizer = inject(DomSanitizer)
  public selectedTraining = signal(null);
  public router = inject(Router);
  @ViewChildren('logo') upCoverPage!: FileUpload;
  pageMode: string = "NEW";
  readonly FORM_NAME = 'organization';
  public errorMsg: any = {
    location_name: '',
    contact_person: '',
    email_id: '',
    office_phone: '',
    fax_number: '',
    mobile_phone: '',
    website_url: '',
    address1: '',
    address2: '',
    state_name: '',
    country_name: '',
  };
  public crncyList: any = [];
  public areaList: any = [];
  filterModules: any = [];
  accStatusList: any = [];
  public locInfo: any = {
    "action": "I",
    "loc_id": null,
    "location_name": null,
    "location_desc": null,
    "contact_person": null,
    "email_id": null,
    "office_phone": null,
    "mobile_phone": null,
    "address1": null,
    "address2": null,
    "state_name": null,
    "country_id": null,
    "country_name": null,
    "zipcode": null,
    "fax_number": null,
    "website_url": null,
    "city_id": null,
    "city_name": null,
    "state_id": null,
    "org_id": null,
    "user_id": null,
    "logo": [],
    "area_name": null,
  };
  public deforgInfo = JSON.stringify(this.locInfo);
  public uploadError1: boolean = false;
  public attachedFiles: any = [];
  constructor(private location: Location, public _hqms: HqmsService) {
    this.locInfo.org_id = this._hqms.getOrgId()
  }

  goBack(): void {
    this.router.navigateByUrl('/locationgrid')
  }

  showFilter = false;

  filterToggle() {
    this.showFilter = !this.showFilter;
  }

  onGetErrorMsgs(ctrl: any) {
    const result = this.validations.validateField(this.FORM_NAME, ctrl, this.locInfo[ctrl]);
    this.errorMsg[ctrl] = result?.message || '';
  }

  async  ngOnInit() {
    try {
      let crncyInfo: any = await this._hqms.customGetApiCall('GET', 'fnScdrpdwnApi',
        {
          "flag": "CRNCY"
        }, true);
      if (crncyInfo.status == 200) {
        this.crncyList = crncyInfo.data.map((ele: any) => ({
          label: ele.currency_name,
          value: ele.currency_id,
          currency_symbol: ele.currency_symbol,
          currency_cd: ele.currency_cd
        }))
      };

      let arInfo: any = await this._hqms.customGetApiCall('GET', 'fnScdrpdwnApi',
        {
          "flag": "AREA"
        }, true);
      if (arInfo.status == 200) {
        this.areaList = arInfo.data.map((ele: any) => ({
          label: ele.area_name,
          value: ele.area_id,
          city_id: ele.city_id,
          city_name: ele.city_name,
          country_id: ele.country_id,
          country_name: ele.country_name,
          state_id: ele.state_id,
          state_name: ele.state_name,
          zipcode: ele.zipcode
        }))
      };

      let accSts: any = await this._hqms.customGetApiCall('GET', 'commanEntityValuesGetApi',
        { "entity_codes": "ORG_ACCRD_STS" });
      if (accSts.status == 200) {
        this.accStatusList = accSts.data.entities.ORG_ACCRD_STS.values.map((ele: any) => ({
          label: ele.display_value,
          value: ele.entity_value_id
        }))
      };

      let state = history.state;
      if (state ?.data) {
        this.pageMode = state['data']['mode'];
        if (this.pageMode != 'NEW') {
          await this.getLocInfo(state['data']['id']);
        };
      }
    } catch (e) { }
  }

  async getLocInfo(id: any) {
    try {
      this.locInfo = JSON.parse(this.deforgInfo);
      let loc: any = await this._hqms.customGetApiCall('GET', 'fnLocApi', {
        loc_id: id,
        org_id: id,
      });
      if (loc.status == 200) {
        loc = loc.data[0];
        this.locInfo = {
          "action": "U",
          "loc_id": loc.loc_id,
          "org_id": loc.org_id,
          "location_name": loc.location_name,
          "location_desc": loc.location_desc,
          "contact_person": loc.contact_person,
          "email_id": loc.email_id,
          "office_phone": loc.office_phone,
          "mobile_phone": loc.mobile_phone,
          "address1": loc.address1,
          "address2": loc.address2,
          "state_name": loc.state_name,
          "country_id": loc.country_id,
          "country_name": loc.country_name,
          "zipcode": loc.zipcode,
          "fax_number": loc.fax_number,
          "website_url": loc.website_url,
          "city_id": loc.city_id,
          "city_name": loc.city_name,
          "state_id": loc.state_id,
          "user_id": loc.user_id,
          "area_name": loc.area_name,
          "logo": loc.logo
        };
      };
    } catch (e) { };
  }

  onViewClick(getImageInfo: any) {
    // getImageInfo['is_viewed'] = !getImageInfo['is_viewed'];
    // let plainUrl = this.santizer.sanitize(SecurityContext.RESOURCE_URL, getImageInfo['fileOrImageUrl'])
    // this.imgView.showImage(plainUrl, getImageInfo['file_type'], false, true);
  }

  async  onCoverPageFileSelect(thisFile: any, fileSelected: any) {
    this.uploadError1 = false;
    if (['application/pdf'].includes(fileSelected.files[0].type)) {
      this.uploadError1 = true;
      this._hqms.hqmsToasterService({
        key: 'loc',
        severity: 'warn',
        summary: 'Location',
        detail: 'Accepted Formats were .png/.jpeg',
      });
      setTimeout(() => {
        thisFile.clear();
        this.uploadError1 = false;
      }, 3000);
      return;
    }
    this.uploadError1 = false;
    this.locInfo.logo.push(
      {
        file_id: null,
        file_name: fileSelected.files[0].name,
        file_type: fileSelected.files[0].type, // "JPG"
        file_size: fileSelected.files[0].size,
        storage_path: null,
        fileSaveType: null,
        is_active: true,
        upload_file_name: fileSelected.files[0].name
      });
    this.attachedFiles.push({ "fileName": fileSelected.files[0].name, "fileContent": fileSelected.files[0] });
    thisFile.clear();
  }

  async removeCoverPageImage(doc: any, imgIndex: any) {
    let confirm = await this._hqms.showConfirmMessage(`Remove ${doc.file_name}`);
    if (confirm) {
      this.locInfo.logo = [];
      this.uploadError1 = false;
      doc.is_active = false;
      let thisFileName = doc.upload_file_name;
      let thisFileIndex: any = -1;
      this.attachedFiles.forEach((aFile: any, aIndex: number) => {
        if (aFile.fileName == thisFileName) thisFileIndex = aIndex;
      });
      if (thisFileIndex >= 0) {
        this.attachedFiles.splice(thisFileIndex, 1);
      };
      this.upCoverPage.clear();

    }
  }

  async onSubmitClick() {
    Object.keys(this.errorMsg).forEach((ctrl) => this.onGetErrorMsgs(ctrl));
    let isValid = this._hqms.showErrorSummary(this.errorMsg);
    if (isValid || this.uploadError1) {
      this._hqms.hqmsToasterService({
        key: 'loc',
        severity: 'warn',
        summary: 'Location',
        detail: 'Check the errors',
      });
      return;
    };
    let loc = JSON.parse(JSON.stringify(this.locInfo));
    if (this.pageMode == 'NEW') {
      loc['logo'] = loc['logo'].filter((fl: any) => fl.is_active == true);
    };
    let formData = new FormData();
    this.attachedFiles.forEach((file: any, index: number) => {
      formData.append("file", file.fileContent, file.fileName);
    });
    formData.append("data", JSON.stringify(loc));
    let cnfrmOrg = await this._hqms.showConfirmMessage();
    if (cnfrmOrg) {
      var saveResult: any = await this._hqms.customSaveApiCall("POST", "fnLocApi", formData);
      if (saveResult.status == 200) {
        this._hqms.hqmsToasterService({
          severity: 'success',
          summary: 'Location',
          detail: saveResult.message,
        });
        await this.ngOnInit();
      } else if (saveResult.status == 204 || saveResult.status == 501) {
        this._hqms.hqmsToasterService({
          severity: 'warn',
          summary: 'Location',
          detail: saveResult.message,
        });
      }
    };
  }

  onClearClick() {
    this.uploadError1 = false;
    this.locInfo = JSON.parse(this.deforgInfo)
    Object.keys(this.errorMsg).forEach((key) => (this.errorMsg[key] = ''));
  }

  filterGroupedModules(event: SearchEvent) {
    try {
      let query: any = event.query.toLowerCase();
      let filtered: any = [];
      if (this.areaList.length == 0) {
        return;
      };
      for (let optGrp of this.areaList) {
        let parentMatches = optGrp.label.toLowerCase().includes(query);
        if (parentMatches) {
          filtered.push({
            label: optGrp.label,
            value: optGrp.value,
            city_id: optGrp.city_id,
            city_name: optGrp.city_name,
            country_id: optGrp.country_id,
            country_name: optGrp.country_name,
            state_id: optGrp.state_id,
            state_name: optGrp.state_name,
            zipcode: optGrp.zipcode,
          });
        };
      };
      this.filterModules = filtered;
    } catch (e) { };
  }

  onAreaSelect(event: any) {
    try {
      if (event) {
        let getValues = event['value'];
        this.locInfo.city_name = getValues['city_name'];
        this.locInfo.state_name = getValues['state_name'];
        this.locInfo.country_name = getValues['country_name'];
        this.locInfo.city_id = getValues['city_id'];
        this.locInfo.state_id = getValues['state_id'];
        this.locInfo.country_id = getValues['country_id'];
        this.locInfo.zipcode = getValues['zipcode'];
        this.locInfo.area_name = getValues['label'];
      }
    } catch (e) { }
  }
}


