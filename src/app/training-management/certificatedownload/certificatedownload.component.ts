import { Component, Directive, EventEmitter, signal,Input, Output,OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Location } from '@angular/common';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { SharedModule } from '../../shared/shared.module';
interface auditTable {
  id: number;
  nomineeName: string;
  emp: string;
  date: string;
  role: string;
  status: string;
}

import { HqmsService } from '../../services/hqms.service';
export type SortColumn = keyof auditTable | '';
export type SortDirection = 'asc' | 'desc' | '';
const rotate: { [key: string]: SortDirection } = { asc: 'desc', desc: '', '': 'asc' };
const compare = (v1: string | number, v2: string | number) => (v1 < v2 ? -1 : v1 > v2 ? 1 : 0);
export interface SortEvent {
  column: SortColumn;
  direction: SortDirection;
}
@Directive({
  selector: 'th[sortable]',
  standalone: true,
  host: {
    '[class.asc]': 'direction === "asc"',
    '[class.desc]': 'direction === "desc"',
    '(click)': 'rotate()',
  },
})
export class NgbdSortableHeader {
  @Input() sortable: SortColumn = '';
  @Input() direction: SortDirection = '';
  @Output() sort = new EventEmitter<SortEvent>();

  rotate() {
    this.direction = rotate[this.direction];
    this.sort.emit({ column: this.sortable, direction: this.direction });
  }
}
@Component({
  selector: 'app-certificatedownload',
    imports: [ CommonModule, FormsModule, SelectModule, SharedModule],
  templateUrl: './certificatedownload.component.html'
})
export class CertificatedownloadComponent implements OnInit {
  public selectedTraining = signal(null);
  constructor(private location: Location,  public _hqms: HqmsService) {}

    goBack(): void {
      this.location.back();
    }

    showFilter = false;

    filterToggle() {
      this.showFilter = !this.showFilter;
    }

  public trainingList:any= [];
  public selectedTrainingInfo = {
   training_name : null,
   mode_of_training_name : null,
   faculty_type_name : null,
   cover_images : [],
   description : null,
   faculty_name : null,
   designation_name : null,
   certificate_url : null,
  };
  public clearInfo = JSON.stringify(this.selectedTrainingInfo);

  async onTrainingSelect(value: any) {
    if (value != null) {
      await this.getSelectedTraining(value);
    }
  }

  async  ngOnInit(){
     try{
      let trainingList: any = await this._hqms.customGetApiCall('GET', 'fnTemplateListGet',
        {
          "flag": "CT"
        });
       if (trainingList.status == 200) {
        this.trainingList = trainingList.data.map((ele: any) => ({
          label: ele.training_name,
          value: ele.training_id,
          faculty_name: ele.faculty_name,
          faculty_id: ele.faculty_id,
          mode_of_training_id: ele.mode_of_training_id
        }))
      };

     }catch(e){

     }
  }

  public params:any = {};
  public dataExists:any = [];
  async getSelectedTraining(trainingId: any) {
    try {
       this.selectedTrainingInfo = JSON.parse(this.clearInfo)
      let info: any = await this._hqms.customGetApiCall('GET', 'fnTrainingCertificateApi',
        {
          "training_id": trainingId
        });
        this.params = {
          "training_id": trainingId
        }
      if (info.status == 200) {
        let editInfo = info['data'];
        this.dataExists = info['data'];
        if (editInfo.length > 0) {
          editInfo = editInfo[0];
          let cover_images = editInfo['cover_image_file_ids'].length > 0 ? editInfo['cover_image_file_ids'] : [];
          this.selectedTrainingInfo['training_name'] = editInfo['training_name'];
          this.selectedTrainingInfo['mode_of_training_name'] = editInfo['mode_of_training_name'];
          this.selectedTrainingInfo['cover_images'] = cover_images
          this.selectedTrainingInfo['description'] = editInfo['description'];
          this.selectedTrainingInfo['faculty_name'] = editInfo['faculty_name'];
          this.selectedTrainingInfo['designation_name'] = editInfo['designation_name'];
          this.selectedTrainingInfo['certificate_url'] = editInfo['certificate_url'];
        }
      };
    } catch (e) { };
  }

  onSubmitClick(){

  }

  onClearClick(){
      this.selectedTraining.set(null);
      this.selectedTrainingInfo = JSON.parse(this.clearInfo)
  }
}

