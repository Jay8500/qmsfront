import { Pipe, PipeTransform, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HqmsService } from '../services/hqms.service';

// Shows a date in the format chosen in Security → Application Setting (loaded at login; default 'EEEE, MMM d, yyyy').
// Accepts ISO values ('2026-10-07T12:52:18') and the text the database functions return
// ('07-10-2026', '07-10-2026 13:14', '07-10-2026 13:14:05', also with '/').
// {{ row.created_at | appDate }}          date (and time when the chosen format has time)
// {{ row.expiry_date | appDate:'date' }}  date only (time part of the format left out)
@Pipe({
  name: 'appDate',
  standalone: true,
  pure: false
})
export class AppDatePipe implements PipeTransform {
  private settings = inject(HqmsService);
  private datePipe = new DatePipe('en-US');
  private lastKey = '';
  private lastResult = '-';

  transform(value: string | Date | null | undefined, part: 'date' | 'datetime' = 'datetime'): string {
    if (value === null || value === undefined || value === '') return '-';
    let format = this.settings.dateFormat();
    const key = String(value instanceof Date ? value.getTime() : value) + '|' + format + '|' + part;
    if (key === this.lastKey) return this.lastResult;

    if (part === 'date') {
      format = format.replace(/[\s,]*[Hh]{1,2}:mm(:ss)?(\s*a)?/g, '').trim() || format;
    }
    const date = this.toDate(value);
    let result: string;
    try {
      result = date ? (this.datePipe.transform(date, format) || '-') : String(value);
    } catch (e) {
      result = String(value);
    }
    this.lastKey = key;
    this.lastResult = result;
    return result;
  }

  private toDate(value: string | Date): Date | null {
    if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
    const text = String(value).trim();
    // DD-MM-YYYY or DD/MM/YYYY, optional HH:MM[:SS]  (local time, as the database already converts it)
    const m = text.match(/^(\d{2})[-/](\d{2})[-/](\d{4})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/);
    if (m) {
      const d = new Date(+m[3], +m[2] - 1, +m[1], +(m[4] || 0), +(m[5] || 0), +(m[6] || 0));
      return isNaN(d.getTime()) ? null : d;
    }
    // ISO / YYYY-MM-DD[ HH:MM[:SS]]
    if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
      const d = new Date(text.length === 10 ? text + 'T00:00:00' : text.replace(' ', 'T'));
      return isNaN(d.getTime()) ? null : d;
    }
    return null;
  }
}
