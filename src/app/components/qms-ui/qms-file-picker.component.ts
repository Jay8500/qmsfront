import { Component, input, output, signal } from '@angular/core';
import { HqmsService } from '../../services/hqms.service';

// File picker with limits (count, size, types). Keeps the chosen File objects and the metadata the backend
// expects ({file_name, file_type, file_size, storage_path: null, is_active, upload_file_name}).
// The parent appends picker.files() to FormData ("file" parts) and sends picker.meta() in the payload.
@Component({
  selector: 'qms-file-picker',
  standalone: true,
  template: `
    <div class="fp">
      <label class="btn btn-light btn-sm mb-0" [class.disabled]="disabled() || meta().length >= max()">
        <i class="pi pi-upload me-1"></i>{{ label() }}
        <input type="file" hidden [attr.accept]="accept()" [disabled]="disabled() || meta().length >= max()"
          (change)="onPick($event)" multiple>
      </label>
      <small class="hint">{{ hint() }} · {{ meta().length }}/{{ max() }}</small>
    </div>
    @if (meta().length) {
    <div class="chips">
      @for (m of meta(); track m.file_name; let i = $index) {
      <span class="chip"><i class="pi pi-file me-1"></i>{{ m.file_name }}
        @if (!disabled()) { <a href="javascript:;" (click)="remove(i)" title="Remove"><i class="pi pi-times-circle"></i></a> }
      </span>
      }
    </div>
    }
  `,
  styles: [`
    .fp { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .hint { color: #8c959f; font-size: 11px; }
    .chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
    .chip { font-size: 12px; border: 1px solid #d0d7de; border-radius: 14px; padding: 2px 10px; display: inline-flex; align-items: center; gap: 4px; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .disabled { pointer-events: none; opacity: .6; }
  `]
})
export class QmsFilePickerComponent {
  max = input<number>(5);
  maxSizeMb = input<number>(5);
  accept = input<string>('.pdf,.jpg,.jpeg,.png,.xlsx,.xls,.doc,.docx');
  label = input<string>('Attach files');
  hint = input<string>('PDF, JPG, PNG, XLSX, DOC up to 5 MB each');
  disabled = input<boolean>(false);
  changed = output<number>();

  public meta = signal<any[]>([]);
  public files = signal<File[]>([]);

  constructor(private _hqms: HqmsService) { }

  onPick(ev: any) {
    const picked: File[] = Array.from(ev?.target?.files || []);
    const allowed = (this.accept() || '').split(',').map((x) => x.trim().toLowerCase()).filter(Boolean);
    for (const f of picked) {
      const ext = '.' + (f.name.split('.').pop() || '').toLowerCase();
      if (this.meta().length >= this.max()) {
        this.warn(`Up to ${this.max()} files`);
        break;
      }
      if (allowed.length && !allowed.includes(ext)) { this.warn(`${f.name}: file type not allowed`); continue; }
      if (f.size > this.maxSizeMb() * 1048576) { this.warn(`${f.name}: larger than ${this.maxSizeMb()} MB`); continue; }
      if (this.meta().some((m) => m.file_name === f.name)) { this.warn(`${f.name}: already added`); continue; }
      this.meta.update((m) => [...m, {
        file_id: null, file_name: f.name, file_type: f.type || ext.substring(1), file_size: f.size,
        storage_path: null, is_active: true, upload_file_name: f.name
      }]);
      this.files.update((x) => [...x, f]);
    }
    ev.target.value = '';
    this.changed.emit(this.meta().length);
  }

  remove(i: number) {
    this.meta.update((m) => m.filter((_, k) => k !== i));
    this.files.update((x) => x.filter((_, k) => k !== i));
    this.changed.emit(this.meta().length);
  }

  clear() {
    this.meta.set([]);
    this.files.set([]);
  }

  // Adds the chosen files to a FormData as "file" parts (the backend upload convention)
  appendTo(form: FormData) {
    this.files().forEach((f) => form.append('file', f, f.name));
  }

  private warn(detail: string) {
    this._hqms.hqmsToasterService({ severity: 'warn', summary: 'Files', detail });
  }
}
