import { Component, inject, OnDestroy, OnInit } from "@angular/core";
import {
  RouterOutlet,
  Router
} from "@angular/router";
import { SharedModule } from "../shared/shared.module";
import { HqmsService } from "../services/hqms.service";
import { CommonModule } from "@angular/common";
import { HeaderComponent } from "./header/header.component";
import { SidemenuComponent } from "./sidemenu/sidemenu.component";
import { FooterComponent } from "./footer/footer.component";
import { NgbProgressbarModule } from "@ng-bootstrap/ng-bootstrap";
import { SecurityService } from "../sec-featuers/security.service";
import { IdleService } from "../sec-featuers/idle.service";

@Component({
  selector: "app-layout",
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    SharedModule,
    HeaderComponent,
    SidemenuComponent,
    FooterComponent,
    NgbProgressbarModule,
  ],
  templateUrl: "./layout.component.html",
  styleUrl: "./layout.component.scss",
})
export class LayoutComponent implements OnInit, OnDestroy {
  public isBlockUI = true;
  public _hqms = inject(HqmsService);
  public secService = inject(SecurityService);
  public idleSrvce = inject(IdleService);
  public isDuplicate = false;
  private getDecryptedUserInfo() : any{
      let info: any = this.secService.getUserId();
      return this._hqms.decryptString(info) || {};
  }
  constructor(private router: Router) {
    // this.router.events.subscribe((event) => {
    //   if (event instanceof NavigationStart) {
    //     this._hqms.setBlocking(true);
    //   }
    //   if (event instanceof NavigationEnd || event instanceof NavigationError) {
    //     setTimeout(() => this._hqms.setBlocking(false), 800);
    //   }
    // });
  }

  async ngOnInit() {
    this._hqms.setBlocking(false);
    const userInfo = this.getDecryptedUserInfo();
    const userId = userInfo['user_id'];
    if (userId) {
      // One user per browser: a different user signed in in this browser while this tab was asleep / closed.
      const activeUser = this.secService.getActiveUser();
      if (activeUser && activeUser.user_id != userId) {
        this.isDuplicate = true;
        await this.secService.switchedOut(userId);
        return;
      }

      const onTakeover = () => {
        this.secService.clearTabTokens();
        this._hqms.hqmsToasterService({
          key: "lyt",
          severity: "warn",
          summary: "Session Error",
          detail: "Logged out: session opened in another tab",
        });
        this.isDuplicate = false;
        setTimeout(() => this.router.navigate(["/login"]), 1200);
      };
      let claimed = this.secService.claimTab(userId, onTakeover);

      // Browser closed and opened again within a few seconds ("Remember me"): the old claim is
      // still fresh but no open tab holds it any more, so take it over instead of logging out.
      if (!claimed && !(await this.secService.isTabClaimAlive(userId))) {
        this.secService.forceReleaseTab(userId);
        claimed = this.secService.claimTab(userId, onTakeover);
      }

      if (!claimed) {
        this.secService.clearTabTokens();
        sessionStorage.setItem("logout_reason", "duplicate");
        this.router.navigate(["/login"]);
        this.isDuplicate = true;
        return;
      }

      // Mark this user as the browser's user (e.g. a "Remember me" login reopened) and leave
      // as soon as a different user signs in in another tab.
      if (!activeUser) this.secService.setActiveUser({ user_id: userId, display_name: userInfo['user_display_name'] || '' });
      this.secService.watchActiveUser(userId, () => {
        this.isDuplicate = true;
        this.secService.switchedOut(userId);
      });
    }
    this.secService.startIdleWatch(
      () => this.showIdleWarning(),
      () => this.doIdleLogout(),
    );
    this.startSessionWatch();
  }

  // Every 30 s a silent check that this session is still active. If the same user logged in
  // from another browser / device (SESSION_SUPERSEDED) or the session ended, the interceptor
  // logs this browser out and the login page shows the reason — even if the user is not clicking.
  private sessionWatch: any = null;
  private startSessionWatch() {
    clearInterval(this.sessionWatch);
    this.sessionWatch = setInterval(() => {
      if (!this.secService.getAccessToken()) return;
      this._hqms.customGetApiCall('GET', 'sessionStatusApi', {}, false, true).catch(() => { });
    }, 30000);
  }

  private async showIdleWarning() {

    const stay = await this._hqms.showConfirmMessage(
      `You have been inactive for ${this.idleSrvce.idleLabel}. You will be logged out in ${this.idleSrvce.graceSeconds} seconds.`,
      "Session Timeout",
      "confirmsubmit",
      "Stay logged in",
      "Logout now",
      false,
    );
    if (stay) this.secService.resumeIdleWatch();
    else this.doIdleLogout();
  }

  // Ends the session on the server first, then clears storage and goes to login (SecurityService.logout).
  async doIdleLogout() {
    this.isDuplicate = false;
    await this.secService.logout("idle");
  }

  ngOnDestroy() {
    this.secService.stopIdleWatch();
    this.secService.stopWatchingActiveUser();
    clearInterval(this.sessionWatch);
  }
}
