import { Component, ViewChild, ElementRef,OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { HqmsService } from '../../services/hqms.service';
import { CommonModule, } from '@angular/common';

@Component({
    selector: 'app-settings',
    imports: [RouterLink,CommonModule,SharedModule],
    templateUrl: './settings.component.html',
    styleUrl: './settings.component.scss'
})
export class SettingsComponent implements OnInit{
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  public stngsInfo:any = {
      is_audit_remainders : false,
      is_new_assignments : false,
      is_overdue_tasks : false,
      theme : null,
  };
  // Toggle states for notification preferences
  auditReminders = false;
  overdueTasks = false;
  newAssignments = false;

  // Logo upload properties
  uploadedLogo: string | null = null;
  uploadedFileName: string = '';
  isUploading = false;
  public isChngPwdVisible: boolean = false;
  public isClosabled: boolean = false;
  public changePwd: any = {
    current_pwd: null,
    new_pwd: null,
    cnfrm_pwd: null,
  };
  public passwordPolicies: any = [];
  public strengthMessage: any = '';
  public strengthClasss: any = '';
  public strengthColor = 'red';
  public strengthPercentage = 0;
  public rules: any = [];
  public errorText: string = '';
  public cnfrmErrorText: string = '';
  constructor(public _hqms: HqmsService) {
    // Load existing logo if available
  }

  async ngOnInit(){
   try{
    let info: any = await this._hqms.customGetApiCall('GET','fnSettingsApi',{ });
    if (info.status == 200) {
      this.stngsInfo = {...info.data[0]};
    };
   }catch(e){
   };
  }


  /**
   * Navigate to settings section
   */
  navigateTo(route: string) {
    // Handle navigation to different settings sections
    console.log('Navigating to:', route);
  }

  /**
   * Trigger file input click
   */
  triggerFileInput() {
    this.fileInput.nativeElement.click();
  }

  /**
   * Handle file selection
   */
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      // Validate file type
      if (!file.type.match('image.*')) {
        alert('Please select a valid image file');
        return;
      }

      this.uploadedFileName = file.name;
      this.isUploading = true;

      // this.brandingService.uploadLogo(file)
      //   .then((base64) => {
      //     this.uploadedLogo = base64;
      //     this.isUploading = false;
      //   })
      //   .catch((error) => {
      //     console.error('Error uploading logo:', error);
      //     alert('Error uploading logo. Please try again.');
      //     this.isUploading = false;
      //   });
    }
  }

  /**
   * Remove uploaded logo
   */
  removeLogo() {
    this.uploadedLogo = null;
    this.uploadedFileName = '';
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  /**
   * Clear form
   */
  clearForm() {
    this.removeLogo();
  }

  /**
   * Submit logo
   */
  submitLogo() {
    if (this.uploadedLogo) {
      // Logo is already saved in service, just close modal
      const modalElement = document.getElementById('uploadLogoModal');
      if (modalElement) {
        const modal = (window as any).bootstrap?.Modal?.getInstance(modalElement);
        if (modal) {
          modal.hide();
        }
      }
    }
  }

  async  onOpenCPclick() {
    this.isChngPwdVisible = true;
    await this.getPasswordRules();
  }

  onCloseCP() {
    this.isChngPwdVisible = false;
    this.rules = [];

  }

  onPwdClear(){
    this.isChngPwdVisible = false;
    this.rules = [];
    this.changePwd = {
    current_pwd: null,
    new_pwd: null,
    cnfrm_pwd: null,
  };
     this.isPwdUpdatd = false;
  }

  async getPasswordRules() {
    try {
      this.rules = [];
      let pwdPlcy: any = await this._hqms.customGetApiCall('GET', 'fnPwdPlcyApi', {});
      if (pwdPlcy.status == 200) {
        pwdPlcy = pwdPlcy.data[0];
        if (pwdPlcy['passw_policy_min_len'] > 0) this.rules.push({ regex: new RegExp(`.{${pwdPlcy['passw_policy_min_len']}}`, 'g'), message: `Needs Minimum ${pwdPlcy['passw_policy_min_len']} Characters` });
        if (pwdPlcy['passw_policy_special_char_len'] > 0) this.rules.push({
          regex: new RegExp(`^(?=(?:[^!"#$%&'()*+,\\-./:;<=>?@[\\\\\\]^_\`{|}~]*[!"#$%&'()*+,\\-./:;<=>?@[\\\\\\]^_\`{|}~]){${pwdPlcy['passw_policy_special_char_len']}}).*`),
          message: `Needs at least ${pwdPlcy['passw_policy_special_char_len']} Special Characters`, min: `${pwdPlcy['passw_policy_special_char_len']}`
        });
        if (pwdPlcy['passw_policy_min_capital_letters_len'] > 0) this.rules.push({ regex: /[A-Z]/g, message: `Needs at least ${pwdPlcy['passw_policy_min_capital_letters_len']} Uppercase Letetrs`, min: `${pwdPlcy['passw_policy_min_capital_letters_len']}` });
        if (pwdPlcy['passw_policy_min_small_letters_len'] > 0) this.rules.push({ regex: /[a-z]/g, message: `Needs at least ${pwdPlcy['passw_policy_min_small_letters_len']} Lowercase Letters`, min: `${pwdPlcy['passw_policy_min_small_letters_len']}` });
        if (pwdPlcy['passw_policy_digits_min_len'] > 0) this.rules.push({ regex: /[0-9]/g, message: `Needs at least ${pwdPlcy['passw_policy_digits_min_len']} number`, min: `${pwdPlcy['passw_policy_digits_min_len']}` });
      };
    } catch (e) { };
  }


  checkStrength(event: any) {
    const value = event.target.value;
    let strength = 0;
    this.passwordPolicies = [];
    this.rules.forEach((rule, ind) => {
      if (rule.regex.global) {
        const matches = value.match(rule.regex);
        if (matches && matches.length >= (rule.min || 1)) strength++;
        else this.passwordPolicies.push(`${rule.message}`)
      }
      else {
        if (rule.regex.test(value)) { strength++; }
        else this.passwordPolicies.push(`${rule.message}`)
      }
    });
    this.strengthPercentage = (strength / this.rules.length) * 100
    if (strength === this.rules.length) {
      this.strengthMessage = 'Strong';
      this.strengthClasss = 'strong';
      this.strengthColor = 'green';
    }
    else if (strength >= this.rules.length / 2) {
      this.strengthMessage = 'Medium';
      this.strengthClasss = 'medium';
      this.strengthColor = 'orange';
    }
    else {
      this.strengthMessage = 'Weak';
      this.strengthClasss = 'weak';
      this.strengthColor = 'red';
    };
  }

  onPwdVldtnClick(ctrl: string) {
    this.errorText = '';
    this.cnfrmErrorText = '';
    if (ctrl == 'new_pwd') {
      if (this.changePwd['current_pwd'] == this.changePwd['new_pwd']) {
        this.errorText = 'Same as Current Password';
      } else {
        this.errorText = '';
      };
    }
    if (ctrl == 'cnfrm_pwd') {
      if (this.changePwd['new_pwd'] == this.changePwd['cnfrm_pwd']) {
        this.cnfrmErrorText = '';
      } else {
        this.cnfrmErrorText = 'Confirm password not matched';
      };
    }
  }

  preventCopyPaste(event: ClipboardEvent) {
    event.preventDefault();
  }

  async onClick(event:any,ctrl:any){
    try{
      let fetchDta = this.stngsInfo[ctrl];
      let getKey = ctrl;
      let paylod = { "action": "I"};
      paylod[ctrl] = fetchDta;
      let saveResult: any = await this._hqms.customSaveApiCall("POST", "fnSettingsApi", paylod);
      if (saveResult.status == 200) {
        await this.ngOnInit();
      };
    }catch(e){};
  }
  public isPwdUpdatd :any = false;
  async updatePwd() {
    this.isPwdUpdatd = false;
    let getCpInfo = JSON.parse(JSON.stringify(this.changePwd));
    getCpInfo['action'] = 'p';
    var saveResult: any = await this._hqms.customSaveApiCall("POST", "fnUserApi", getCpInfo);
    if (saveResult.status == 200) {
      this._hqms.hqmsToasterService({
        key: 'cp',
        severity: 'success',
        summary: 'Change Password',
        detail: saveResult.message,
      });
      this.isPwdUpdatd = true;
      // this.router.navigateByUrl('/login');
    } else if (saveResult.status == 204 || saveResult.status == 501) {
       this.isPwdUpdatd = false;
      this._hqms.hqmsToasterService({
        key: 'cp',
        severity: 'warn',
        summary: 'Update Password',
        detail: saveResult.message,
      });
    }
  }
}
