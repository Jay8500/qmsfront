import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { HqmsService } from '../../services/hqms.service';
@Component({
    selector: 'app-theme-brand',
    // imports: [RouterLink],
    templateUrl: './theme-brand.component.html',
    styleUrl: './theme-brand.component.scss'
})
export class ThemeBrandComponent implements OnInit {

  selectedTheme: string = 'default';
  private currentThemeClass: string = '';

  // Map theme names to body classes
  private themeClasses = {
    'default': '',
    'blue': 'blue-theme',
    'teal': 'teal-theme',
    'green': 'green-theme',
    'orange': 'orange-theme'
  };

  constructor(private router: Router, private location: Location,public _hqms: HqmsService) {}

  goBack(): void {
    this.location.back();
  }

  async ngOnInit() {
    let info: any = await this._hqms.customGetApiCall('GET','fnSettingsApi',{ });
     if (info.status == 200) {
      let savedTheme = info.data[0]['theme'];
      if(savedTheme == null){
       savedTheme = localStorage.getItem('selectedTheme');
      };
      if (savedTheme) {
        this.selectedTheme = savedTheme;
        this.applyThemeToBody(this.selectedTheme);
      }
    }else{
      let lclStrage = localStorage.getItem('selectedTheme');
      if (lclStrage) {
        this.selectedTheme = lclStrage;
        this.applyThemeToBody(this.selectedTheme);
      }
         // If nothing saved, infer from body class if present
        const body = document.body;
        if (body.classList.contains('blue-theme')) {
          this.selectedTheme = 'blue';
        } else if (body.classList.contains('teal-theme')) {
          this.selectedTheme = 'teal';
        } else if (body.classList.contains('green-theme')) {
          this.selectedTheme = 'green';
        } else if (body.classList.contains('orange-theme')) {
          this.selectedTheme = 'orange';
        } else {
          this.selectedTheme = 'default';
        }
        this.applyThemeToBody(this.selectedTheme);

    }
  }

  /**
   * Apply theme class to body element
   */
  private applyThemeToBody(theme: string) {
    const body = document.body;
    const themeClass = this.themeClasses[theme as keyof typeof this.themeClasses];

    // Remove previous theme class if exists
    if (this.currentThemeClass) {
      body.classList.remove(this.currentThemeClass);
    }

    // Add new theme class
    if (themeClass) {
      body.classList.add(themeClass);
      this.currentThemeClass = themeClass;
    } else {
      this.currentThemeClass = '';
    }
  }

  /**
   * Select a theme
   */
  selectTheme(theme: string) {
    this.selectedTheme = theme;
    this.applyThemeToBody(theme);
  }

  async saveTheme() {
      let saveResult: any = await this._hqms.customSaveApiCall("POST", "fnSettingsApi",  {
        "action": "I",
        "theme" : this.selectedTheme
      });
      if (saveResult.status == 200) {
        localStorage.setItem('selectedTheme', this.selectedTheme);
        await this.ngOnInit();
      };
      this.applyThemeToBody(this.selectedTheme);
  }

}
