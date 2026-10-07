import {
  Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, Input, HostListener, ViewChild, OnInit,
  OnDestroy, OnChanges, SimpleChanges
} from '@angular/core';
import { RouterLink, RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { HqmsService } from '../../services/hqms.service';
import { HeaderComponent } from '../header/header.component';

@Component({
  selector: 'app-sidemenu',
  imports: [RouterLink, FormsModule],
  templateUrl: './sidemenu.component.html',
  styleUrl: './sidemenu.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class SidemenuComponent implements OnInit, OnDestroy {
  activeIndex: number | null = null;
  isMenuOpen = false;
  currentRoute: string = '';
  defaultLogo = 'assets/images/logo.png';
  private logoSubscription?: Subscription;
  private dataSub!: Subscription;
  public menuItems: any = [];
  constructor(private router: Router,
    private _hqms: HqmsService, ) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.currentRoute = event.urlAfterRedirects;
        this.closeMenuOnMobile();
      }
    });
  }

  async ngOnInit() {
    //  {
    //     label: 'Dashboard',
    //     icon: 'material-symbols:dashboard-outline-rounded',
    //     route: '/management-dashboard',
    //     isSingle: true,
    //     primeIcon: "pi pi-objects-column"
    //  }


    this.defaultLogo = this._hqms.getLogoUrl()

    this.dataSub = HeaderComponent.dataPipeline$.subscribe({
      next: (data: any) => {
        this.menuItems = data.map((md: any) => ({
          label: md.module_name,
          primeIcon: md.module_icon,
          route: md.module_route,
          isSingle: (md.document_map || []).length == 0,
          submenus: (md.document_map || []).map((dc) => ({
            route: dc.primary_url,
            label: dc.document_name,
            ...dc
          }))
        }));
      }
    })
  }


  ngOnDestroy() {
    if (this.logoSubscription) {
      this.logoSubscription.unsubscribe();
    }
  }


  @ViewChild('menuRef') menuRef!: ElementRef;

  toggleMenuClose(): void {
    this.isMenuOpen = false;
    document.body.classList.remove('body-toggle');
  }

  // Toggle sidemenu
  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
    document.body.classList.toggle('body-toggle', this.isMenuOpen);
  }

  // Close menu on submenu click (mobile only)
  closeMenuOnMobile(): void {
    if (window.innerWidth <= 768) {
      this.isMenuOpen = false;
      document.body.classList.remove('body-toggle');
    }
  }

  toggle(index: number): void {
    this.activeIndex = this.activeIndex === index ? null : index;
  }

  trackByIndex(index: number): number {
    return index;
  }

  // Close menu if clicked outside
  @HostListener('document:click', ['$event'])
  handleClickOutside(event: Event): void {
    if (
      this.isMenuOpen &&
      this.menuRef &&
      !this.menuRef.nativeElement.contains(event.target) &&
      window.innerWidth <= 768
    ) {
      this.closeMenuOnMobile();
    }
  }
}
