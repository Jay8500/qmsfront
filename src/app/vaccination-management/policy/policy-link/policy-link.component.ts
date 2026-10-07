import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VaccinationPolicyService } from '../vaccination-policy.service';

// "View Policy" link (SRS 2.x4): the current Vaccination Policy version, read-only.
// Shows nothing when no policy has been uploaded yet.
@Component({
  selector: 'app-vaccination-policy-link',
  imports: [CommonModule],
  template: `
    @if(policy.current(); as cur){
      @if(policy.currentUrl()){
      <a [href]="policy.currentUrl()" target="_blank" class="small text-nowrap" [title]="cur.title + ' — effective ' + cur.effective_from">
        <i class="pi pi-book"></i> View Policy v{{ cur.version }}</a>
      } @else {
      <span class="small hint text-nowrap"><i class="pi pi-book"></i> Policy v{{ cur.version }}</span>
      }
    }
  `,
})
export class PolicyLinkComponent implements OnInit {
  public policy = inject(VaccinationPolicyService);

  async ngOnInit() {
    await this.policy.load();
  }
}
