import { Component, Directive, EventEmitter,inject, signal,Input, Output,OnInit, QueryList, ViewChildren,ViewChild, SecurityContext } from '@angular/core';
import { DecimalPipe,CommonModule ,Location} from '@angular/common';
import { Router ,ActivatedRoute, ParamMap  } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { ImageViewerComponent } from '../../components/imageviewer/imageviewer.component';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { HqmsService } from '../../services/hqms.service';
import { Validations } from '../../validations';
import { FileUploadModule, FileUpload } from 'primeng/fileupload';
import { FilterService, SelectItemGroup } from 'primeng/api';
import { FormsModule } from '@angular/forms';
interface SearchEvent{
     originalEvent : Event;
     query : string;
};
@Component({
  selector: 'app-organization',
  imports: [ CommonModule,SharedModule,FormsModule ,FileUploadModule],
  templateUrl: './organization.component.html',
  styleUrl: './organization.component.scss',
})
export class OrganizationComponent implements OnInit {
    private validations = inject(Validations);
    public santizer = inject(DomSanitizer)
    public selectedTraining = signal(null);
    public router = inject(Router);
    @ViewChildren('logo') upCoverPage!: FileUpload;
    pageMode:string="NEW";
    readonly FORM_NAME = 'organization';
    public errorMsg: any = {
      org_name: '', display_name: '', no_of_locations: '', org_desc: '', contact_person: '',
      about_us: '', company_url: '', privacy_policy_url: '', terms_of_usage_url: '', copy_right: '',
      org_key: '', default_currency_id: '', email_id: '', office_phone: '', fax_number: '',
      mobile_phone: '', website_url: '', address1: '', address2: '', state_name: '', country_name: '',
      accreditation_no: '', accreditation_body: '', accreditation_for: '', valid_start_dt: '',
      valid_end_dt: '', accr_status_id: '',
    };
    public crncyList:any=[];
    public areaList:any=[];
    filterModules :any= [];
    accStatusList :any= [];
    public orgInfo:any={
        "action": "I",
        "org_id":null,
        "org_name": null,
        "org_desc": null,
        "about_us" : null,
        "terms_of_usage_url" : null,
        "default_currency_id": null,
        "display_name": null,
        "contact_person": null,
        "company_url": null,
        "logo" : [],
        "copy_right": null,
        "no_of_locations": "0",
        "privacy_policy_url" : null,
        "org_key": null,
        "is_registered": null,
        "is_listed": null,
        "default_acct_id": null,
        "corp_pkg_all": null,
        "email_id": null,
        "area_id": null,
        "area_name": null,
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
        "accreditation_no": null,
        "accreditation_body": null,
        "accreditation_for": null,
        "accr_status_id": null,
        "valid_start_dt": null,
        "valid_end_dt": null,
        "city_id": null,
        "city_name": null,
        "state_id": null,
      };
    public deforgInfo =  JSON.stringify(this.orgInfo);
    public uploadError1:boolean=false;
    public attachedFiles:any=[];
    constructor(private location: Location,  public _hqms: HqmsService) {}

    goBack(): void {
          this.router.navigateByUrl('/organizationgrid')
    }

    showFilter = false;

    filterToggle() {
      this.showFilter = !this.showFilter;
    }

    onGetErrorMsgs(ctrl: any) {
      const result = this.validations.validateField(this.FORM_NAME, ctrl, this.orgInfo[ctrl]);
      this.errorMsg[ctrl] = result?.message || '';
    }

    onValidStartDtChange() {
      this.orgInfo.valid_end_dt = null;
      this.onGetErrorMsgs('valid_start_dt');
    }

  async  ngOnInit(){
     try{
      let crncyInfo: any = await this._hqms.customGetApiCall('GET', 'fnScdrpdwnApi',
        {
          "flag":  "CRNCY"
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
          "flag":  "AREA"
        }, true);
       if(arInfo.status == 200) {
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
      { "entity_codes":"ORG_ACCRD_STS" });
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
         await this.getOrgInfo(state['data']['id']);
      };
    }
     }catch(e){}
  }

  async getOrgInfo(id:any){
    try{
      this.orgInfo = JSON.parse(this.deforgInfo);
      let org: any = await this._hqms.customGetApiCall('GET', 'fnOrgApi',{
        org_id : id
      });
       if (org.status == 200) {
          org = org.data[0];
          this.orgInfo={
            "action": "U",
            "org_id":org.org_id,
            "org_name": org.org_name,
            "org_desc": org.org_desc,
            "about_us" : org.about_us,
            "terms_of_usage_url" : org.terms_of_usage_url,
            "default_currency_id": org.default_currency_id,
            "display_name": org.display_name,
            "contact_person": org.contact_person,
            "company_url": org.company_url,
            "logo" : org.logo,
            "copy_right": org.copy_right,
            "no_of_locations": org.no_of_locations,
            "privacy_policy_url" : org.privacy_policy_url,
            "org_key": org.org_key,
            "is_registered": org.is_registered,
            "is_listed": org.is_listed,
            "default_acct_id": org.default_acct_id,
            "corp_pkg_all": org.corp_pkg_all,
            "email_id": org.email_id,
            "area_id": org.area_id,
            "area_name": org.area_name,
            "office_phone": org.office_phone,
            "mobile_phone": org.mobile_phone,
            "address1": org.address1,
            "address2": org.address2,
            "state_name": org.state_name,
            "country_id": org.country_id,
            "country_name": org.country_name,
            "zipcode": org.zipcode,
            "fax_number": org.fax_number,
            "website_url": org.website_url,
            "accreditation_no": org.accreditation_no,
            "accreditation_body": org.accreditation_body,
            "accreditation_for": org.accreditation_for,
            "accr_status_id": org.accr_status_id,
            "valid_start_dt": org.valid_start_dt,
            "valid_end_dt": org.valid_end_dt,
            "city_id": org.city_id,
            "city_name": org.city_name,
            "state_id": org.state_id,
         };
       };
    }catch(e){};
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
        key: 'org',
        severity: 'warn',
        summary: 'Organization',
        detail: 'Accepted Formats were .png/.jpeg',
      });
      setTimeout(() => {
        thisFile.clear();
        this.uploadError1 = false;
      }, 3000);
      return;
    }
    this.uploadError1 = false;
    this.orgInfo.logo.push(
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
       this.orgInfo.logo = [];
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
        key: 'org',
        severity: 'warn',
        summary: 'Organization',
        detail: 'Check the errors',
      });
      return;
    };
    let org = JSON.parse(JSON.stringify(this.orgInfo));
    if (this.pageMode == 'NEW') {
      org['logo'] = org['logo'].filter((fl: any) => fl.is_active == true);
    };
     let formData = new FormData();
    this.attachedFiles.forEach((file: any, index: number) => {
      formData.append("file", file.fileContent, file.fileName);
    });
    formData.append("data", JSON.stringify(org));
    let cnfrmOrg = await this._hqms.showConfirmMessage();
    if (cnfrmOrg) {
      var saveResult: any = await this._hqms.customSaveApiCall("POST", "fnOrgApi", formData);
      if (saveResult.status == 200) {
        this._hqms.hqmsToasterService({
          severity: 'success',
          summary: 'Organization',
          detail: saveResult.message,
        });
        this.onClearClick();
        this.router.navigateByUrl('/organizationgrid');
      } else if (saveResult.status == 204 || saveResult.status == 501) {
        this._hqms.hqmsToasterService({
          severity: 'warn',
          summary: 'Organization',
          detail: saveResult.message,
        });
      }
    };
  }

  onClearClick() {
    this.uploadError1 = false;
    this.orgInfo = JSON.parse(this.deforgInfo)
    Object.keys(this.errorMsg).forEach((key) => (this.errorMsg[key] = ''));
  }

  filterGroupedModules(event:SearchEvent){
    try{
    let query :any= event.query.toLowerCase();
    let filtered :any= [];
    if(this.areaList.length == 0) {
      return;
    };
   for(let optGrp of this.areaList){
      let parentMatches = optGrp.label.toLowerCase().includes(query);
      if(parentMatches){
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
   this.filterModules  = filtered;
  }catch(e){};
  }

  onAreaSelect(event:any){
    try{
    if(event){
      let getValues =  event['value'];
      this.orgInfo.city_name = getValues['city_name'];
      this.orgInfo.state_name =getValues['state_name'];
      this.orgInfo.country_name = getValues['country_name'];
      this.orgInfo.city_id = getValues['city_id'];
      this.orgInfo.state_id = getValues['state_id'];
      this.orgInfo.country_id = getValues['country_id'];
      this.orgInfo.zipcode = getValues['zipcode'];
      this.orgInfo.area_name = getValues['label'];
    }
    }catch(e){}
  }
}


