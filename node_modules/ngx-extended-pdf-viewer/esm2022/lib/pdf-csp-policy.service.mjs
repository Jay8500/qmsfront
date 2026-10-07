import { CSP_NONCE, Inject, Injectable } from '@angular/core';
import * as i0 from "@angular/core";
export class PdfCspPolicyService {
    sanitizer = undefined; // TrustedTypePolicy;
    csp_nonce;
    constructor() { }
    init() {
        if (typeof window === 'undefined') {
            // server-side rendering
            return;
        }
        if (this.sanitizer) {
            // already initialized
            return;
        }
        const ttWindow = globalThis;
        if (ttWindow.trustedTypes) {
            this.sanitizer = ttWindow.trustedTypes.createPolicy('pdf-viewer', {
                createHTML: (input) => input,
                createScriptURL: (input) => input,
            });
        }
    }
    addTrustedCSS(styles, css) {
        if (typeof window === 'undefined') {
            // server-side rendering
            return;
        }
        this.init();
        if (this.sanitizer) {
            styles.textContent = this.sanitizer.createHTML(css);
        }
        else {
            styles.textContent = css;
        }
    }
    addTrustedJavaScript(scripts, css) {
        if (typeof window === 'undefined') {
            // server-side rendering
            return;
        }
        this.init();
        if (this.sanitizer) {
            scripts.src = this.sanitizer.createScriptURL(css);
        }
        else {
            scripts.src = css;
        }
    }
    sanitizeHTML(html) {
        if (typeof window === 'undefined') {
            // server-side rendering
            return '';
        }
        this.init();
        if (this.sanitizer) {
            return this.sanitizer.createHTML(html);
        }
        else {
            return html;
        }
    }
    addTrustedHTML(element, html) {
        if (typeof window === 'undefined') {
            // server-side rendering
            return;
        }
        this.init();
        if (this.sanitizer) {
            element.innerHTML = this.sanitizer.createHTML(html);
        }
        else {
            element.innerHTML = html;
        }
    }
    createTrustedHTML(html) {
        if (typeof window === 'undefined') {
            // server-side rendering
            return;
        }
        this.init();
        if (this.sanitizer) {
            return this.sanitizer.createHTML(html);
        }
        else {
            return html;
        }
    }
    generateTrustedURL(sourcePath) {
        if (typeof window === 'undefined') {
            // server-side rendering
            return;
        }
        this.init();
        if (this.sanitizer) {
            return this.sanitizer.createScriptURL(sourcePath);
        }
        return sourcePath;
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "17.3.12", ngImport: i0, type: PdfCspPolicyService, deps: [], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "17.3.12", ngImport: i0, type: PdfCspPolicyService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "17.3.12", ngImport: i0, type: PdfCspPolicyService, decorators: [{
            type: Injectable,
            args: [{
                    providedIn: 'root',
                }]
        }], ctorParameters: () => [], propDecorators: { csp_nonce: [{
                type: Inject,
                args: [CSP_NONCE]
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGRmLWNzcC1wb2xpY3kuc2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Byb2plY3RzL25neC1leHRlbmRlZC1wZGYtdmlld2VyL3NyYy9saWIvcGRmLWNzcC1wb2xpY3kuc2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRSxVQUFVLEVBQUUsTUFBTSxlQUFlLENBQUM7O0FBTTlELE1BQU0sT0FBTyxtQkFBbUI7SUFDdEIsU0FBUyxHQUFRLFNBQVMsQ0FBQyxDQUFDLHFCQUFxQjtJQUU5QixTQUFTLENBQTRCO0lBRWhFLGdCQUFlLENBQUM7SUFFVCxJQUFJO1FBQ1QsSUFBSSxPQUFPLE1BQU0sS0FBSyxXQUFXLEVBQUU7WUFDakMsd0JBQXdCO1lBQ3hCLE9BQU87U0FDUjtRQUNELElBQUksSUFBSSxDQUFDLFNBQVMsRUFBRTtZQUNsQixzQkFBc0I7WUFDdEIsT0FBTztTQUNSO1FBQ0QsTUFBTSxRQUFRLEdBQUcsVUFBMkMsQ0FBQztRQUM3RCxJQUFJLFFBQVEsQ0FBQyxZQUFZLEVBQUU7WUFDekIsSUFBSSxDQUFDLFNBQVMsR0FBRyxRQUFRLENBQUMsWUFBWSxDQUFDLFlBQVksQ0FBQyxZQUFZLEVBQUU7Z0JBQ2hFLFVBQVUsRUFBRSxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsS0FBSztnQkFDNUIsZUFBZSxFQUFFLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxLQUFLO2FBQ2xDLENBQUMsQ0FBQztTQUNKO0lBQ0gsQ0FBQztJQUVNLGFBQWEsQ0FBQyxNQUFtQixFQUFFLEdBQVc7UUFDbkQsSUFBSSxPQUFPLE1BQU0sS0FBSyxXQUFXLEVBQUU7WUFDakMsd0JBQXdCO1lBQ3hCLE9BQU87U0FDUjtRQUNELElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUNaLElBQUksSUFBSSxDQUFDLFNBQVMsRUFBRTtZQUNsQixNQUFNLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBbUIsQ0FBQztTQUN2RTthQUFNO1lBQ0wsTUFBTSxDQUFDLFdBQVcsR0FBRyxHQUFHLENBQUM7U0FDMUI7SUFDSCxDQUFDO0lBRU0sb0JBQW9CLENBQUMsT0FBMEIsRUFBRSxHQUFXO1FBQ2pFLElBQUksT0FBTyxNQUFNLEtBQUssV0FBVyxFQUFFO1lBQ2pDLHdCQUF3QjtZQUN4QixPQUFPO1NBQ1I7UUFDRCxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDWixJQUFJLElBQUksQ0FBQyxTQUFTLEVBQUU7WUFDbEIsT0FBTyxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLGVBQWUsQ0FBQyxHQUFHLENBQW1CLENBQUM7U0FDckU7YUFBTTtZQUNMLE9BQU8sQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDO1NBQ25CO0lBQ0gsQ0FBQztJQUVNLFlBQVksQ0FBQyxJQUFZO1FBQzlCLElBQUksT0FBTyxNQUFNLEtBQUssV0FBVyxFQUFFO1lBQ2pDLHdCQUF3QjtZQUN4QixPQUFPLEVBQUUsQ0FBQztTQUNYO1FBQ0QsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO1FBQ1osSUFBSSxJQUFJLENBQUMsU0FBUyxFQUFFO1lBQ2xCLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFtQixDQUFDO1NBQzFEO2FBQU07WUFDTCxPQUFPLElBQUksQ0FBQztTQUNiO0lBQ0gsQ0FBQztJQUNNLGNBQWMsQ0FBQyxPQUFvQixFQUFFLElBQVk7UUFDdEQsSUFBSSxPQUFPLE1BQU0sS0FBSyxXQUFXLEVBQUU7WUFDakMsd0JBQXdCO1lBQ3hCLE9BQU87U0FDUjtRQUNELElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUNaLElBQUksSUFBSSxDQUFDLFNBQVMsRUFBRTtZQUNsQixPQUFPLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBbUIsQ0FBQztTQUN2RTthQUFNO1lBQ0wsT0FBTyxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUM7U0FDMUI7SUFDSCxDQUFDO0lBRU0saUJBQWlCLENBQUMsSUFBWTtRQUNuQyxJQUFJLE9BQU8sTUFBTSxLQUFLLFdBQVcsRUFBRTtZQUNqQyx3QkFBd0I7WUFDeEIsT0FBTztTQUNSO1FBQ0QsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO1FBQ1osSUFBSSxJQUFJLENBQUMsU0FBUyxFQUFFO1lBQ2xCLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFtQixDQUFDO1NBQzFEO2FBQU07WUFDTCxPQUFPLElBQUksQ0FBQztTQUNiO0lBQ0gsQ0FBQztJQUVNLGtCQUFrQixDQUFDLFVBQVU7UUFDbEMsSUFBSSxPQUFPLE1BQU0sS0FBSyxXQUFXLEVBQUU7WUFDakMsd0JBQXdCO1lBQ3hCLE9BQU87U0FDUjtRQUNELElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUNaLElBQUksSUFBSSxDQUFDLFNBQVMsRUFBRTtZQUNsQixPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsZUFBZSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1NBQ25EO1FBQ0QsT0FBTyxVQUFVLENBQUM7SUFDcEIsQ0FBQzt3R0FuR1UsbUJBQW1COzRHQUFuQixtQkFBbUIsY0FGbEIsTUFBTTs7NEZBRVAsbUJBQW1CO2tCQUgvQixVQUFVO21CQUFDO29CQUNWLFVBQVUsRUFBRSxNQUFNO2lCQUNuQjt3REFJNEIsU0FBUztzQkFBbkMsTUFBTTt1QkFBQyxTQUFTIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ1NQX05PTkNFLCBJbmplY3QsIEluamVjdGFibGUgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IFRydXN0ZWRUeXBlc1dpbmRvdyB9IGZyb20gJ3RydXN0ZWQtdHlwZXMvbGliJztcblxuQEluamVjdGFibGUoe1xuICBwcm92aWRlZEluOiAncm9vdCcsXG59KVxuZXhwb3J0IGNsYXNzIFBkZkNzcFBvbGljeVNlcnZpY2Uge1xuICBwcml2YXRlIHNhbml0aXplcjogYW55ID0gdW5kZWZpbmVkOyAvLyBUcnVzdGVkVHlwZVBvbGljeTtcblxuICBASW5qZWN0KENTUF9OT05DRSkgcHJpdmF0ZSBjc3Bfbm9uY2U6IHN0cmluZyB8IG51bGwgfCB1bmRlZmluZWQ7XG5cbiAgY29uc3RydWN0b3IoKSB7fVxuXG4gIHB1YmxpYyBpbml0KCkge1xuICAgIGlmICh0eXBlb2Ygd2luZG93ID09PSAndW5kZWZpbmVkJykge1xuICAgICAgLy8gc2VydmVyLXNpZGUgcmVuZGVyaW5nXG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmICh0aGlzLnNhbml0aXplcikge1xuICAgICAgLy8gYWxyZWFkeSBpbml0aWFsaXplZFxuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCB0dFdpbmRvdyA9IGdsb2JhbFRoaXMgYXMgdW5rbm93biBhcyBUcnVzdGVkVHlwZXNXaW5kb3c7XG4gICAgaWYgKHR0V2luZG93LnRydXN0ZWRUeXBlcykge1xuICAgICAgdGhpcy5zYW5pdGl6ZXIgPSB0dFdpbmRvdy50cnVzdGVkVHlwZXMuY3JlYXRlUG9saWN5KCdwZGYtdmlld2VyJywge1xuICAgICAgICBjcmVhdGVIVE1MOiAoaW5wdXQpID0+IGlucHV0LFxuICAgICAgICBjcmVhdGVTY3JpcHRVUkw6IChpbnB1dCkgPT4gaW5wdXQsXG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBwdWJsaWMgYWRkVHJ1c3RlZENTUyhzdHlsZXM6IEhUTUxFbGVtZW50LCBjc3M6IHN0cmluZykge1xuICAgIGlmICh0eXBlb2Ygd2luZG93ID09PSAndW5kZWZpbmVkJykge1xuICAgICAgLy8gc2VydmVyLXNpZGUgcmVuZGVyaW5nXG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuaW5pdCgpO1xuICAgIGlmICh0aGlzLnNhbml0aXplcikge1xuICAgICAgc3R5bGVzLnRleHRDb250ZW50ID0gdGhpcy5zYW5pdGl6ZXIuY3JlYXRlSFRNTChjc3MpIGFzIHVua25vd24gYXMgYW55O1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHlsZXMudGV4dENvbnRlbnQgPSBjc3M7XG4gICAgfVxuICB9XG5cbiAgcHVibGljIGFkZFRydXN0ZWRKYXZhU2NyaXB0KHNjcmlwdHM6IEhUTUxTY3JpcHRFbGVtZW50LCBjc3M6IHN0cmluZykge1xuICAgIGlmICh0eXBlb2Ygd2luZG93ID09PSAndW5kZWZpbmVkJykge1xuICAgICAgLy8gc2VydmVyLXNpZGUgcmVuZGVyaW5nXG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuaW5pdCgpO1xuICAgIGlmICh0aGlzLnNhbml0aXplcikge1xuICAgICAgc2NyaXB0cy5zcmMgPSB0aGlzLnNhbml0aXplci5jcmVhdGVTY3JpcHRVUkwoY3NzKSBhcyB1bmtub3duIGFzIGFueTtcbiAgICB9IGVsc2Uge1xuICAgICAgc2NyaXB0cy5zcmMgPSBjc3M7XG4gICAgfVxuICB9XG5cbiAgcHVibGljIHNhbml0aXplSFRNTChodG1sOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGlmICh0eXBlb2Ygd2luZG93ID09PSAndW5kZWZpbmVkJykge1xuICAgICAgLy8gc2VydmVyLXNpZGUgcmVuZGVyaW5nXG4gICAgICByZXR1cm4gJyc7XG4gICAgfVxuICAgIHRoaXMuaW5pdCgpO1xuICAgIGlmICh0aGlzLnNhbml0aXplcikge1xuICAgICAgcmV0dXJuIHRoaXMuc2FuaXRpemVyLmNyZWF0ZUhUTUwoaHRtbCkgYXMgdW5rbm93biBhcyBhbnk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBodG1sO1xuICAgIH1cbiAgfVxuICBwdWJsaWMgYWRkVHJ1c3RlZEhUTUwoZWxlbWVudDogSFRNTEVsZW1lbnQsIGh0bWw6IHN0cmluZykge1xuICAgIGlmICh0eXBlb2Ygd2luZG93ID09PSAndW5kZWZpbmVkJykge1xuICAgICAgLy8gc2VydmVyLXNpZGUgcmVuZGVyaW5nXG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuaW5pdCgpO1xuICAgIGlmICh0aGlzLnNhbml0aXplcikge1xuICAgICAgZWxlbWVudC5pbm5lckhUTUwgPSB0aGlzLnNhbml0aXplci5jcmVhdGVIVE1MKGh0bWwpIGFzIHVua25vd24gYXMgYW55O1xuICAgIH0gZWxzZSB7XG4gICAgICBlbGVtZW50LmlubmVySFRNTCA9IGh0bWw7XG4gICAgfVxuICB9XG5cbiAgcHVibGljIGNyZWF0ZVRydXN0ZWRIVE1MKGh0bWw6IHN0cmluZykge1xuICAgIGlmICh0eXBlb2Ygd2luZG93ID09PSAndW5kZWZpbmVkJykge1xuICAgICAgLy8gc2VydmVyLXNpZGUgcmVuZGVyaW5nXG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuaW5pdCgpO1xuICAgIGlmICh0aGlzLnNhbml0aXplcikge1xuICAgICAgcmV0dXJuIHRoaXMuc2FuaXRpemVyLmNyZWF0ZUhUTUwoaHRtbCkgYXMgdW5rbm93biBhcyBhbnk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBodG1sO1xuICAgIH1cbiAgfVxuXG4gIHB1YmxpYyBnZW5lcmF0ZVRydXN0ZWRVUkwoc291cmNlUGF0aCkge1xuICAgIGlmICh0eXBlb2Ygd2luZG93ID09PSAndW5kZWZpbmVkJykge1xuICAgICAgLy8gc2VydmVyLXNpZGUgcmVuZGVyaW5nXG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuaW5pdCgpO1xuICAgIGlmICh0aGlzLnNhbml0aXplcikge1xuICAgICAgcmV0dXJuIHRoaXMuc2FuaXRpemVyLmNyZWF0ZVNjcmlwdFVSTChzb3VyY2VQYXRoKTtcbiAgICB9XG4gICAgcmV0dXJuIHNvdXJjZVBhdGg7XG4gIH1cbn1cbiJdfQ==