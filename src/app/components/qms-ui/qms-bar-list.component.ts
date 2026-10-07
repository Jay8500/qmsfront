import { Component, computed, input } from '@angular/core';

// Light horizontal bar chart (no chart library): [{label, count}] sorted as given.
// Used for Incident / Risk dashboards so the charts always render (also on phones).
@Component({
  selector: 'qms-bar-list',
  standalone: true,
  template: `
    @if (rows().length) {
    <ul class="bl">
      @for (r of rows(); track r.label) {
      <li>
        <span class="lbl" [title]="r.label">{{ r.label }}</span>
        <span class="bar"><span class="fill" [style.width.%]="r.pct" [style.background]="r.color || color()"></span></span>
        <span class="num">{{ r.count }}</span>
      </li>
      }
    </ul>
    } @else {
    <div class="none">No data</div>
    }
  `,
  styles: [`
    .bl { list-style: none; margin: 0; padding: 0; }
    .bl li { display: grid; grid-template-columns: minmax(90px, 38%) 1fr 34px; align-items: center; gap: 8px; font-size: 12px; margin-bottom: 7px; }
    .lbl { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #3d4b5c; }
    .bar { height: 10px; background: #f1f3f5; border-radius: 6px; overflow: hidden; }
    .fill { display: block; height: 100%; border-radius: 6px; min-width: 2px; }
    .num { text-align: right; font-weight: 600; }
    .none { font-size: 13px; color: #8c959f; padding: 16px 0; text-align: center; }
  `]
})
export class QmsBarListComponent {
  items = input<any[]>([]);
  color = input<string>('#3b6fd8');
  limit = input<number>(8);

  rows = computed(() => {
    const list = (this.items() || []).filter((x: any) => Number(x.count) > 0).slice(0, this.limit());
    const max = Math.max(1, ...list.map((x: any) => Number(x.count)));
    return list.map((x: any) => ({ ...x, pct: Math.round((Number(x.count) / max) * 100) }));
  });
}
