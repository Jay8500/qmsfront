import { Component, Directive, EventEmitter, inject,Input, Output, QueryList, ViewChildren } from '@angular/core';
import { DecimalPipe,DatePipe,Location, CommonModule } from '@angular/common';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../../shared/shared.module';
import { HqmsService } from '../../../services/hqms.service';
import { Validations } from '../../../validations';

interface auditTable {
  role: string;
  remarks: string;
  feedback: string;
}
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
  selector: 'app-safety-details-capa-review',
  imports: [ CommonModule, FormsModule, NgbdSortableHeader, NgbTooltipModule,SharedModule],
  templateUrl: './safety-details-capa-review.component.html',
  styleUrl: './safety-details-capa-review.component.scss', providers: [DatePipe]
})
export class SafetyDetailsCapaReviewComponent {
  private validations = inject(Validations);
  public router: any = inject(Router);
   @ViewChildren(NgbdSortableHeader) headers!: QueryList<NgbdSortableHeader>;
  readonly FORM_NAME = 'sftcltreCapa';

  constructor(private location: Location,
    public _hqms: HqmsService,
    private activatedRoute: ActivatedRoute,
    public _datePipe: DatePipe
  ) { }



  goBack(): void {
    this.router.navigateByUrl('/safety-dashboard');
  }

       showFilter = false;

       filterToggle() {
         this.showFilter = !this.showFilter;
       }


         onSort({ column, direction }: SortEvent) {
         // resetting other headers
         for (const header of this.headers) {
           if (header.sortable !== column) {
             header.direction = '';
           }
         }

         // sorting countries
         if (direction === '' || column === '') {
          this.srvyDetails['remarks'] = this.srvyDetails['remarks'];
         } else {
           this.srvyDetails['remarks'] = [...this.srvyDetails['remarks']].sort((a, b) => {
             const res = compare(a[column], b[column]);
             return direction === 'asc' ? res : -res;
           });
         }
       }

       showRemarks = false;

        toggleRemarks() {
          this.showRemarks = !this.showRemarks;
        }

        public srvyDetails :any= {
            "to_date":null,
            "question": [ ],
            "from_date": null,
            "survey_name": null,
            "target_role": null,
            "total_partcipants": null,
            "remarks":[],
            "is_agree":false,
            "reviewer_comments":null,
            capa : []
        };
  public errorMsg: any = { reviewer_comments: '' };

  onGetErrorMsgs(ctrl: any) {
    const result = this.validations.validateField(this.FORM_NAME, ctrl, this.srvyDetails[ctrl]);
    this.errorMsg[ctrl] = result?.message || '';
  }


        async ngOnInit() {
             let state = history.state;
             await this.getDetails(state['data']['id'])
        }

       async getDetails(ctrl){
          try{
            let details: any = await this._hqms.customGetApiCall('GET', 'fnSCviewCapaApi',
            {
            "survey_id": ctrl
            });
          if (details.status == 200) {
            let editInfo = details['data'][0];
            this.srvyDetails = {...editInfo};
          }
          }catch(e){};
        }

       async onSubmitClick(){
            try{
            Object.keys(this.errorMsg).forEach((ctrl) => this.onGetErrorMsgs(ctrl));
            let isValid = this._hqms.showErrorSummary(this.errorMsg);
                  if (isValid) {
        this._hqms.hqmsToasterService({
          key: 'capa',
          severity: 'warn',
          summary: 'Safety Culture Capa Review',
          detail: 'Check the errors',
        });
        return;
      };
            let surveyCapa = JSON.parse(JSON.stringify(this.srvyDetails));
            let writeCapa = {
              action : "K",
              survey_id : surveyCapa['survey_id'],
              is_agree : surveyCapa['is_agree'],
              reviewer_comments : surveyCapa['reviewer_comments'],
              capa_id : surveyCapa['capa'][0]['capa_id']
            };
              let cnfrn = await this._hqms.showConfirmMessage();
              if (cnfrn) {
                var saveResult: any = await this._hqms.customSaveApiCall("POST", "fnSCviewCapaApi", writeCapa);
                if (saveResult.status == 200) {
                  this._hqms.hqmsToasterService({
                    key: 'capa',
                    severity: 'success',
                    summary: 'Review Capa',
                    detail: saveResult.message,
                  });
                  this.onClearClick();
                  this.router.navigateByUrl('/safety-dashboard');
                } else if (saveResult.status == 204 || saveResult.status == 501) {
                  this._hqms.hqmsToasterService({
                    key: 'capa',
                    severity: 'warn',
                    summary: 'Review Capa',
                    detail: saveResult.message,
                  });
                }
              };
            }catch(e){};
        }

       async onClearClick(){

        }
}
