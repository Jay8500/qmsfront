import { Component, QueryList, signal, ViewChildren, OnInit, inject, computed } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { HqmsService } from '../../services/hqms.service';
import { FormsModule } from '@angular/forms';
import {
  moveItemInArray,
  CdkDragDrop,
  DragDropModule
} from "@angular/cdk/drag-drop";
import * as _ from 'lodash';
@Component({
  selector: 'app-mdmapping',
  imports: [FormsModule,SharedModule,    DragDropModule  ],
  templateUrl: './mdmapping.component.html',
  styleUrl: './mdmapping.component.scss',
})
export class MdmappingComponent implements OnInit{
  public moduleID: any = [];
  public subModuleID: any = [];
  public documentID: any = [];
  public modulesList: any = [];
  public moduleGridCols: any = [{ "field": "moduleName", "header": "Module" }];
  public subModulesList: any = [];
  public subModuleGridCols: any = [{ "field": "moduleName", "header": "Sub Module" }];
  public documentList: any = [];
  public documentGridCols: any = [{ "field": "documentName", "header": "Document" }];
  public selectedModuleId:any = null;
  public selectedSubModule:any= null;
  public unmappedDocuments: any = [];
  public targetDocumments: any = [];
  public subDocExists: boolean = false;

  constructor(public _hqms: HqmsService, ) { }

  async ngOnInit(){
    let info: any = await this._hqms.customGetApiCall('GET', 'fnModuleApi',{});
    if (info.status == 200) {
        let sourcedData: any = [];
        info.data[0]['module'].forEach((prp: any, index: number) => {
          let crtInfo: any = {
            moduleId: prp.module_id,
            moduleName: prp.module_name,
            module_icon: prp.module_icon,
          };
          sourcedData.push(crtInfo);
        });
        this.modulesList = [...sourcedData];
      };
  }
  public selectedModule:any = {
    mdName : 'Selected',
    icon : ''
  };

  async onModuleClick(moduleRow: any) {
    this.documentList = [];
    this.documentID = [];
    try {
      if (moduleRow['data']['moduleId'] != null) {
        this.selectedModule['mdName'] = moduleRow['data']['moduleName'];
        this.selectedModule['icon'] = moduleRow['data']['module_icon'];
        let subModDoc: any = await this._hqms.customGetApiCall('GET', 'fnModDocApi', {"module_id": moduleRow['data']['moduleId']});
        if (subModDoc.status == 200) {
            this.documentList = subModDoc.data || [];
            this.unmappedDocuments = _.filter(subModDoc.data || [], { is_mod_doc_mapped: false });
            this.targetDocumments = _.filter(subModDoc.data || [], { is_mod_doc_mapped: true });
            if (this.targetDocumments.length > 0) {
              _.forEach(this.targetDocumments, (doc, index) => {
                doc.docSelected = (doc.is_mod_doc_mapped ==true && doc.is_active);
                doc.prevMapped = doc.is_mod_doc_mapped;
                if (doc.docSelected) {
                  this.documentID.push(doc.document_id);
                };
              });
            };
            this.subDocExists = false;
        };
      } else {
        this.documentList = [];
      };
    } catch (e) {
    };
  }

  async onSubmitClick() {
    try {
      let cnfrmMpng = await this._hqms.showConfirmMessage();
      if (cnfrmMpng) {
        let masterData: any = [];
        _.forEach(this.targetDocumments, (doc, index) => {
          let mappedDoc = {
            "module_document_map_id": (doc.module_document_map_id !=null ? doc.module_document_map_id : null),
            "module_id": this.selectedModuleId['moduleId'],
            "sub_module_id": null,
            "document_id": doc.document_id,
            "display_order": index + 1,
            "is_active": doc.is_active , // active inactive
          };
          masterData.push(mappedDoc);
        });
        let unmappedDocMovedDocuments = _.filter(this.unmappedDocuments,
        (mappedMoveToUnmappedDoc, mMTUDIndex) => mappedMoveToUnmappedDoc.module_document_map_id != null);
        if (unmappedDocMovedDocuments.length > 0) {
          _.forEach(unmappedDocMovedDocuments, (doc, index) => {
            if (unmappedDocMovedDocuments[index].docSelected || unmappedDocMovedDocuments[index].prevMapped ) {
              let mappedDoc = {
                "module_document_map_id": doc.module_document_map_id,
                "module_id": this.selectedModuleId['moduleId'],
                "sub_module_id":null,
                "document_id": doc.document_id,
                "display_order": null,
                "is_active": doc.is_active , // active inactive
              };
              masterData.push(mappedDoc);
            };
          });
        };
        let mapped_data = {
           "action" : "I",
           "module_document_map" : masterData
        };
       var saveResult: any = await this._hqms.customSaveApiCall("POST", "fnModDocApi", mapped_data);
        if (saveResult.status == 200) {
          this._hqms.hqmsToasterService({
            key: 'rle',
            severity: 'success',
            summary: 'Module/ Document Mapping',
            detail: saveResult.message,
          });
          this.onClearClick();
        } else if (saveResult.status == 204 || saveResult.status == 501) {
          this._hqms.hqmsToasterService({
            key: 'rle',
            severity: 'warn',
            summary: 'Module/ Document Mapping',
            detail: saveResult.message,
          });
        }
      }
    } catch (e) {
    }
  }

  onClearClick() {
    try {
      this.selectedModuleId = null;
      this.subDocExists = false;
      this.subModulesList = [];
      this.documentList = [];
      this.unmappedDocuments = [];
      this.targetDocumments = [];
      this.moduleID = [];
      this.subModuleID = [];
      this.documentID = [];
    } catch (e) {
    };
  }
  
  dropTarget(event: CdkDragDrop<any[]>): void {
    moveItemInArray(
      this.targetDocumments,
      event.previousIndex,
      event.currentIndex,
    );
  }
}
