import { Injectable, inject } from '@angular/core';
import { HqmsService } from '../services/hqms.service';

// Vaccination certificate (SRS 2.x2): the backend makes the PDF with a verification QR
// (fnVaccinationCertificateGet → fn_vaccination_certificate_get + pdfmake) and returns it as base64.
@Injectable({
  providedIn: 'root',
})
export class VaccinationCertificateService {
  private _hqms = inject(HqmsService);

  // A certificate exists once at least one dose is completed ("1/3", "2/2", …).
  hasCompletedDose(dosage: any): boolean {
    let match = /^\s*(\d+)\s*\//.exec(String(dosage ?? ''));
    return !!match && Number(match[1]) > 0;
  }

  // vaccinationAdministrationId: any dose row of the employee × vaccine; myRecords: opened from My Vaccines.
  async download(vaccinationAdministrationId: any, myRecords: boolean): Promise<void> {
    let params: any = {
      "vaccination_administration_id": vaccinationAdministrationId,
      "verify_base_url": window.location.origin,
    };
    if (myRecords) params['my_records'] = 'Y';
    let info: any = await this._hqms.customGetApiCall('GET', 'vaccinationCertificateApi', params);
    let cert = info?.status == 200 ? info.data?.[0] : null;
    if (!cert?.pdf_base64) {
      this._hqms.hqmsToasterService({
        severity: 'warn',
        summary: 'Vaccination Certificate',
        detail: info?.message || 'The certificate could not be created.',
      });
      return;
    }
    let bytes = Uint8Array.from(atob(cert.pdf_base64), (ch) => ch.charCodeAt(0));
    let url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
    let link = document.createElement('a');
    link.href = url;
    link.download = cert.file_name || 'Vaccination_Certificate.pdf';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    this._hqms.hqmsToasterService({
      severity: 'success',
      summary: 'Vaccination Certificate',
      detail: `${cert.certificate_no} downloaded.`,
    });
  }
}
