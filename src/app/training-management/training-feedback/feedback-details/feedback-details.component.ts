import { Location, CommonModule } from '@angular/common';
import { HqmsService } from '../../../services/hqms.service';
import { SharedModule } from '../../../shared/shared.module';
import { Component, Directive, EventEmitter, Input, Output, QueryList, ViewChildren, OnInit, signal, inject, computed } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { DatePipe } from '@angular/common';

interface feedbackDetailTable {
  id: number;
  training_id: any;
  training_schedule_id: any;
  question_text: any;
  answer_text: any;
  fb_dt: any;
  fb_questions: any;
};

export type SortColumn = '';
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
  selector: 'app-feedback-details',
  imports: [CommonModule, FormsModule, NgbdSortableHeader, SelectModule, SharedModule],
  templateUrl: './feedback-details.component.html',
})
export class FeedbackDetailsComponent implements OnInit {
  public intialFilters: any = JSON.stringify({
    question_text: null,
    answer_text: null,
    fb_dt: null,
  });
  public feedbackFilters = signal(JSON.parse(this.intialFilters));
  public feedbackList: any = [];
  public scoreList: any = [];
  public feedbackDateList: any = [];
  public feedbackDetGrid: feedbackDetailTable[] = [];
  public router = inject(Router);
  @ViewChildren(NgbdSortableHeader) headers!: QueryList<NgbdSortableHeader>;
  showFilter = false;
  public copyData: any = [];
  public params: any = {};
  constructor(public _hqms: HqmsService, private activatedRoute: ActivatedRoute, public _datePipe: DatePipe, private location: Location) { }

  onSort({ column, direction }: SortEvent) {
    // resetting other headers
    for (const header of this.headers) {
      if (header.sortable !== column) {
        header.direction = '';
      }
    }
    // sorting data
    if (direction === '' || column === '') {
      this.readOnlyFeedback().fb_questions = this.readOnlyFeedback().fb_questions;
    } else {
      this.readOnlyFeedback().fb_questions = [... this.readOnlyFeedback().fb_questions].sort((a, b) => {
        const res = compare(a[column], b[column]);
        return direction === 'asc' ? res : -res;
      });
    }
  }

  filterToggle() {
    this.showFilter = !this.showFilter;
  }

  public readOnlyFeedback: any = signal({
    "action": "v",
    "training_id": null,
    "training_schedule_id": null,
    "training_name": null,
    "faculty_name": null,
    "mode_of_training": null,
    "venue_name": null,
    "from_dt": null,
    "to_dt": null,
    "status": null,
    "fb_questions": [],
  })

  async ngOnInit() {
    try {
      let state = history.state;
      if (state ?.data) {
        await this.editFeedbackDetail(state['data']['id']);
      };
    } catch (e) { };
  }

  async editFeedbackDetail(training_id: any) {
    try {
      let getFeedbackDetailEdit: any = await this._hqms.customGetApiCall('GET', 'fnTrainingFeedbackListApi',
        {
          "action": "v",
          "training_id": training_id,
        });
      if (getFeedbackDetailEdit.status == 200) {
        let editInfo = getFeedbackDetailEdit['data'];
        if (editInfo.length > 0) {
          editInfo = editInfo[0];
          this.readOnlyFeedback.set({
            "action": "v",
            "training_id": editInfo['training_id'],
            "training_schedule_id": editInfo['training_schedule_id'],
            "training_name": editInfo['training_name'],
            "faculty_name": editInfo['faculty_name'],
            "mode_of_training": editInfo['mode_of_training'],
            "venue_name": editInfo['venue_name'],
            "from_dt": editInfo['from_dt'],
            "to_dt": editInfo['to_dt'],
            "status": editInfo['status'],
            "fb_questions": editInfo['fb_questions'],
          });
        }
      }
    } catch (e) { };
  }

  onFilterClick() {
    let filters = this.feedbackFilters();
    this.feedbackDetGrid = this.copyData.filter((fl: any) => {
      let question_text = !filters.question_text || fl['question_text'] === filters.question_text;
      let answer_text = !filters.answer_text || fl['answer_text'] === filters.answer_text;
      let fb_dt = !filters.fb_dt || fl['fb_dt'] === filters.fb_dt;
      return question_text && answer_text && fb_dt;
    });
  }

  async onFilterClear(event: any) {
    if (event == null) {
      this.feedbackFilters.set(JSON.parse(this.intialFilters));
      this.feedbackDetGrid = [...this.copyData];
    } else {
      this.onFilterClick();
    }
  }


  goBack(): void {
    this.location.back();
  }

}
