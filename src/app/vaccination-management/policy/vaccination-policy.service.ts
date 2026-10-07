import { Injectable, inject, signal } from '@angular/core';
import { HqmsService } from '../../services/hqms.service';

// Vaccination Policy / SOP versions (SRS 2.x4) — vaccinationPolicyApi → fn_vaccination_policy_get / _write.
@Injectable({
  providedIn: 'root',
})
export class VaccinationPolicyService {
  private _hqms = inject(HqmsService);
  private loaded = false;
  public versions = signal<any[]>([]);
  // Latest active version effective today (null when none uploaded yet).
  public current = signal<any>(null);

  async load(force = false): Promise<void> {
    if (this.loaded && !force) return;
    try {
      let info: any = await this._hqms.customGetApiCall('GET', 'vaccinationPolicyApi', {});
      let rows: any[] = info?.status == 200 ? info.data : [];
      this.versions.set(rows);
      this.current.set(rows.find((r) => r.is_current) || null);
      this.loaded = true;
    } catch (e) { }
  }

  // URL of the current policy file (the backend adds fileOrImageUrl to file objects).
  currentUrl(): string | null {
    return this.current()?.files?.[0]?.fileOrImageUrl || null;
  }
}
