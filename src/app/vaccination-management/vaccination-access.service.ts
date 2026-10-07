import { Injectable, signal, Signal, WritableSignal } from '@angular/core';
import { HeaderComponent } from '../layout/header/header.component';

// Access flags of one document (screen) for the logged-in user and selected role.
// Comes from the same permission list the side menu uses (fnSidebarGet → fn_user_permissions_list),
// so buttons stay correct even when the page is opened by Back / navigateByUrl (no history.state).
export interface DocAccess {
  access_add: boolean;
  access_mod: boolean;
  access_del: boolean;
  access_view: boolean;
  access_qry: boolean;
  access_app: boolean;
  access_exp: boolean;
  access_print: boolean;
  dms_upload: boolean;
  dms_view: boolean;
  dms_download: boolean;
}

const NO_ACCESS: DocAccess = {
  access_add: false,
  access_mod: false,
  access_del: false,
  access_view: false,
  access_qry: false,
  access_app: false,
  access_exp: false,
  access_print: false,
  dms_upload: false,
  dms_view: false,
  dms_download: false,
};

@Injectable({
  providedIn: 'root',
})
export class VaccinationAccessService {
  private accessByUrl = new Map<string, WritableSignal<DocAccess>>();

  constructor() {
    HeaderComponent.dataPipeline$.subscribe((modules: any[]) => {
      const docs: any[] = [];
      (modules || []).forEach((md: any) => (md.document_map || []).forEach((dc: any) => docs.push(dc)));
      this.accessByUrl.forEach((sig, url) => sig.set(this.toAccess(docs.find((dc) => dc.primary_url === url))));
      this.latestDocs = docs;
    });
  }

  private latestDocs: any[] = [];

  // primaryUrl = document_master.primary_url of the menu document, e.g. 'vaccine-master-dashboard'
  access(primaryUrl: string): Signal<DocAccess> {
    if (!this.accessByUrl.has(primaryUrl)) {
      const doc = this.latestDocs.find((dc) => dc.primary_url === primaryUrl);
      this.accessByUrl.set(primaryUrl, signal<DocAccess>(this.toAccess(doc)));
    }
    return this.accessByUrl.get(primaryUrl)!.asReadonly();
  }

  private toAccess(doc: any): DocAccess {
    if (!doc) return { ...NO_ACCESS };
    return {
      access_add: !!doc.access_add,
      access_mod: !!doc.access_mod,
      access_del: !!doc.access_del,
      access_view: !!doc.access_view,
      access_qry: !!doc.access_qry,
      access_app: !!doc.access_app,
      access_exp: !!doc.access_exp,
      access_print: !!doc.access_print,
      dms_upload: !!doc.dms_upload,
      dms_view: !!doc.dms_view,
      dms_download: !!doc.dms_download,
    };
  }
}
