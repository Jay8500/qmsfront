import { Directive, Input, ElementRef, Renderer2, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PermissionService } from '../sec-featuers/permission.service';

// Shows the element only when the logged-in user (selected role, user-level rows first) has the access flag
// on this screen, as saved in Security → Access Role / Access User:
//   access_add, access_mod, access_del, access_view, access_qry, access_app, access_exp, access_print,
//   dms_upload, dms_view, dms_download
// Usage: <button appAccess="access_add">New</button>
//        <a appAccess="access_del" appAccessDoc="mou-tracker-dashboard">Delete</a>   (screen named explicitly)
// The flags come from the permission list loaded at login (same list as the side menu and the header search),
// so they also apply after a refresh, Back, or on a sub-page (add / edit / details → its menu screen).
// When the page has no screen of its own, the flags passed by the side menu / search (history.state.data) are used.
@Directive({
  selector: '[appAccess]',
  standalone: true
})
export class AccessDirective implements OnInit {
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);
  private router = inject(Router);
  private permissions = inject(PermissionService);

  @Input('appAccess') accessKey!: string;
  @Input() appAccessDoc?: string;
  private originalDisplay = '';

  async ngOnInit() {
    this.originalDisplay = this.el.nativeElement?.style?.display || '';
    const fromMenu = !!history.state?.['data']?.[this.accessKey];
    this.show(fromMenu);
    try {
      const page = this.appAccessDoc || this.router.url.split(/[?#]/)[0].replace(/^\/+/, '').split('/')[0];
      const allowed = await this.permissions.can(page, this.accessKey);
      this.show(allowed === null ? fromMenu : allowed);
    } catch (e) {
      this.show(fromMenu);
    }
  }

  private show(allowed: boolean) {
    if (allowed) {
      if (this.originalDisplay) this.renderer.setStyle(this.el.nativeElement, 'display', this.originalDisplay);
      else this.renderer.removeStyle(this.el.nativeElement, 'display');
    } else {
      this.renderer.setStyle(this.el.nativeElement, 'display', 'none');
    }
  }
}
