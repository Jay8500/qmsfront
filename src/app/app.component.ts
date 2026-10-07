import { Component, HostListener, Renderer2, inject, OnInit, NgZone, OnDestroy } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { SharedModule } from './shared/shared.module';
import { HqmsService } from "./services/hqms.service";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SharedModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  host: {
    'ngSkipHydration': 'true'
  }
})
export class AppComponent implements OnInit {
  public _hqms = inject(HqmsService);
  title = 'hqms-admin2';
  // Theme mapping
  private themeClasses = {
    'default': '',
    'blue': 'blue-theme',
    'teal': 'teal-theme',
    'green': 'green-theme',
    'orange': 'orange-theme'
  };
  defaultLogo: any = 'assets/images/logo2.png';

  constructor(private router: Router, private renderer: Renderer2, private ngZone: NgZone) {
    this._hqms.setBlocking(false);
  }

  ngOnInit() {
    this._hqms.setBlocking(false);
    this.updateFavicon();
    this.applySavedTheme();
  }

  private applySavedTheme() {
    const savedTheme = localStorage.getItem('selectedTheme') || 'default';
    const themeClass = this.themeClasses[savedTheme as keyof typeof this.themeClasses];

    if (themeClass) {
      document.body.classList.add(themeClass);
    }
  }

  private shouldHideForRoute(): boolean {
    const hiddenRoutes = ['/login'];
    return hiddenRoutes.includes(this.router.url);
  }

  shouldShowHeader(): boolean {
    return !this.shouldHideForRoute();
  }

  shouldShowFooter(): boolean {
    return !this.shouldHideForRoute();
  }

  shouldShowSideMenu(): boolean {
    return !this.shouldHideForRoute();
  }

  updateFavicon() {
    let getHost = window.location;
    if (getHost.hostname != 'localhost') {
      let extractPath = `/${getHost.pathname.split('/')[1]}/`;
      this.defaultLogo = extractPath.concat(this.defaultLogo);
    };
    let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
    if (link) {
      link.href = this.defaultLogo
    } else {
      let newLink: any = document.createElement('link');
      newLink.rel = 'icon';
      newLink.href = this.defaultLogo;
      document.head.appendChild(newLink);
    }
  }

  ngOnDestroy() {
    this._hqms.setBlocking(false);
  }
}
