import { Component, input } from '@angular/core';
import { QmsFileListComponent } from './qms-file-list.component';

// Status timeline (who / when / what / remarks / files) for Incident and Risk details.
// Items: {action, from_status, to_status, remarks, by, on, files[], score?}
@Component({
  selector: 'qms-timeline',
  standalone: true,
  imports: [QmsFileListComponent],
  template: `
    <ol class="tl">
      @for (t of items(); track $index) {
      <li>
        <span class="dot" [attr.data-a]="t.action"></span>
        <div class="body">
          <div class="head">
            <strong>{{ label(t.action) }}</strong>
            @if (t.to_status && t.to_status !== t.from_status && t.to_status !== label(t.action)) {
            <span class="arrow">→ {{ t.to_status }}</span>
            }
            <span class="when">{{ t.on }} · {{ t.by }}</span>
          </div>
          @if (t.remarks) { <div class="remarks">{{ t.remarks }}</div> }
          @if (t.files?.length) { <qms-file-list [files]="t.files" [compact]="true" /> }
        </div>
      </li>
      } @empty {
      <li class="none">No history yet</li>
      }
    </ol>
  `,
  styles: [`
    .tl { list-style: none; margin: 0; padding: 0 0 0 6px; }
    .tl li { position: relative; padding: 0 0 14px 22px; border-left: 2px solid #e5e7eb; }
    .tl li:last-child { border-left-color: transparent; }
    .tl li.none { border: none; color: #57606a; padding-left: 0; }
    .dot { position: absolute; left: -7px; top: 3px; width: 12px; height: 12px; border-radius: 50%; background: #3b6fd8; border: 2px solid #fff; box-shadow: 0 0 0 1px #3b6fd8; }
    .dot[data-a='CLOSE'], .dot[data-a='REVIEW'] { background: #2da44e; box-shadow: 0 0 0 1px #2da44e; }
    .dot[data-a='REOPEN'], .dot[data-a='ESCALATE'], .dot[data-a='AUTO_CREATE'], .dot[data-a='INCIDENT_LINK'] { background: #d73a49; box-shadow: 0 0 0 1px #d73a49; }
    .head { display: flex; flex-wrap: wrap; gap: 6px; align-items: baseline; font-size: 13px; }
    .arrow { color: #57606a; }
    .when { margin-left: auto; font-size: 11px; color: #8c959f; }
    .remarks { font-size: 13px; white-space: pre-line; margin-top: 2px; }
    @media (max-width: 576px) { .when { margin-left: 0; width: 100%; } }
  `]
})
export class QmsTimelineComponent {
  items = input<any[]>([]);

  private names: Record<string, string> = {
    REPORT: 'Reported', DRAFT: 'Saved as draft', EDIT: 'Edited', ASSIGN: 'Assigned', REASSIGN: 'Reassigned',
    INVESTIGATE: 'Investigation', HOD_REVIEW: 'HOD review', CLOSE: 'Closed', COMMENT: 'Comment', ESCALATE: 'Escalated to risk',
    AUTO_CREATE: 'Auto-created', SCORE: 'Department scoring', REVIEW: 'QT review', REOPEN: 'Reopened', AMEND: 'Amended',
    LINK: 'Linked item', LINK_STATUS: 'Linked item status', INCIDENT_LINK: 'Incident linked'
  };

  label(a: string) {
    return this.names[a] || (a ? a.charAt(0) + a.slice(1).toLowerCase().replace(/_/g, ' ') : 'Update');
  }
}
