import { Component, signal, OnInit, inject, ViewChild, NO_ERRORS_SCHEMA } from '@angular/core';
import { Location } from '@angular/common';
import { HqmsService } from '../../services/hqms.service';
import { ImageViewerComponent } from '../../components/imageviewer/imageviewer.component';
import { SharedModule } from '../../shared/shared.module';
@Component({
  selector: 'app-task-assignments-details',
  imports: [SharedModule],
  templateUrl: './task-assignments-details.component.html',
  schemas: [NO_ERRORS_SCHEMA]
})
export class TaskAssignmentsDetailsComponent implements OnInit {
  @ViewChild('imgView') imgView!: ImageViewerComponent;

  public readOnlyTaskAssign: any = signal({
    "action": "I",
    "task_id": null,
    "task_name": null,
    "role": null,
    "assigned_to": null,
    "task_description": null,
    "created_at": null,
    "status": null,
    "action_taken": null,
    "supporting_documents": [],
  })
  constructor(private location: Location, public _hqms: HqmsService, ) { }

  async ngOnInit() {
    try {
      let state = history.state;
      if (state ?.data) {
        await this.editTaskAssign(state['data']['id'])
      };
    } catch (e) { }
  }

  async editTaskAssign(taskId: any) {
    try {
      let getTaskListEdit: any = await this._hqms.customGetApiCall('GET', 'fnTaskApi',
        {
          "task_id": taskId,
        });
      if (getTaskListEdit.status == 200) {
        let editInfo = getTaskListEdit['data'];
        if (editInfo.length > 0) {
          editInfo = editInfo[0];
          let supporting_documents = editInfo['supporting_documents'] != null ? editInfo['supporting_documents'] : [];
          this.readOnlyTaskAssign.set({
            "action": "U",
            "task_id": editInfo.task_id,
            "task_name": editInfo.task_name,
            "role": editInfo.role,
            "assigned_to": editInfo.assigned_to,
            "task_description": editInfo.task_description,
            "created_at": editInfo.created_at,
            "status": editInfo.status,
            "action_taken": editInfo.action_taken,
            "supporting_documents": supporting_documents,
          });
        }
      };
    } catch (e) {
    };
  }

  goBack(): void {
    this.location.back();
  }

  onViewClick(getImageInfo: any) {
    //  getImageInfo['is_viewed'] = !getImageInfo['is_viewed']
    //  this.imgView.showImage(getImageInfo['fileOrImageUrl'], getImageInfo['file_type'], false, true);
  }

}
