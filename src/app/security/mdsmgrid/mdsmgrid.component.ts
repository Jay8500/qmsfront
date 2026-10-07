import {
  Component,
  Directive,
  EventEmitter,
  Input,
  Output,
  QueryList,
  ViewChildren,
  OnInit,
  inject,
  signal,
  computed,
} from "@angular/core";
import {Validations} from '../../validations'
import { RouterLink, Router, ActivatedRoute } from "@angular/router";
import { CommonModule } from "@angular/common";
import { HqmsService } from "../../services/hqms.service";
import { SharedModule } from "../../shared/shared.module";
import {
  moveItemInArray,
  CdkDragDrop,
  DragDropModule
} from "@angular/cdk/drag-drop";
interface moduleTable {
  id: number;
  module_id: any;
  module_name: any;
  module_route: any;
  module_icon: any;
  status: any;
}
interface documentTable {
  id: number;
  document_id: any;
  document_name: any;
  description: any;
  primary_url: any;
  secondary_url: any;
  status: any;
}
export type SortColumn = keyof moduleTable | keyof documentTable | "";
export type SortDirection = "asc" | "desc" | "";
const rotate: { [key: string]: SortDirection } = {
  asc: "desc",
  desc: "",
  "": "asc",
};
const compare = (v1: string | number, v2: string | number) =>
  v1 < v2 ? -1 : v1 > v2 ? 1 : 0;
export interface SortEvent {
  column: SortColumn;
  direction: SortDirection;
}
@Directive({
  selector: "th[sortable]",
  standalone: true,
  host: {
    "[class.asc]": 'direction === "asc"',
    "[class.desc]": 'direction === "desc"',
    "(click)": "rotate()",
  },
})
export class NgbdSortableHeader {
  @Input() sortable: SortColumn = "";
  @Input() direction: SortDirection = "";
  @Output() sort = new EventEmitter<SortEvent>();
  rotate() {
    this.direction = rotate[this.direction];
    this.sort.emit({ column: this.sortable, direction: this.direction });
  }
}
@Component({
  selector: "app-mdsmgrid",
  imports: [CommonModule, NgbdSortableHeader, SharedModule, DragDropModule],
  templateUrl: "./mdsmgrid.component.html",
})
export class MdsmgridComponent implements OnInit {
  @ViewChildren(NgbdSortableHeader) headers!: QueryList<NgbdSortableHeader>;
  public intialFilters: any = JSON.stringify({
    module_name: null,
    status: null,
  });
  public intialFilters1: any = JSON.stringify({
    document_name: null,
    primary_url: null,
    status: null,
  });
  public moduleFilters = signal({ ...JSON.parse(this.intialFilters) });
  public documentFilters = signal({ ...JSON.parse(this.intialFilters1) });
  public FORM_NAME="CREATEMODOC"
  public validations=inject(Validations);
  public moduleNameList: any = [];
  public docNameList: any = [];
  public statusList: any = [];
  public statusDocList: any = [];
  public docList: any = [];
  public mdsbGrid: any = [];
  public docGrid: any = [];
  public router = inject(Router);
  public _tabText = "MODULE";
  showFilter = false;
  isEnableMdle: boolean = false;
  public copyData: any = [];
  public docpyData: any = [];

  public createMdle: any = {
    module_id: null,
    id: this.mdsbGrid.length + 1,
    sec_order: this.mdsbGrid.length + 1,
    module_name: null,
    is_active: true,
    is_edit_click: true,
    is_selected: true,
    sub_module: [],
    isNew: true,
    module_icon: null,
    module_route: null,
  };

  public createDoc: any = {
    document_id: null,
    id: this.docGrid.length + 1,
    sec_order: this.docGrid.length + 1,
    document_name: null,
    is_active: true,
    is_edit_click: true,
    is_selected: true,
    isNew: true,
    primary_url: null,
    secondary_url: null,
    description: null,
  };
  public errMsg1:any={
    module_name:'',
    module_route:''
  }
  public clrErr = JSON.stringify(this.errMsg1);
  onGetErrMsg1(ctrl:any){
    let result=this.validations.validateField(this.FORM_NAME,ctrl,this.createMdle[ctrl]);
    this.errMsg1[ctrl]=result?.message|| ''
  }

  public errMsg2:any={
    document_name:'',
    primary_url:''
  }
  public clrErr1 = JSON.stringify(this.errMsg2);
  onGetErrMsg2(ctrl:any){
    let result=this.validations.validateField(this.FORM_NAME,ctrl,this.createDoc[ctrl]);
    this.errMsg2[ctrl]=result?.message|| ''
  }

 
  public clearMdle = JSON.stringify(this.createMdle);
  public clearDoc = JSON.stringify(this.createDoc);
  public selectedEdit: any = null;

  constructor(
    private _hqms: HqmsService,
    private activatedRoute: ActivatedRoute,
  ) {}

  async ngOnInit() {
    try {
      await this.getMdlstInfo();
      await this.getDocInfo();
    } catch (e) {}
  }

  onSort({ column, direction }: SortEvent) {
    // resetting other headers
    for (const header of this.headers) {
      if (header.sortable !== column) {``
        header.direction = "";
      }
    }
    // sorting data
    if (direction === "" || column === "") {
      this.mdsbGrid = this.mdsbGrid;
    } else {
      this.mdsbGrid = [...this.mdsbGrid].sort((a, b) => {
        const res = compare(a[column], b[column]);
        return direction === "asc" ? res : -res;
      });
    }
  }

  onSort1({ column, direction }: SortEvent) {
    // resetting other headers
    for (const header of this.headers) {
      if (header.sortable !== column) {
        header.direction = "";
      }
    }
    // sorting data
    if (direction === "" || column === "") {
      this.docGrid = this.docGrid;
    } else {
      this.docGrid = [...this.docGrid].sort((a, b) => {
        const res = compare(a[column], b[column]);
        return direction === "asc" ? res : -res;
      });
    }
  }

  filterToggle() {
    this.showFilter = !this.showFilter;
  }
  public params: any = {};

  async getMdlstInfo() {
    try {
      let { pageNo, pageSize } = this.pageNators();
      this.mdsbGrid = [];
      let totalCnt = 0;
      let flags: any = {};
      this.params = { ...flags };
      let info: any = await this._hqms.customGetApiCall(
        "GET",
        "fnModuleApi",
        flags,
      );
      if (info.status == 200) {

        let sourcedData: any = [];
        info.data[0]["module"].forEach((prp: any, index: number) => {
          let crtInfo: any = {
            id: index + 1,
            module_id: prp.module_id,
            module_name: prp.module_name,
            module_route: prp.module_route,
            module_icon: prp.module_icon,
            status: prp.status,
            is_edit_click: false,
            is_selected: false,
            is_active: true,
            isNew: false,
            is_written: false,
            sec_order: prp.sec_order,
          };
          sourcedData.push(crtInfo);
        });
        this.mdsbGrid = [...sourcedData];
        this.copyData = [...sourcedData];
        this.moduleNameList = [
          ...new Set(sourcedData.map((item: any) => item.module_name)),
        ].map((name, index) => ({
          label: name,
          value: name,
        }));
        this.statusList = [
          ...new Set(sourcedData.map((item: any) => item.status)),
        ].map((name, index) => ({
          label: name,
          value: name,
        }));
      }
    } catch (e) {
    }
  }

  onFilterClick() {
    let filters = this.moduleFilters();
    this.mdsbGrid = this.copyData.filter((fl: any) => {
      let module_name =
        !filters.module_name || fl["module_name"] === filters.module_name;
      let status = !filters.status || fl["status"] === filters.status;
      return module_name && status;
    });
  }

  async onFilterClear(event: any) {
    if (event == null) {
      this.moduleFilters.set(JSON.parse(this.intialFilters));
      this.mdsbGrid = [...this.copyData];
    } else {
      this.onFilterClick();
    }
  }

  async getDocInfo() {
    try {
      let { pageNo, pageSize } = this.pageNators();
      this.docGrid = [];
      let totalCnt = 0;
      let flags: any = {};
      this.params = { ...flags };
      let info: any = await this._hqms.customGetApiCall(
        "GET",
        "fnDocApi",
        flags,
      );
      if (info.status == 200) {
        let sourcedData: any = [];
        info.data.forEach((prp: any, index: number) => {
          let crtInfo: any = {
            id: index + 1,
            document_id: prp.document_id,
            document_name: prp.document_name,
            primary_url: prp.primary_url,
            secondary_url: prp.secondary_url,
            description: prp.description,
            created_by: prp.created_by,
            created_at: prp.created_at,
            updated_by: prp.updated_by,
            updated_at: prp.updated_at,
            status: prp.status,
            is_edit_click: false,
            is_selected: false,
            is_active: prp.is_active,
            isNew: false,
            is_written: false,
            sec_order: prp.sec_order,
          };
          sourcedData.push(crtInfo);
        });
        this.docGrid = [...sourcedData];
        this.docpyData = [...sourcedData];
        this.docNameList = [
          ...new Set(sourcedData.map((item: any) => item.document_name)),
        ].map((name, index) => ({
          label: name,
          value: name,
        }));
        this.statusDocList = [
          ...new Set(sourcedData.map((item: any) => item.status)),
        ].map((name, index) => ({
          label: name,
          value: name,
        }));
      }
    } catch (e) {}
  }

  onFilterClick1() {
    let filters = this.documentFilters();
    this.docGrid = this.docpyData.filter((fl: any) => {
      let document_name =
        !filters.document_name || fl["document_name"] === filters.document_name;
      let status = !filters.status || fl["status"] === filters.status;
      return document_name && status;
    });
  }

  async onFilterClear1(event: any) {
    if (event == null) {
      this.documentFilters.set(JSON.parse(this.intialFilters1));
      this.docGrid = [...this.docpyData];
    } else {
      this.onFilterClick1();
    }
  }

  onPageRoute(pageMode: string, moduleSubMod: any) {
    try {
      this.router.navigate(["/module"], {
        relativeTo: this.activatedRoute,
        state: {
          data: {
            mode: pageMode,
            id: moduleSubMod == null ? null : moduleSubMod.module_id,
          },
        },
      });
    } catch (e) {}
  }

  onPageRoute1(pageMode: string, docD: any) {
    try {
      this.router.navigate(["/document"], {
        relativeTo: this.activatedRoute,
        state: {
          data: {
            mode: pageMode,
            id: docD == null ? null : docD.document_id,
          },
        },
      });
    } catch (e) {}
  }

  public pageNators = signal({
    pageNo: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
  });

  readonly pageNumbers = computed(() => {
    let pages = this.pageNators().totalItems;
    return Array.from({ length: pages }, (_, i) => i + 1);
  });

  async changePage(newDisplayPage: number) {
    this.pageNators.update((prev) => ({ ...prev, pageNo: newDisplayPage }));
    await this.mdsbGrid();
    await this.docGrid();
  }

  async trashMdle(mdle: any) {
    mdle["is_active"] = false;
    this.createMdle = mdle;
    await this.onSave();
  }

  async trashDoc(doc: any) {
    doc["is_active"] = false;
    this.createDoc = doc;
    await this.onSaveDoc();
  }

  onAddNewMdle(oldMdle: any) {
    this.mdsbGrid.forEach((ele) => (ele.is_selected = false));
    let newMdle = {};
    if (oldMdle != null) {
      newMdle = JSON.parse(JSON.stringify(oldMdle));
    } else {
      newMdle["status"] = "Active";
    }
    newMdle["id"] = this.mdsbGrid.length + 1;
    newMdle["module_id"] = null;
    newMdle["module_name"] = null;
    newMdle["sec_order"] = this.mdsbGrid.length + 1;
    newMdle["is_active"] = true;
    newMdle["is_edit_click"] = true;
    newMdle["is_selected"] = true;
    newMdle["sub_module"] = [];
    newMdle["isNew"] = true;
    newMdle["module_icon"] = null;
    newMdle["module_route"] = null;
    this.mdsbGrid.push(newMdle);
  }

  onClear() {
    this.createMdle = JSON.parse(this.clearMdle);
    this.isEnableMdle = false;
    this.errMsg1 = JSON.parse(this.clrErr)
  }

  onAddNewDoc(oldDoc: any) {
    this.docGrid.forEach((ele) => (ele.is_selected = false));
    let newDoc = {};
    if (oldDoc != null) {
      newDoc = JSON.parse(JSON.stringify(oldDoc));
    } else {
      newDoc["status"] = "Active";
    }
    newDoc["id"] = this.docGrid.length + 1;
    newDoc["document_id"] = null;
    newDoc["document_name"] = null;
    newDoc["sec_order"] = this.docGrid.length + 1;
    newDoc["is_active"] = true;
    newDoc["is_edit_click"] = true;
    newDoc["is_selected"] = true;
    newDoc["isNew"] = true;
    newDoc["primary_url"] = null;
    newDoc["secondary_url"] = null;
    newDoc["description"] = null;
    this.docGrid.push(newDoc);
  }

  onClear1() {
    this.createDoc = JSON.parse(this.clearDoc);
    this.isEnableMdle = false;
    this.errMsg2 = JSON.parse(this.clrErr1)
  }

  async onSave() {
    try {
      let newMdle: any = JSON.parse(JSON.stringify(this.createMdle));
      Object.keys(this.errMsg1).forEach((ctrl)=>{this.onGetErrMsg1(ctrl)});
      let isValid1=this._hqms.showErrorSummary(this.errMsg1);
      if(isValid1){
        this._hqms.hqmsToasterService({
          key: "moduleName",
          severity: "warn",
          summary: "Module",
          detail: "Check the errors",
        });
        return;
      }
      delete newMdle.id;
      delete newMdle.isNew;
      delete newMdle.is_edit_click;
      delete newMdle.is_selected;
      delete newMdle.status;

      let mdm = {
        module: [newMdle],
        action: newMdle.module_id == null ? "I" : newMdle.is_active ? "U" : "D",
      };
      let cnfrmMdlSub = await this._hqms.showConfirmMessage();
      if (cnfrmMdlSub) {
        var saveResult: any = await this._hqms.customSaveApiCall(
          "POST",
          "fnModuleApi",
          mdm,
        );
        if (saveResult["status"] == 200) {
          this._hqms.hqmsToasterService({
            key: "mdl",
            severity: "success",
            summary: "Module",
            detail: saveResult["message"],
          });
          await this.ngOnInit();
        } else if (saveResult["status"] == 204 || saveResult["status"] == 501) {
          this._hqms.hqmsToasterService({
            key: "mdl",
            severity: "warn",
            summary: "Module",
            detail: saveResult["message"],
          });
        }
        this.isEnableMdle = false;
      }
    } catch (e) {}
  }

  async dropMdle(event: CdkDragDrop<any[]>) {
    moveItemInArray(this.mdsbGrid, event.previousIndex, event.currentIndex);
    this.mdsbGrid.forEach((item: any, ind: number) => {
      item.sec_order = ind + 1;
    });
    let mdm = {
      module: JSON.parse(JSON.stringify(this.mdsbGrid)),
      action: "U",
    };
    var saveResult: any = await this._hqms.customSaveApiCall(
      "POST",
      "fnModuleApi",
      mdm,
    );
    if (saveResult.status == 200) {
      this._hqms.hqmsToasterService({
        key: "mdl",
        severity: "success",
        summary: "Module",
        detail: saveResult.message,
      });
    } else if (saveResult.status == 204 || saveResult.status == 501) {
      this._hqms.hqmsToasterService({
        key: "mdl",
        severity: "warn",
        summary: "Module",
        detail: saveResult.message,
      });
    }
  }

  onEditClick(mdle: any) {
    this._tabText = "Module";
    this.isEnableMdle = true;
    this.createMdle = {
      module_id: mdle.module_id,
      id: this.mdsbGrid.length + 1,
      sec_order: this.mdsbGrid.length + 1,
      module_name: mdle.module_name,
      is_active: true,
      is_edit_click: true,
      is_selected: true,
      sub_module: [],
      isNew: true,
      module_icon: null,
      module_route: mdle.module_route,
    };
  }

  onCloseCP() {
    this.createMdle = JSON.parse(this.clearMdle);
    
  }

  async onSaveDoc() {
    try {
      Object.keys(this.errMsg2).forEach((ctrl)=>{this.onGetErrMsg2(ctrl)});
      let isValid2=this._hqms.showErrorSummary(this.errMsg2);
      if(isValid2){
        this._hqms.hqmsToasterService({
          key: "moduleName",
          severity: "warn",
          summary: "Document",
          detail: "Check the errors",
        });
        return;
      }

      let newDoc: any = JSON.parse(JSON.stringify(this.createDoc));
      delete newDoc.id;
      delete newDoc.isNew;
      delete newDoc.is_edit_click;
      delete newDoc.is_selected;
      delete newDoc.status;

      let mdm = {
        document: [newDoc],
        action: newDoc.document_id == null ? "I" : newDoc.is_active ? "U" : "D",
      };
      let cnfrmMdlSub = await this._hqms.showConfirmMessage();
      if (cnfrmMdlSub) {
        var saveResult: any = await this._hqms.customSaveApiCall(
          "POST",
          "fnDocApi",
          mdm,
        );
        if (saveResult["status"] == 200) {
          this._hqms.hqmsToasterService({
            key: "doc",
            severity: "success",
            summary: "Document",
            detail: saveResult["message"],
          });
          await this.ngOnInit();
        } else if (saveResult["status"] == 204 || saveResult["status"] == 501) {
          this._hqms.hqmsToasterService({
            key: "doc",
            severity: "warn",
            summary: "Document",
            detail: saveResult["message"],
          });
        }
        this.isEnableMdle = false;
      }
    } catch (e) {}
  }


  onEditClickDoc(doc: any) {
    this._tabText = "Document";
    this.isEnableMdle = true;
    this.createDoc = {
      document_id: doc.document_id,
      id: this.docGrid.length + 1,
      sec_order: this.docGrid.length + 1,
      document_name: doc.document_name,
      is_active: true,
      is_edit_click: true,
      is_selected: true,
      isNew: true,
      primary_url: doc.primary_url,
      secondary_url: doc.secondary_url,
      description: doc.description,
    };
  }

  onCloseCPDoc() {
    this.createDoc = JSON.parse(this.clearDoc);
  }
  activeTab:string = 'tab1';
}
