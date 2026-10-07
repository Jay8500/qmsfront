import { Component, OnInit, OnDestroy, signal, inject, ViewChildren, QueryList, computed, ViewChild } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { SharedModule } from '../../shared/shared.module';
import { HqmsService } from '../../services/hqms.service';
import { SecurityService } from '../../sec-featuers/security.service';
import { IdleService, IDLE_STORAGE_KEY } from '../../sec-featuers/idle.service';
import { PermissionService } from '../../sec-featuers/permission.service';
interface userLoginModel {
  userName: string;
  rememberMe: boolean;
  password: string;
}
@Component({
  selector: 'app-login',
  imports: [SharedModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit, OnDestroy {
  public router = inject(Router);
  public userLogin: any = {
    userName: '',
    password: '',
    rememberMe: false
  };
  public clearLogin = JSON.stringify(this.userLogin);
  public errorMsg: any = {
    userName: '',
    password: '',
  }
  public clearErr = JSON.stringify(this.errorMsg);
  public orgInfo: any = {
    display_name: 'Hqms',
    defaultLogo: 'assets/images/logo.png',
    org_id: null
  };
  public loginBg = `assets/images/login-bg.jpg`
  private logoSubscription?: Subscription;
  readonly FORM_NAME = 'LoginForm';
  private fieldValidity = signal<Record<string, boolean>>({});
  public isOrgLoading: any = true;
  public secService = inject(SecurityService);
  private permissionService = inject(PermissionService);
  public redirectNotice = signal('');
  public result = signal('');
  public displayForgotDialog = false;
  public resetStep: number = 1;
  public rules: any = [];
  public resetPwd: any = {
    resetType: 'M',
    resetInput: "",
    otp: null,
    password: null,
    confirmpassword: null,
    ref_id: null,
    expired_in: null,
    reference_id: null
  };
  public clrRstPwd = JSON.stringify(this.resetPwd);
  public resetList: any = [
    { label: "Mobile", value: 'M', icon: 'pi pi-mobile' },
    { label: "Email", value: 'E', icon: 'pi pi-envelope' },
    { label: "User", value: 'U', icon: 'pi pi-user' },
  ]
  public resetErr: any = {
    resetInput: "",
    otp: "",
    password: "",
    confirmpassword: "",
  };
  public clrRstErr = JSON.stringify(this.resetErr);
  toggledShowPwd = signal<boolean>(false);
  toggledRestShowPwd = signal<boolean>(false);
  toggledCnfrmShowPwd = signal<boolean>(false);
  public timeLeft: string = '00:00';
  private timerInterval: any;
  public passwordPolicies: any = [];
  public strengthMessage: any = '';
  public strengthClasss: any = '';
  public strengthColor = 'red';
  public strengthPercentage = 0;
  public isLoginSuccess: boolean = false;
  public selectedLocation: any = null;
  public locationsList: any = [];

  startOtpTimer(expiryTimerStr: string) {
    const expiryTime = new Date(expiryTimerStr).getTime();
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    };
    this.timerInterval = setInterval(() => {
      const now = new Date().getTime();
      const difference = Math.floor((expiryTime - now) / 1000);
      if (difference > 0) {
        const minutes = Math.floor(difference / 60);
        const seconds = difference % 60;
        this.timeLeft = `${this.pad(minutes)}:${this.pad(seconds)}`
      } else {
        this.timeLeft = '00:00';
        clearInterval(this.timerInterval);
      }
    }, 1000);
  }

  private pad(num: number): string {
    return num < 10 ? `0${num}` : `${num}`;
  }

  onGetResetErr(ctrl: any) {
    try {
      switch (ctrl) {
        case "resetInput":
          let rsInput = [null, '', 0].includes(this.resetPwd.resetInput) ?
            `${this.resetPwd['resetType'] == 'M' ? 'Mobile Number is required' : this.resetPwd['resetType'] == 'E' ? 'Email is required' : 'User Name is required'}` : ''
          if (rsInput == '') {
            if (this.resetPwd['resetType'] == 'M') {
              const regex = /^\d+$/;
              if (regex && !regex.test(this.resetPwd['resetInput'])) {
                rsInput = 'Number are allowed'
              } else {
                rsInput = "";
              };
              const digits = /^\d{10}$/;
              if (digits && !digits.test(this.resetPwd['resetInput'])) {
                rsInput = '10 digits required'
              } else {
                rsInput = "";
              };
            };

            if (this.resetPwd['resetType'] == 'E') {
              const regex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
              if (regex && !regex.test(this.resetPwd['resetInput'])) {
                rsInput = "Email format is wrong";
              } else {
                rsInput = "";
              };
            };
          };

          this.resetErr = {
            ...this.resetErr,
            resetInput: rsInput
          }
          break;
        case "otp":
          let otpErr = [null, '', 0].includes(this.resetPwd.otp) ? `OTP is required` : ''
          if (otpErr == '') {
            if (this.resetPwd.otp.length < 6) {
              otpErr = 'OTP should be 6 digits'
            } else {
              otpErr = '';
            }
          };
          this.resetErr = {
            ...this.resetErr,
            otp: otpErr
          }
          break;
        case "password":
          let newPwd = [null, '', 0].includes(this.resetPwd.password) ? `New Password is required` : ''
          this.resetErr = {
            ...this.resetErr,
            password: newPwd
          }
          break;
        case "confirmpassword":
          let cnfPwd = [null, '', 0].includes(this.resetPwd.confirmpassword) ? `Confirm Password is required` : '';
          if (cnfPwd == '') {
            let getPwd = (this.resetPwd.password || '').toLowerCase();
            let getCnfPwd = (this.resetPwd.confirmpassword || '').toLowerCase();
            if (getPwd !== getCnfPwd) {
              cnfPwd = 'Passwords do not match';
            } else {
              cnfPwd = '';
            };
          };
          this.resetErr = {
            ...this.resetErr,
            confirmpassword: cnfPwd
          }
          break;
      }
    } catch (e) {
    }
  }

  onGetErrorMsgs(ctrl: any) {
    try {
      switch (ctrl) {
        case "userName":
          let error = [null, '', 0].includes(this.userLogin.userName) ? 'User Name is required' : ''
          this.errorMsg = {
            ...this.errorMsg,
            userName: error
          }
          break;
        case "password":
          let nameErr = [null, '', 0].includes(this.userLogin.password) ? 'Password is required' : ''
          this.errorMsg = {
            ...this.errorMsg,
            password: nameErr
          }
          break;
      }
    } catch (e) {
    }
  }
  public clrLcErr: any = {
    selectedLocation: ""
  }
  onLocErrorMsgs(ctrl: any) {
    try {
      switch (ctrl) {
        case "selectedLocation":
          let error = [null, ''].includes(this.selectedLocation) ? 'Location is required' : ''
          this.clrLcErr = {
            ...this.clrLcErr,
            selectedLocation: error
          }
          break;

      }
    } catch (e) {
    }
  }

  constructor(
    private _hqms: HqmsService,
    private _idleSrvce: IdleService,
    private activatedRoute: ActivatedRoute
  ) {
  }

  updateToggleState() {
    this.toggledShowPwd.update((v) => !v);
  }

  updateResetToggleState() {
    this.toggledRestShowPwd.update((v) => !v);
  }

  updateCnfrmToggleState() {
    this.toggledCnfrmShowPwd.update((v) => !v);
  }
  public org_id: any = null;
  public orgErr: string = "";

  async ngOnInit() {
    await this.getTenantInfo();
  }

  async getTenantInfo() {
    this._hqms.setBlocking(true)
    this.orgErr = "";
    this.isOrgLoading = true;
    this.org_id = null;
    try {
      let org: any = await this._hqms.customGetApiCall('GET', 'fnOrgApi', { org_key: window.location.hostname });
      if (org.status == 200) {
        this.org_id = org.data[0]['org_id'];
        this.orgInfo['display_name'] = org.data[0]['display_name'];
        // Used by getOrgId() / getLogoUrl(); moved to the "Remember me" storage after login.
        this._hqms.setStorageItem('OrgDetials', this._hqms.encryptString(JSON.stringify(org.data[0])), false);
        if (org.data[0]['logo'].length > 0) {
          if (org.data[0]['logo'][0]['fileOrImageUrl'] != null) {
            this.orgInfo['defaultLogo'] = org.data[0]['logo'][0]['fileOrImageUrl']
          } else {
            this.orgInfo['defaultLogo'] = 'assets/images/logo.png'
          }
        }

        if (this.secService.getAccessToken() && !sessionStorage.getItem('logout_reason')) {
          this._hqms.setBlocking(false);
          this.router.navigate(['/management-dashboard']);
          return;
        }
        const reason = sessionStorage.getItem('logout_reason');
        if (reason) {
          sessionStorage.removeItem('logout_reason');
          if (reason === 'idle') this.redirectNotice.set('Logged out due to inactivity');
          if (reason === 'duplicate') this.redirectNotice.set('This tab was closed: session already active elsewhere');
          if (reason === 'unauth') this.redirectNotice.set('You must log in first');
          if (reason === 'superseded') this.redirectNotice.set('You were logged out because you logged in from another browser or device');
          if (reason === 'expired') this.redirectNotice.set('Your session has ended. Please log in again');
          if (reason === 'denied') this.redirectNotice.set('Logged out after an access-denied page');
          if (reason === 'switched') this.redirectNotice.set('You were logged out because another user signed in in this browser');
        };

      } else if (org.status == 501) {
        this.orgErr = org.message;
        return;
      }
    } catch (e) {

    } finally {
      this.isOrgLoading = false;
      this._hqms.setBlocking(false)
    }
  }

  public loginResp: any = null;
  async onHqmsLoginClick() {
    try {
      this.loginResp = null;
      let erros: any = ['userName', 'password']
      erros.forEach((ele: any) => { this.onGetErrorMsgs(ele) });
      let isValid = this._hqms.showErrorSummary(this.errorMsg);
      if (isValid) {
        this._hqms.hqmsToasterService({
          key: 'rle',
          severity: 'warn',
          summary: 'Login',
          detail: 'Check the errors',
        });
        return
      }
      let data = JSON.parse(JSON.stringify(this.userLogin));
      const locKey: any = data.userName.trim().toLowerCase();
      if (!this.secService.tryLockTab(locKey)) {
        this.result.set('Already logged in on another tab for this user.')
      }
      let info: any = await this._hqms.customGetApiCall('GET', 'fnGetLogin', {
        "user_name": (data.userName || '').trim(),
        "password": (data.password || '').trim(),
        "minutes": -(new Date().getTimezoneOffset()),
        "current_time": new Date(),
        'org_id': this.org_id,
        "machine": null,
        "version": null,
        "terminal": null,
        "browser": null
      });
      if (info.status == 200) {
        // One user per browser: is a DIFFERENT user logged in in this browser (another tab or "Remember me")?
        const otherUser = await this.secService.otherUserInBrowser(info.data[0]?.['user_id']);
        if (otherUser) {
          const otherName = otherUser.display_name || 'Another user';
          const continueLogin = await this._hqms.showConfirmMessage(
            `${otherName} is logged in in this browser. Only one user can be logged in per browser. ` +
            `If you continue, ${otherName} will be logged out.`,
            'Another user is logged in',
            'confirmsubmit',
            'Continue',
            'Cancel',
            false,
          );
          if (!continueLogin) {
            this.secService.releaseTabLock(locKey);
            this.result.set(`Login cancelled — ${otherName} is still logged in in this browser.`);
            return;
          }
        }
        // Already logged in on another browser / device? Continuing ends that session (SESSION_SUPERSEDED there).
        const otherSessions = info.data[0]?.['other_active_sessions'] || 0;
        if (otherSessions > 0) {
          const since = info.data[0]?.['other_session_since'];
          const continueHere = await this._hqms.showConfirmMessage(
            `You are already logged in on another browser or device${since ? ' (since ' + this._hqms._datePipe.transform(since, 'dd-MMM-yyyy h:mm a') + ')' : ''}. ` +
            'If you continue here, that session will be logged out.',
            'Already logged in',
            'confirmsubmit',
            'Continue here',
            'Cancel',
            false,
          );
          if (!continueHere) {
            this.secService.releaseTabLock(locKey);
            this.result.set('Login cancelled — you are still logged in on the other browser or device.');
            return;
          }
        }
        this.result.set('');
        this.isLoginSuccess = true;
        this.loginResp = info.data[0];
        this.locationsList = info.data[0]['user_role'].map((ele) => ({
          value: ele.loc_id, label: ele.location_name, role_id: ele.role_id, role_name: ele.role_name
        }))
        let orgDetails = this._hqms.getStorageItem('OrgDetials');
        if (orgDetails != null) {
          this._hqms.removeStorageItem('OrgDetials');
          this._hqms.setStorageItem('OrgDetials', orgDetails, data.rememberMe);
        };

      } else if (info.status == 501) {
        this.isLoginSuccess = false;
        this.selectedLocation = null;
        this._hqms.removeStorageItem('user_info');
        this.secService.releaseTabLock(locKey);
        this._hqms.hqmsToasterService({
          severity: 'warn',
          summary: 'Login',
          detail: info['message'],
        });
      }
    } catch (e) {
      this.isLoginSuccess = false;
      this.selectedLocation = null;
    }
  }

  async onLocationSelect() {
    try {
      let erros: any = ['selectedLocation']
      erros.forEach((ele: any) => { this.onLocErrorMsgs(ele) });
      let isValid = this._hqms.showErrorSummary(this.errorMsg);
      if (isValid) {
        this._hqms.hqmsToasterService({
          key: 'rle',
          severity: 'warn',
          summary: 'Login',
          detail: 'Check the errors',
        });
        return
      };
      let data = JSON.parse(JSON.stringify(this.userLogin));
      let getSelectedLoction = this.locationsList.filter(f => f.value === this.selectedLocation)[0];
      // Ends a different user's login in this browser (confirmed at the password step) before storing this one.
      await this.secService.takeOverBrowser({ user_id: this.loginResp['user_id'], display_name: this.loginResp['user_display_name'] || '' });
      this._hqms.setStorageItem('slctdLctnRle', this._hqms.encryptString(JSON.stringify(getSelectedLoction['label'])), data.rememberMe);
      this._hqms.setStorageItem('role_name', this._hqms.encryptString(JSON.stringify(getSelectedLoction['role_name'])), data.rememberMe);
      let loginResp = this.loginResp;
      this._hqms.setStorageItem('user_info', this._hqms.encryptString(JSON.stringify(loginResp)), data.rememberMe);
      this.secService.storeTokens(loginResp['accessToken'], loginResp['refreshToken'], data.rememberMe);
      let sesionInfo: any = await this._hqms.customGetApiCall('GET', 'fnUserSessionWrite',
        {
          "loc_id": this.selectedLocation,
          "user_id": this._hqms.getUserId(),
          "org_id": this._hqms.getOrgId(),
        });
      if (sesionInfo?.status == 200 && sesionInfo.data?.[0]?.['session_id']) {
        this._hqms.setStorageItem('selected_session_id', this._hqms.encryptString(JSON.stringify(sesionInfo.data[0]['session_id'])), data.rememberMe);
        this._hqms.userUpdatedSessionId = sesionInfo.data[0]['session_id']
        this.permissionService.clear(); // menu / route permissions of this new session
      } else {
        // Every screen needs a session; do not continue without one.
        this.secService.clearTokens();
        this._hqms.hqmsToasterService({
          severity: 'warn',
          summary: 'Login',
          detail: sesionInfo?.message || 'Could not start the session. Please try again.',
        });
        return;
      };
      let appStnginfo: any = await this._hqms.customGetApiCall('GET', 'fnAppStngsApi', { action: "R" });
      if (appStnginfo.status == 200) {
        if (appStnginfo.data.length > 0) {
          this._hqms.setDateFormat(appStnginfo['data'][0]['date_format_code'] || 'EEEE, MMM d, yyyy');
          // Idle time from Application Settings: value in milliseconds + the label the admin chose.
          const idleSetting = this._idleSrvce.configure(appStnginfo['data'][0]['idle_time_code'], appStnginfo['data'][0]['idle_time_label']);
          this._hqms.setStorageItem(IDLE_STORAGE_KEY, idleSetting, data.rememberMe);
        };
      };
      if (loginResp['perm_status'] == 'Y') {
        await this._hqms.getServerDate('DATE')
        this.router.navigate(['/management-dashboard']);
      } else { // no permissions
        this.router.navigate(['/nopermissions']);
      };
    } catch (e) { };
  }

  onClearClick() {
    this._hqms.clearToaster();
    this.userLogin = JSON.parse(this.clearLogin);
    this.errorMsg = JSON.parse(this.clearErr);
  }


  async onEnterKey(event: Event) {
    const keyEvent = event as KeyboardEvent;
    if (keyEvent.shiftKey || keyEvent.ctrlKey || keyEvent.altKey || keyEvent.metaKey) return;
    event.preventDefault();
    await this.onHqmsLoginClick();
  }

  onResetHide() {
    this.displayForgotDialog = false;
    this.resetStep = 1;
    this.timerInterval = null;
    this.timeLeft = '00:00';
    this.resetPwd = JSON.parse(this.clrRstPwd);
    this.resetErr = JSON.parse(this.clrRstErr);
  }

  requestOtp() {
    this.resetStep = 1;
    this.timerInterval = null;
    this.timeLeft = '00:00';
    this.resetPwd = JSON.parse(this.clrRstPwd);
    this.resetErr = JSON.parse(this.clrRstErr);
  }
  onResetTypeClick(event: any) {
    this.resetPwd['resetInput'] = null;
    this.resetPwd['otp'] = null;
    this.resetErr['resetInput'] = "";
    this.resetErr['otp'] = "";
  }

  public restToaster = {
    severity: "",
    message: "",
  };
  public clearToaster = JSON.stringify(this.restToaster);

  async onSendOtp() {
    try {
      this.restToaster = JSON.parse(this.clearToaster);
      this.resetErr['otp'] = "";
      let erros: any = ['resetInput'];
      erros.forEach((ele: any) => { this.onGetResetErr(ele) });
      let isValid = this._hqms.showErrorSummary(this.resetErr);
      if (isValid) {
        this._hqms.hqmsToasterService({
          key: 'rst',
          severity: 'warn',
          summary: 'Reset Password',
          detail: 'Check the errors',
        });
        return
      }
      let sndOTp = JSON.parse(JSON.stringify(this.resetPwd));
      var saveResult: any = await this._hqms.customSaveApiCall(
        "POST",
        "fnHqmsUserMobileEmailOtpWriteApi",
        {
          reset_type: sndOTp['resetType'],
          reset_type_name: sndOTp['resetInput'].trim(),
          action: 'SEND_OTP',
        }
      );
      if (saveResult.status == 200) {
        this._hqms.hqmsToasterService({
          key: "rle",
          severity: "success",
          summary: "Reset Password",
          detail: saveResult['data'][0]['message']
        });
        this.restToaster['severity'] = 'success';
        this.restToaster['message'] = saveResult['data'][0]['message'];
        this.resetPwd['ref_id'] = saveResult['data'][0]['ref_id'];
        this.resetPwd['expired_in'] = saveResult['data'][0]['expired_in'];
        this.resetStep = 2;
        this.startOtpTimer(saveResult['data'][0]['expired_in'])
      } else if (saveResult.status == 204 || saveResult.status == 501 || saveResult.status == 401) {
        this._hqms.hqmsToasterService({
          key: "rle",
          severity: "warn",
          summary: "Reset Password",
          detail: saveResult.message,
        });
        this.restToaster['severity'] = 'error';
        this.restToaster['message'] = saveResult.message;
      }
    } catch (e) { };
  }

  async onVerifyOtp() {
    try {
      this.rules = [];
      this.restToaster = JSON.parse(this.clearToaster);
      this.resetErr['resetInput'] = "";
      this.resetErr['password'] = "";
      this.resetErr['confirmpassword'] = "";
      let erros: any = ['otp'];
      erros.forEach((ele: any) => { this.onGetResetErr(ele) });
      let isValid = this._hqms.showErrorSummary(this.resetErr);
      if (isValid) {
        this._hqms.hqmsToasterService({
          key: 'rst',
          severity: 'warn',
          summary: 'Verify OTP',
          detail: 'Check the errors',
        });
        return
      }
      let sndOTp = JSON.parse(JSON.stringify(this.resetPwd));
      var saveResult: any = await this._hqms.customSaveApiCall(
        "POST",
        "fnHqmsUserMobileEmailOtpWriteApi",
        {
          ref_id: sndOTp['ref_id'],
          otp: sndOTp['otp'],
          action: 'VERIFY_OTP',
        },
      );
      if (saveResult.status == 200) {
        if (saveResult['data'][0]['ref_cd'] == 'Y') {
          this._hqms.hqmsToasterService({
            key: "rle",
            severity: "success",
            summary: "Reset Password",
            detail: saveResult.message,
          });
          this.restToaster['severity'] = 'success';
          this.restToaster['message'] = saveResult.message;
          this.resetPwd['reference_id'] = saveResult['data'][0]['reference_id'];
          if (saveResult['data'][0]['passw_policy_min_len'] > 0) this.rules.push({ regex: new RegExp(`.{${saveResult['data'][0]['passw_policy_min_len']}}`, 'g'), message: `Needs Minimum ${saveResult['data'][0]['passw_policy_min_len']} Characters` });
          if (saveResult['data'][0]['passw_policy_special_char_len'] > 0) this.rules.push({
            regex: new RegExp(`^(?=(?:[^!"#$%&'()*+,\\-./:;<=>?@[\\\\\\]^_\`{|}~]*[!"#$%&'()*+,\\-./:;<=>?@[\\\\\\]^_\`{|}~]){${saveResult['data'][0]['passw_policy_special_char_len']}}).*`),
            message: `Needs at least ${saveResult['data'][0]['passw_policy_special_char_len']} Special Characters`, min: `${saveResult['data'][0]['passw_policy_special_char_len']}`
          });
          if (saveResult['data'][0]['passw_policy_min_capital_letters_len'] > 0) this.rules.push({ regex: /[A-Z]/g, message: `Needs at least ${saveResult['data'][0]['passw_policy_min_capital_letters_len']} Uppercase Letetrs`, min: `${saveResult['data'][0]['passw_policy_min_capital_letters_len']}` });
          if (saveResult['data'][0]['passw_policy_min_small_letters_len'] > 0) this.rules.push({ regex: /[a-z]/g, message: `Needs at least ${saveResult['data'][0]['passw_policy_min_small_letters_len']} Lowercase Letters`, min: `${saveResult['data'][0]['passw_policy_min_small_letters_len']}` });
          if (saveResult['data'][0]['passw_policy_digits_min_len'] > 0) this.rules.push({ regex: /[0-9]/g, message: `Needs at least ${saveResult['data'][0]['passw_policy_digits_min_len']} number`, min: `${saveResult['data'][0]['passw_policy_digits_min_len']}` });
          this.resetStep = 3;
        } else {
          this.rules = [];
          this._hqms.hqmsToasterService({
            key: "rle",
            severity: "error",
            summary: "Reset Password",
            detail: 'Not valid otp',
          });
          this.restToaster['severity'] = 'warn';
          this.restToaster['message'] = 'Not valid otp';
          this.resetPwd['otp'] = null;
        };
      } else if (saveResult.status == 204 || saveResult.status == 501 || saveResult.status == 401) {
        this._hqms.hqmsToasterService({
          key: "rle",
          severity: "warn",
          summary: "Reset Password",
          detail: saveResult.message,
        });
        this.restToaster['severity'] = 'error';
        this.restToaster['message'] = saveResult.message;
        this.timeLeft = '00:00';
      }
    } catch (e) { };
  }

  async submitNewPassword() {
    try {
      this.resetErr['resetInput'] = "";
      this.resetErr['otp'] = "";
      let erros: any = ['password', 'confirmpassword'];
      erros.forEach((ele: any) => { this.onGetResetErr(ele) });
      let isValid = this._hqms.showErrorSummary(this.resetErr);
      if (isValid) {
        this._hqms.hqmsToasterService({
          key: 'rst',
          severity: 'warn',
          summary: 'Reset Password',
          detail: 'Check the errors',
        });
        return
      };
      let sndOTp = JSON.parse(JSON.stringify(this.resetPwd));

      var saveResult: any = await this._hqms.customSaveApiCall(
        "POST",
        "fnHqmsUserMobileEmailOtpWriteApi",
        {
          reference_id: sndOTp['reference_id'],
          password: sndOTp['password'].trim(),
          action: 'RESET_PWD',
        },
      );
      if (saveResult.status == 200) {
        this._hqms.hqmsToasterService({
          key: "rle",
          severity: "success",
          summary: "Reset Password",
          detail: saveResult.message,
        });
        this.restToaster['severity'] = 'success';
        this.restToaster['message'] = saveResult.message;
        this.resetStep = 3;

      } else if (saveResult.status == 204 || saveResult.status == 501 || saveResult.status == 401) {
        this._hqms.hqmsToasterService({
          key: "rle",
          severity: "warn",
          summary: "Reset Password",
          detail: saveResult.message,
        });
        this.restToaster['severity'] = 'error';
        this.restToaster['message'] = saveResult.message;
      }

      this.onResetHide();
    } catch (e) { };
  }

  async onResetTypeEnter(event: Event) {
    const keyEvent = event as KeyboardEvent;
    if (keyEvent.shiftKey || keyEvent.ctrlKey || keyEvent.altKey || keyEvent.metaKey) return;
    event.preventDefault();
    await this.onSendOtp();
  }

  async onOTPEnterKey(event: Event) {
    const keyEvent = event as KeyboardEvent;
    if (keyEvent.shiftKey || keyEvent.ctrlKey || keyEvent.altKey || keyEvent.metaKey) return;
    event.preventDefault();
    await this.onVerifyOtp();
  }

  async onConfrimPwd(event: Event) {
    const keyEvent = event as KeyboardEvent;
    if (keyEvent.shiftKey || keyEvent.ctrlKey || keyEvent.altKey || keyEvent.metaKey) return;
    event.preventDefault();
    await this.submitNewPassword();
  }

  checkStrength(event: any) {
    this.resetErr['password'] = '';
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
      this.resetErr['password'] = '';
    }
    else if (strength >= this.rules.length / 2) {
      this.strengthMessage = 'Medium';
      this.strengthClasss = 'medium';
      this.strengthColor = 'orange';
      this.resetErr['password'] = 'New Password should meet Password Policy';
    }
    else {
      this.strengthMessage = 'Weak';
      this.strengthClasss = 'weak';
      this.strengthColor = 'red';
      this.resetErr['password'] = 'New Password should meet Password Policy';
    };
  }

  ngOnDestroy() {
    if (this.logoSubscription) {
      this.logoSubscription.unsubscribe();
    }
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    this._hqms.setBlocking(false)
  }

  preventCopyPaste(event: Event) {
    event.preventDefault();
  }
}
