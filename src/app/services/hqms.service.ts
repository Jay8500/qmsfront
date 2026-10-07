import { Injectable, inject, signal } from '@angular/core';
import dataConfig from '../../assets/config/appconfig.json';
import * as _ from 'lodash';
import { MessageService, ConfirmationService } from 'primeng/api';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import kindOf from 'kind-of';
import { DatePipe } from '@angular/common';
import { BehaviorSubject, firstValueFrom, debounceTime, distinctUntilChanged } from 'rxjs';
import * as CryptJs from "crypto-js";
import { Router } from '@angular/router';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { environment } from '../../environments/environment.development';
@Injectable({
  providedIn: 'root',
})
export class HqmsService {
  public _httpClient: any = inject(HttpClient);
  public _getConfigData: any;
  public _errorSummary: string = "";
  public _confirmService = inject(ConfirmationService);
  public loaderSource = new BehaviorSubject<boolean>(false);
  public isBlocking$ = this.loaderSource.pipe(
    distinctUntilChanged(),
    debounceTime(0)
  );
  public hostclientname = window.location.hostname
  public userUpdatedSessionId = null;

  constructor(
    public _messageService: MessageService,
    public _datePipe: DatePipe,
    public router: Router,
    private breakpointObserver: BreakpointObserver
  ) {
    this._getConfigData = dataConfig;
    this.breakpointObserver
      .observe(['(max-width:575.98px)'])
      .subscribe((state: BreakpointState) => {
        let isMobileView: string = (state.matches ? "Y" : "N");
        localStorage.setItem("isMobileView", isMobileView);
      });
  }

  setBlocking(value: boolean) { this.loaderSource.next(value) };

  getFormattedSNo(id: number): string {
    return id.toString().padStart(2, '0');
  }

  isMobileView() {
    let isMobileView: boolean = ((localStorage.getItem("isMobileView") || "") == "Y" ? true : false);
    return isMobileView;
  }

  encryptString(value: string) {
    var encString = CryptJs.AES.encrypt(value, this._getConfigData['tokenSecretKey']).toString();
    return encString;
  }

  decryptString(value: string) {
    var userInfoBytes = CryptJs.AES.decrypt(value, this._getConfigData['tokenSecretKey']);
    var decString = JSON.parse(userInfoBytes.toString(CryptJs.enc.Utf8));
    return decString;
  }

  // Session-scoped storage: rememberMe decides localStorage (persists) vs sessionStorage (tab-only),
  // matching the pattern already used for accessToken/refreshToken/userId in auth.service.ts.
  setStorageItem(key: string, value: string, rememberMe: boolean): void {
    let storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem(key, value);
  }

  getStorageItem(key: string): string | null {
    // This tab's own value first (sessionStorage), then the remembered one (localStorage).
    return sessionStorage.getItem(key) || localStorage.getItem(key);
  }

  removeStorageItem(key: string): void {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  }

  // Deep copy of the payload. (Single quotes are no longer doubled: the backend now sends
  // p_input as a bound SQL parameter, so a value like O'Brien is saved exactly as typed.)
  sanitizeJson(jsonData: any) {
    return JSON.parse(JSON.stringify(jsonData));
  }

  private baseUrl = environment.apiHostUrl;

  // In-memory cache for master/dropdown data that rarely changes within a session
  // (currency, area, module lists, etc.) — cuts repeat network calls when the same
  // add/edit page is opened again. Opt-in only: pass useCache=true at the call site;
  // default behavior (transactional list/detail calls) is unchanged.
  private _apiCache = new Map<string, any>();

  clearApiCache(masterApiUrlName?: string) {
    if (!masterApiUrlName) { this._apiCache.clear(); return; }
    Array.from(this._apiCache.keys())
      .filter((key) => key.startsWith(masterApiUrlName))
      .forEach((key) => this._apiCache.delete(key));
  }

  async customGetApiCall(
    _restRequestType: string,
    _masterApiUrlName: string,
    _sourceParamKey: any,
    useCache: boolean = false,
    silent: boolean = false, // true = no loading overlay (background checks)
  ) {
    let session: any = this.getStorageItem('selected_session_id');
    if (session != null) {
      session = this.decryptString(session)
    }
    let _resultData: any;
    // Dropdown lists (entity values) are fetched once per login for each list set, then served from memory
    // on every page; the cache is cleared at logout (SecurityService → clearApiCache).
    if (_masterApiUrlName === 'commanEntityValuesGetApi') useCache = true;
    const cacheKey = useCache ? _masterApiUrlName + JSON.stringify(_sourceParamKey) : '';
    if (useCache && this._apiCache.has(cacheKey)) {
      return this._apiCache.get(cacheKey);
    }
    if (!silent) this.setBlocking(true);
    try {
      let _apiHostUrl = this.baseUrl;
      let _masterApiUrl = await this._getConfigData[_masterApiUrlName]['getEndPoint'];
      let _serviceURL = _apiHostUrl + _masterApiUrl;
      let _httpHeaders: any = {};
      _httpHeaders['contentType'] = 'application/json; charset=utf-8';
      let params = {
        p_input: {
          ..._sourceParamKey,
          session_id: session || null
        }
      };
      _httpHeaders['params'] = this.encryptString(JSON.stringify(params));
      _httpHeaders['istokenrequired'] = 'N';
      _httpHeaders['clienturl'] = this.hostclientname.split('.')[0];
      let httpHeaders: any = { headers: new HttpHeaders(_httpHeaders), responseType: 'text' };
      let _hqmsApiRsp: any = await firstValueFrom(this._httpClient['get'](_serviceURL, httpHeaders));
      _resultData = this.decryptString(_hqmsApiRsp);
      if (_resultData ?.status == 501) {
        return _resultData;
      }
      if (useCache && _resultData ?.status == 200) {
        this._apiCache.set(cacheKey, _resultData);
      }
      if (!silent) this.setBlocking(false);
      return _resultData;
    } catch (e) {
      if (!silent) this.setBlocking(false);
    } finally {
      if (!silent) this.setBlocking(false);
    }
    if (!silent) this.setBlocking(false);
  }

  async reportGetApiCall(
    _restRequestType: string,
    _masterApiUrlName: string,
    _sourceParamKey: any,
    fileName: string
  ) {
    try {
      this.setBlocking(true);
      let session: any = this.getStorageItem('selected_session_id');
      if (session != null) {
        session = this.decryptString(session)
      }
      let _apiHostUrl = this.baseUrl;
      let _masterApiUrl = await this._getConfigData[_masterApiUrlName]['getEndPoint'];
      let _serviceURL = _apiHostUrl + _masterApiUrl;
      let _httpHeaders: any = {};
      let _resultData: any;
      _httpHeaders['contentType'] = 'application/json; charset=utf-8';
      let params = {
        p_input: {
          ..._sourceParamKey,
          session_id: session || null
        }
      };
      _httpHeaders['params'] = this.encryptString(JSON.stringify(params));
      _httpHeaders['istokenrequired'] = 'N';
      _httpHeaders['clienturl'] = this.hostclientname.split('.')[0];
      let httpHeaders: any = { headers: new HttpHeaders(_httpHeaders), responseType: 'text' };
      let _hqmsApiRsp: any = await firstValueFrom(this._httpClient['get'](_serviceURL, httpHeaders));
      _resultData = this.decryptString(_hqmsApiRsp);
      if (_resultData.status == 200) {
        this.setBlocking(false);
        window.open(_resultData.data, '_blank');
      } else {
        this.setBlocking(false);
      }
    } catch (e) {
      this.setBlocking(false);
    } finally {
      this.setBlocking(false);
    }
  }

  async customSaveApiCall(
    _restRequestType: string,
    _masterApiUrlName: string,
    _savePayload: any
  ) {
    try {
      this.setBlocking(true);
      let session: any = this.getStorageItem('selected_session_id');
      if (session != null) {
        session = this.decryptString(session)
      }
      let _apiHostUrl = this.baseUrl;
      let _masterApiUrl = await this._getConfigData[_masterApiUrlName]['postEndPoint'];
      let _serviceURL = _apiHostUrl + _masterApiUrl;
      let _httpHeaders: any = {};
      let _resultData: any;
      let payload: any = { data: null };
      _httpHeaders['contentType'] = 'application/json; charset=utf-8';
      _httpHeaders['istokenrequired'] = 'N';
      _httpHeaders['clienturl'] = this.hostclientname.split('.')[0];
      if (kindOf(_savePayload) == 'formdata') {
        delete _httpHeaders['contentType'];
        let formData = new FormData();
        for (const [key, value] of _savePayload.entries()) {
          formData.append(key, value)
        }
        let saveData = this.sanitizeJson(JSON.parse(_savePayload.get('data')));
        let _json: any = { ...saveData };

        if (_masterApiUrl != 'fnHqmsUserMobileEmailOtpWrite') {
          _json['session_id'] = session || null;
        }
        let rawJsonString = JSON.stringify({ "p_input": [_json] });
        let encryptedData = this.encryptString(rawJsonString);
        formData.set("data", encryptedData);
        payload = formData;
      } else if (kindOf(_savePayload) == 'object') {
        _savePayload = this.sanitizeJson(_savePayload);
        let _json: any = { ..._savePayload };
        if (_masterApiUrl != 'fnHqmsUserMobileEmailOtpWrite') {
          _json['session_id'] = session || null;
        }
        let rawPayload = { "p_input": [_json] };
        payload['data'] = this.encryptString(JSON.stringify(rawPayload));
      };
      let httpHeaders: any = new HttpHeaders(_httpHeaders);
      let _hqmsApiRsp: any = await firstValueFrom(this._httpClient['post'](_serviceURL, payload, {
        headers: httpHeaders,
        responseType: 'text'
      }));
      _resultData = this.decryptString(_hqmsApiRsp);
      return _resultData;
    } catch (err) {
      this.setBlocking(false);
    } finally {
      this.setBlocking(false);
    }
  }

  showConfirmMessage(message?: string, header?: string, key?: string, acceptLabel?: string, rejectLabel?: string, closable: boolean = true) {
    if (_.trim((message || "")) == "") {
      message = "Please confirm to proceed";
    }
    if (_.trim((header || "")) == "") {
      header = "Are you sure?";
    }
    if (_.trim((key || "")) == "") {
      key = "confirmsubmit";
    }
    let me = this;
    return new Promise(function (resolve, reject) {
      me._confirmService.confirm({
        key: key,
        header: header,
        message: message,
        acceptLabel: acceptLabel,
        rejectLabel: rejectLabel,
        closable: closable,
        accept: async () => {
          resolve(true);
        },
        reject: () => {
          resolve(false);
        }
      });
    });
  }

  getUserInfo(key: any) {
    let getUserInfo = this.getStorageItem("user_info"); let keyValue = null;
    if (getUserInfo) {
      let userInfoBytes = CryptJs.AES.decrypt(getUserInfo, this._getConfigData['tokenSecretKey']);
      let userInfo = JSON.parse(userInfoBytes.toString(CryptJs.enc.Utf8));
      keyValue = userInfo[key];
    }
    return keyValue;
  }

  getOrgId() {
    let parseObj: any = null;
    let orgInfo: any = this.getStorageItem('OrgDetials');
    if (orgInfo != null) {
      parseObj = this.decryptString(orgInfo)['org_id'];
    };
    return parseObj
  }

  getUserId() {
    let parseObj: any = null;
    let userInfo: any = this.getStorageItem('user_info');
    if (userInfo != null) {
      parseObj = this.decryptString(userInfo)['user_id'];
    };
    return parseObj
  }

  getUserName() {
    let parseObj: any = null;
    let userInfo: any = this.getStorageItem('user_info');
    if (userInfo != null) {
      parseObj = this.decryptString(userInfo)['user_name'];
    };
    return parseObj
  }

  getLogoUrl() {
    let userInfo: any = this.getStorageItem('OrgDetials');
    let parseObj: any = null;
    if (userInfo != null) {
      parseObj = this.decryptString(userInfo);
      if (parseObj['logo'].length > 0) {
        if (parseObj['logo'][0]['fileOrImageUrl'] != null) {
          parseObj = parseObj['logo'][0]['fileOrImageUrl'];
        } else {
          parseObj = 'assets/images/logo.png';
        }
      } else {
        parseObj = 'assets/images/logo.png';
      }
    } else {
      parseObj = 'assets/images/logo.png';
    }
    return parseObj;
  }

  clearToaster() {
    this._messageService.clear();
  }

  hqmsToasterService(tstrAttr: any) {
    this._messageService.clear();
    let tsterObj = { severity: tstrAttr.severity, summary: tstrAttr.summary, detail: tstrAttr.detail, }
    this._messageService.add(tsterObj);
  }

  getPageModeContext(pageMode: string, screentext: string) {
    let contextString: any = "";
    switch (pageMode) {
      case "VIEW":
        contextString = `Viewing ${screentext}`;
        break;
      case "EDIT":
        contextString = `Editing ${screentext}`;
        break;
      case "NEW":
        contextString = `New ${screentext}`;
        break;
      default:
        contextString = `${pageMode} ${screentext}`;
    };
    return contextString;
  }

  onDownloadClick(path: string) {
    let templatePath = `assets/${path}`;
    window.open(templatePath, "_blank");
  }

  async  getServerDate(dateType?: string) { // SERVER DATE
    let getDate: any = new Date();
    try {
      let serverDt: any = await this.customGetApiCall('GET', 'serveDateApi',
        {
          action: 'I',
        }, true);
      if (serverDt.status == 200) {
        if (serverDt.data.length > 0) {
          if (dateType == 'DATE') {
            let dtFormat: any = new Date(serverDt.data[0]['server_timestamp']).toLocaleDateString('en-CA');
            getDate = dtFormat;
          } else {
            getDate = new Date(serverDt.data[0]['server_timestamp'])
          }
        }
      };
    } catch (e) {
      getDate = new Date();
    };
    return getDate;
  }

  kpiStatus(ctrl: string) {
    let assignColor: string = "";
    switch (ctrl) {
      case "Compliance":
        assignColor = 'text-success';
        break;
      case "Non Compliance":
        assignColor = 'text-danger';
        break;
      case "Partial Compliance":
        assignColor = 'text-warning';
        break;
    };
    return assignColor;
  }

  recordStatus(ctrl: string) {
    let assignColor: string = "";
    switch (ctrl) {
      case "Active":
        assignColor = 'text-success';
        break;
      case "Inactive":
        assignColor = 'text-danger';
        break;
    };
    return assignColor;
  }

  showErrorSummary(objError: any) {
    let isErrorExist = false;
    this._errorSummary = "";
    this.getErrorSummary(objError);
    if (this._errorSummary != "") {
      isErrorExist = true;
      this._messageService.add({ key: "errSummary", sticky: true, severity: 'warn', summary: '', detail: this._errorSummary });
    }
    return isErrorExist;
  }

  getErrorSummary(objError: any) {
    let objKeys = Object.keys(objError);
    _.forEach(objKeys, (key) => {
      if (objError[key].constructor === Array) {
        _.forEach(objError[key], (aVal) => {
          this.getErrorSummary(aVal);
        });
      }
      else if (objError[key].constructor === Object) {
        this.getErrorSummary(objError[key]);
      }
      else if (objError[key] != "") {
        this._errorSummary += `<div class="show-toaster-box align-items-center d-flex"><i class='pi pi-exclamation-circle mr-1'></i>${objError[key]}</div>`;
      }
    });
  }

  closeConfirm(): void {
    this._confirmService.close();
  }


  readonly DEFAULT_DATE_FORMAT = 'EEEE, MMM d, yyyy';
  // Date format of Security → Application Setting (appDate pipe). Kept with the login keys so a page refresh
  // keeps it; cleared at logout (auth.service LOGIN_KEYS).
  readonly DATE_FORMAT_KEY = 'date_format';
  readonly dateFormat = signal<string>(this.storedDateFormat());

  setDateFormat(newPattern: string): void {
    const format = newPattern || this.DEFAULT_DATE_FORMAT;
    this.dateFormat.set(format);
    try {
      // same storage as the session (remember me → localStorage, else this tab's sessionStorage)
      const storage = localStorage.getItem('selected_session_id') ? localStorage : sessionStorage;
      storage.setItem(this.DATE_FORMAT_KEY, format);
    } catch (e) { }
  }

  private storedDateFormat(): string {
    try {
      return sessionStorage.getItem('date_format') || localStorage.getItem('date_format') || this.DEFAULT_DATE_FORMAT;
    } catch (e) {
      return this.DEFAULT_DATE_FORMAT;
    }
  }
}
