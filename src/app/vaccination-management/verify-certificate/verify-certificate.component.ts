import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HqmsService } from '../../services/hqms.service';

// Public page behind the certificate QR code (SRS 2.x2 "Verification Output: Valid / Revoked + summary").
// Route 'verify-certificate/:code' is outside the login layout; the API call is public
// (fnVaccinationCertificateVerify in HQMS_BACKEND/api/security/auth.js PUBLIC_METHODS).
@Component({
  selector: 'app-verify-certificate',
  imports: [CommonModule],
  templateUrl: './verify-certificate.component.html',
  styleUrl: './verify-certificate.component.scss'
})
export class VerifyCertificateComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private _hqms = inject(HqmsService);
  public loading = signal(true);
  public result = signal<any>(null);

  async ngOnInit() {
    try {
      let code = this.route.snapshot.paramMap.get('code') || '';
      let info: any = await this._hqms.customGetApiCall('GET', 'vaccinationCertificateVerifyApi', { "verify_code": code });
      this.result.set(info?.status == 200 ? (info.data?.[0] || { status: 'Not found' }) : { status: 'Error' });
    } catch (e) {
      this.result.set({ status: 'Error' });
    } finally {
      this.loading.set(false);
    }
  }
}
