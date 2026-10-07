import { Injectable } from '@angular/core';
import { HqmsService } from '../services/hqms.service';
import { ALWAYS_ALLOWED, SUB_PAGE_PARENTS } from './route-access';

// Permission list of the logged-in user / selected role (fnSidebarGet → fn_user_permissions_list),
// loaded once per session and shared by the header (menu) and the route guard.
@Injectable({ providedIn: 'root' })
export class PermissionService {
  private modules$: Promise<any[]> | null = null;
  private allowed = new Set<string>();
  // primary_url → that document's row (access_add, access_mod, ... as saved in Access Role / Access User)
  private docs = new Map<string, any>();

  constructor(private _hqms: HqmsService) { }

  // Modules with their document_map (same shape the header and side menu already use).
  load(force = false): Promise<any[]> {
    if (!this.modules$ || force) {
      this.modules$ = this._hqms.customGetApiCall('GET', 'fnSidebarGet', {})
        .then((info: any) => {
          const modules = info?.status == 200 && Array.isArray(info.data) ? info.data : [];
          this.allowed = new Set<string>();
          this.docs = new Map<string, any>();
          modules.forEach((md: any) => {
            if (md.module_route) this.allowed.add(this.clean(md.module_route));
            (md.document_map || []).forEach((dc: any) => {
              if (!dc.primary_url) return;
              this.allowed.add(this.clean(dc.primary_url));
              this.docs.set(this.clean(dc.primary_url), dc);
            });
          });
          if (modules.length == 0) this.modules$ = null; // try again next time (e.g. call failed)
          return modules;
        })
        .catch(() => {
          this.modules$ = null;
          return [];
        });
    }
    return this.modules$;
  }

  // path = first URL segment, e.g. 'vaccine-add'
  async isAllowed(path: string): Promise<boolean> {
    if (!path || ALWAYS_ALLOWED.includes(path)) return true;
    await this.load();
    if (this.allowed.has(path)) return true;
    return (SUB_PAGE_PARENTS[path] || []).some((parent) => this.allowed.has(parent));
  }

  // One access flag (access_add, access_mod, access_del, access_view, access_qry, access_app, access_exp,
  // access_print, dms_upload, dms_view, dms_download) for a page.
  // path = a menu URL (its document) or a sub-page (allowed when any of its parent menu documents has the flag).
  // Returns null when the page has no document of its own (e.g. a module page) - the caller decides then.
  async can(path: string, key: string): Promise<boolean | null> {
    await this.load();
    const p = this.clean(path || '');
    const own = this.docs.get(p);
    if (own) return !!own[key];
    const parents = (SUB_PAGE_PARENTS[p] || []).map((parent) => this.docs.get(parent)).filter((dc) => !!dc);
    if (parents.length) return parents.some((dc) => !!dc[key]);
    return null;
  }

  // Where "Stay" / a denied start page goes: first module of the menu (same rule as the header).
  async homeUrl(): Promise<string> {
    const modules = await this.load();
    const first = modules[0];
    return '/' + this.clean(first?.module_route || first?.document_map?.[0]?.primary_url || 'management-dashboard');
  }

  clear(): void {
    this.modules$ = null;
    this.allowed.clear();
    this.docs.clear();
  }

  private clean(url: string): string {
    return String(url).replace(/^\/+/, '').split(/[?#]/)[0];
  }
}
