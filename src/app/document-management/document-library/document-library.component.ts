import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { HqmsService } from '../../services/hqms.service';
import { SharedModule } from '../../shared/shared.module';

// Document Library (SRS 2.3 Step 4): approved SOPs, policies and manuals for every logged-in user,
// read only. Only the latest approved version is listed. Who sees what and who may download is
// decided in the database (fn_document_library_get); each open / download is logged.
@Component({
  selector: 'app-document-library',
  imports: [SharedModule],
  templateUrl: './document-library.component.html',
  styleUrl: './document-library.component.scss'
})
export class DocumentLibraryComponent implements OnInit {
  public _hqms = inject(HqmsService);

  public documents = signal<any[]>([]);
  public loaded = signal(false);
  public departmentList: any[] = [];
  public documentTypeList: any[] = [];
  public filters = signal<any>({ department_id: null, document_type_id: null, search: '' });

  public filtered = computed(() => {
    const f = this.filters();
    const text = (f.search || '').trim().toLowerCase();
    return this.documents().filter((d: any) =>
      (!f.department_id || d.department_id == f.department_id) &&
      (!f.document_type_id || d.document_type_id == f.document_type_id) &&
      (!text || [d.document_name, d.document_no, d.purpose, d.department_name, d.document_type]
        .some((v: any) => (v || '').toLowerCase().includes(text))));
  });

  async ngOnInit() {
    try {
      const info: any = await this._hqms.customGetApiCall('GET', 'commanEntityValuesGetApi', { "entity_codes": "DOCUMENTTYPE" });
      if (info?.status == 200) {
        this.documentTypeList = info.data['entities']['DOCUMENTTYPE']['values'].map((ele: any) => ({
          label: ele.display_value, value: ele.entity_value_id
        }));
      }
      const dept: any = await this._hqms.customGetApiCall('GET', 'fnTemplateListGet', { "flag": 'DEPARTMENT' });
      if (dept?.status == 200) {
        this.departmentList = dept.data.map((ele: any) => ({ label: ele.department_name, value: ele.department_id }));
      }
    } catch (e) { }
    await this.load();
  }

  async load() {
    try {
      const res: any = await this._hqms.customGetApiCall('GET', 'documentLibraryApi', {});
      this.documents.set(res?.status == 200 && Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      this.documents.set([]);
    } finally {
      this.loaded.set(true);
    }
  }

  setFilter(key: string, value: any) {
    this.filters.set({ ...this.filters(), [key]: value });
  }

  clearFilters() {
    this.filters.set({ department_id: null, document_type_id: null, search: '' });
  }

  // View: logged, then opened in a new tab
  async onView(doc: any, file: any) {
    await this.log(doc, file, 'VIEW');
    if (file?.fileOrImageUrl) window.open(file.fileOrImageUrl, '_blank');
  }

  // Download: allowed only when the database says so (checked again on the server)
  async onDownload(doc: any, file: any) {
    if (!doc.can_download) return;
    const ok = await this.log(doc, file, 'DOWNLOAD');
    if (!ok || !file?.fileOrImageUrl) return;
    const a = document.createElement('a');
    a.href = file.fileOrImageUrl;
    a.download = file.file_name || 'document';
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  private async log(doc: any, file: any, action: 'VIEW' | 'DOWNLOAD') {
    const res: any = await this._hqms.customSaveApiCall('POST', 'documentLibraryApi', {
      document_id: doc.document_id, file_id: file?.file_id || null, log_action: action
    });
    if (res?.status == 200) {
      if (action == 'VIEW') doc.view_count = (doc.view_count || 0) + 1;
      return true;
    }
    this._hqms.hqmsToasterService({ severity: 'warn', summary: 'Document Library', detail: res?.message || 'Not allowed' });
    return false;
  }
}
