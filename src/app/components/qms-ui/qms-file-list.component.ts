import { Component, input } from '@angular/core';

// Read-only list of uploaded files (fn_file_list rows; the backend adds fileOrImageUrl).
@Component({
  selector: 'qms-file-list',
  standalone: true,
  template: `
    @if (files()?.length) {
    <ul class="fl" [class.compact]="compact()">
      @for (f of files(); track $index) {
      <li>
        <i class="pi" [class.pi-image]="isImage(f)" [class.pi-file-pdf]="isPdf(f)" [class.pi-file]="!isImage(f) && !isPdf(f)"></i>
        @if (f.fileOrImageUrl) {
        <a [href]="f.fileOrImageUrl" target="_blank" rel="noopener" class="name">{{ f.file_name }}</a>
        } @else {
        <span class="name">{{ f.file_name }}</span>
        }
        @if (!compact()) {
        <small class="meta">{{ size(f.file_size) }}@if (f.uploaded_by) { · {{ f.uploaded_by }} } @if (f.uploaded_at) { · {{ f.uploaded_at }} }</small>
        }
      </li>
      }
    </ul>
    } @else if (!compact()) {
    <div class="none">{{ emptyText() }}</div>
    }
  `,
  styles: [`
    .fl { list-style: none; padding: 0; margin: 4px 0 0; }
    .fl li { display: flex; align-items: center; gap: 6px; font-size: 13px; padding: 5px 8px; border: 1px solid #eef0f2; border-radius: 6px; margin-bottom: 5px; flex-wrap: wrap; }
    .fl.compact li { padding: 2px 6px; font-size: 12px; display: inline-flex; margin-right: 6px; }
    .name { overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
    .meta { color: #8c959f; margin-left: auto; }
    .none { font-size: 13px; color: #8c959f; }
  `]
})
export class QmsFileListComponent {
  files = input<any[]>([]);
  compact = input<boolean>(false);
  emptyText = input<string>('No files');

  isImage(f: any) { return /image|jpe?g|png/i.test(f?.file_type || f?.file_name || ''); }
  isPdf(f: any) { return /pdf/i.test(f?.file_type || f?.file_name || ''); }
  size(n: any) {
    const b = Number(n || 0);
    if (!b) return '';
    return b > 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB';
  }
}
