import { Component, CUSTOM_ELEMENTS_SCHEMA, Inject, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { RouterLink, RouterOutlet, Router, ActivatedRoute } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FilterService, SelectItemGroup } from 'primeng/api';
import { AutoComplete } from 'primeng/autocomplete';
import { HqmsService } from '../../services/hqms.service';
import { SharedModule } from '../../shared/shared.module';
import { BehaviorSubject } from 'rxjs';
import { SecurityService } from '../../sec-featuers/security.service';
import { PermissionService } from '../../sec-featuers/permission.service';
interface SearchEvent {
  originalEvent: Event;
  query: string;
};
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, CommonModule, AutoComplete, FormsModule, SharedModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class HeaderComponent implements OnInit {
  public router = inject(Router);
  currentDateTime = new Date();
  selectedSearch: any;
  filterModules: any = [];
  mappedLctnsList: any = [];
  groupedModules: any = [];
  static dataPipeline$ = new BehaviorSubject<any[]>([]);
  private timerId: any;
  // public userLogo = null ;//'assets/images/avatar.png';
  public userName: any = null;
  public fileOrImageUrl: any = null;
  public ntfctnsInfo: any = [];
  private authService = inject(SecurityService);
  private permissionService = inject(PermissionService);
  public lastFetchedLocId: any = null;
  public roleName: any = '';

  constructor(@Inject(PLATFORM_ID) private platformId: Object, private filterService: FilterService,
    private activatedRoute: ActivatedRoute, public _hqms: HqmsService) { }

  async ngOnInit() {
    let uInfo: any = this._hqms.getStorageItem('user_info');
    if (uInfo != null) {
      let info = this._hqms.decryptString(uInfo)
      this.userName = info['user_display_name'];
      this.fileOrImageUrl = info['fileOrImageUrl'];
    };
    let slctdRle: any = this._hqms.getStorageItem('slctdLctnRle');
    slctdRle = this._hqms.decryptString(slctdRle);
    this.slctdLctn = slctdRle;
    let rle: any = this._hqms.getStorageItem('role_name');
    rle = this._hqms.decryptString(rle);
    this.roleName = rle;
    await this.getPermissionsInfo();
    await this.getNtfcns();
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

  toggleMenu(): void {
    document.body.classList.toggle('body-toggle');
  }

  filterGroupedModules(event: SearchEvent) {
    try {
      let query: any = event.query.toLowerCase();

      let filtered: any = [];
      if (this.groupedModules.length == 0) {
        return;
      };
      for (let optGrp of this.groupedModules) {
        let parentMatches = (optGrp.label || '').toLowerCase().includes(query);
        let matchedChildren = (optGrp.items || []).filter((child: any) =>
          (child.label || '').toLowerCase().includes(query));
        if (parentMatches && optGrp.route) {
          filtered.push({
            label: optGrp.label,
            items: [{ label: optGrp.label, route: optGrp.route }]
          })
        } else if (matchedChildren.length > 0) {
          filtered.push({
            ...optGrp,
            items: matchedChildren
          })
        };
      };
      this.filterModules = filtered;
    } catch (e) {
    };
  }

  onModuleSelect(event: any) {
    try {
      if (event) {
        if (event['value']['route']) {
          this._hqms.setBlocking(true);
          this.router.navigate(
            [
              event['value']['route'],
            ],
            {
              relativeTo: this.activatedRoute,
              state: {
                data: event['value']
              }
            },
          );
        };
      }
    } catch (e) { }
  }

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
  public oldPwdError: string = '';

  onPwdVldtnClick(ctrl: string) {
    let old = this.changePwd['current_pwd'] ?.trim();
    let nw = this.changePwd['new_pwd'];
    let cnf = this.changePwd['cnfrm_pwd'];
    if (ctrl === 'current_pwd') {
      this.oldPwdError = !old ? 'Old Password is required' : '';
    }
    if (ctrl == 'new_pwd') {
      if (!nw) this.errorText = 'New Password is required';
      else if (old && old === nw) this.errorText = 'New Password cannot be same as old';
      else if (this.passwordPolicies ?.length && this.strengthPercentage < 100)
        this.errorText = 'Password should meet policy';
      else this.errorText = '';
      if (cnf) this.onPwdVldtnClick('cnfrm_pwd');
    }
    if (ctrl == 'cnfrm_pwd') {
      if (!cnf) this.cnfrmErrorText = 'Confirm Password is required';
      else if (nw !== cnf) this.cnfrmErrorText = 'Passwords do not match';
    }
  }

  async  onOpenCPclick() {
    this.isChngPwdVisible = true;
    await this.getPasswordRules();
  }

  onCloseCP() {
    this.isChngPwdVisible = false;
  }

  preventCopyPaste(event: ClipboardEvent) {
    event.preventDefault();
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

  onPwdClear() {
    this.isChngPwdVisible = false;
    this.rules = [];
    this.changePwd = {
      current_pwd: null,
      new_pwd: null,
      cnfrm_pwd: null,
    };
    this.isPwdUpdatd = false;
  }

  public isPwdUpdatd: any = false;
  async updatePwd() {

    ["current_pwd", "new_pwd", "cnfrm_pwd"].forEach((ctrl) =>
      this.onPwdVldtnClick(ctrl),
    );
    let error = {
      oldPwdError: this.oldPwdError,
      errorText: this.errorText,
      cnfrmErrorText: this.cnfrmErrorText,
    }
    let isValid = this._hqms.showErrorSummary(error);
    if (isValid) {
      this._hqms.hqmsToasterService({
        key: "cp",
        severity: "warn",
        summary: "Change Password",
        detail: "Check the errors",
      });
      return;
    }
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
  public slctdLctn: string = '';

  async getPermissionsInfo() {
    try {
      this.groupedModules = [];
      HeaderComponent.dataPipeline$.next([]);
      // Same permission list the route guard uses (loaded once per session).
      let modules: any[] = await this.permissionService.load();
      let pInfo: any = { status: modules.length > 0 ? 200 : 204, data: modules };
      if (pInfo.status == 200) {
        this.groupedModules = pInfo.data.map((mod) => ({
          label: mod.module_name,
          value: mod.module_name,
          icon: mod.module_icon,
          route: mod.module_route,
          isSingle: (mod.document_map || []).length == 0,
          items: (mod.document_map || []).map((dc) => ({
            label: dc.document_name,
            value: dc.document_name,
            route: dc.primary_url,
            ...dc
          }))
        }))
        HeaderComponent.dataPipeline$.next(pInfo.data);
        let currentUrl = this.router.url;
        const isAtRootDashboard = currentUrl === '/dashboard' || currentUrl === '/';
        const firstModule = pInfo.data[0];
        let targetModule = firstModule.module_route || firstModule.document_map ?.[0] ?.primary_url;
        if (targetModule && isAtRootDashboard) {
          this.router.navigate([targetModule]);
        }
      } else {
      };
    } catch (e) {
      HeaderComponent.dataPipeline$.next([]);
    };
  }

  async onDeleteNtfcn(ntfcn: any) {
    try {
      let ntfcnInfo: any = await this._hqms.customSaveApiCall("POST", "fnNtfcnList", { notification_id: ntfcn['notification_id'] });
      if (ntfcnInfo.status == 200) {
      };
    } catch (e) {
    };
  }

  async getNtfcns() {
    try {
      // let getSrvrDt = await this._hqms.getServerDate('DATE');
      // let ntfcnInfo: any = await this._hqms.customGetApiCall('GET', 'fnNtfcnList', { from_dt : getSrvrDt, to_dt :getSrvrDt  });
      // if (ntfcnInfo.status == 200) {
      //    this.ntfctnsInfo =ntfcnInfo['data'].map((ele:any)=>  ({ ...ele,
      //      scheduleddt :  ele.scheduleddt != null ?  `${ele.scheduleddt} at ${ele.scheduled_time}`:null,
      //       isMsgRead :false
      //    }))
      // };
    } catch (e) { };
  }


  imageUrl: string = "";
  label: string = "";
  size: any = "normal";
  shape: any = "circle";

  // Ends the session on the server first, then clears storage and goes to login (SecurityService.logout).
  async onLogOutClick() {
    await this.authService.logout('logout');
    this._hqms.setBlocking(false);
  }
}
