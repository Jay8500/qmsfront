import { Injectable, effect, signal } from '@angular/core';
import { getVersionSuffix, pdfDefaultOptions } from './options/pdf-default-options';
import * as i0 from "@angular/core";
export class PDFNotificationService {
    // this event is fired when the pdf.js library has been loaded and objects like PDFApplication are available
    onPDFJSInitSignal = signal(undefined);
    pdfjsVersion = getVersionSuffix(pdfDefaultOptions.assetsFolder);
    constructor() {
        effect(() => {
            if (this.onPDFJSInitSignal()) {
                this.pdfjsVersion = getVersionSuffix(pdfDefaultOptions.assetsFolder);
            }
        });
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "17.3.12", ngImport: i0, type: PDFNotificationService, deps: [], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "17.3.12", ngImport: i0, type: PDFNotificationService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "17.3.12", ngImport: i0, type: PDFNotificationService, decorators: [{
            type: Injectable,
            args: [{
                    providedIn: 'root',
                }]
        }], ctorParameters: () => [] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGRmLW5vdGlmaWNhdGlvbi1zZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vcHJvamVjdHMvbmd4LWV4dGVuZGVkLXBkZi12aWV3ZXIvc3JjL2xpYi9wZGYtbm90aWZpY2F0aW9uLXNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFVBQVUsRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLE1BQU0sZUFBZSxDQUFDO0FBQzNELE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxpQkFBaUIsRUFBRSxNQUFNLCtCQUErQixDQUFDOztBQU1wRixNQUFNLE9BQU8sc0JBQXNCO0lBQ2pDLDRHQUE0RztJQUNyRyxpQkFBaUIsR0FBRyxNQUFNLENBQW9DLFNBQVMsQ0FBQyxDQUFDO0lBRXpFLFlBQVksR0FBRyxnQkFBZ0IsQ0FBQyxpQkFBaUIsQ0FBQyxZQUFZLENBQUMsQ0FBQztJQUV2RTtRQUNFLE1BQU0sQ0FBQyxHQUFHLEVBQUU7WUFDVixJQUFJLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxFQUFFO2dCQUM1QixJQUFJLENBQUMsWUFBWSxHQUFHLGdCQUFnQixDQUFDLGlCQUFpQixDQUFDLFlBQVksQ0FBQyxDQUFDO2FBQ3RFO1FBQ0gsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO3dHQVpVLHNCQUFzQjs0R0FBdEIsc0JBQXNCLGNBRnJCLE1BQU07OzRGQUVQLHNCQUFzQjtrQkFIbEMsVUFBVTttQkFBQztvQkFDVixVQUFVLEVBQUUsTUFBTTtpQkFDbkIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBJbmplY3RhYmxlLCBlZmZlY3QsIHNpZ25hbCB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgZ2V0VmVyc2lvblN1ZmZpeCwgcGRmRGVmYXVsdE9wdGlvbnMgfSBmcm9tICcuL29wdGlvbnMvcGRmLWRlZmF1bHQtb3B0aW9ucyc7XG5pbXBvcnQgeyBJUERGVmlld2VyQXBwbGljYXRpb24gfSBmcm9tICcuL29wdGlvbnMvcGRmLXZpZXdlci1hcHBsaWNhdGlvbic7XG5cbkBJbmplY3RhYmxlKHtcbiAgcHJvdmlkZWRJbjogJ3Jvb3QnLFxufSlcbmV4cG9ydCBjbGFzcyBQREZOb3RpZmljYXRpb25TZXJ2aWNlIHtcbiAgLy8gdGhpcyBldmVudCBpcyBmaXJlZCB3aGVuIHRoZSBwZGYuanMgbGlicmFyeSBoYXMgYmVlbiBsb2FkZWQgYW5kIG9iamVjdHMgbGlrZSBQREZBcHBsaWNhdGlvbiBhcmUgYXZhaWxhYmxlXG4gIHB1YmxpYyBvblBERkpTSW5pdFNpZ25hbCA9IHNpZ25hbDxJUERGVmlld2VyQXBwbGljYXRpb24gfCB1bmRlZmluZWQ+KHVuZGVmaW5lZCk7XG5cbiAgcHVibGljIHBkZmpzVmVyc2lvbiA9IGdldFZlcnNpb25TdWZmaXgocGRmRGVmYXVsdE9wdGlvbnMuYXNzZXRzRm9sZGVyKTtcblxuICBwdWJsaWMgY29uc3RydWN0b3IoKSB7XG4gICAgZWZmZWN0KCgpID0+IHtcbiAgICAgIGlmICh0aGlzLm9uUERGSlNJbml0U2lnbmFsKCkpIHtcbiAgICAgICAgdGhpcy5wZGZqc1ZlcnNpb24gPSBnZXRWZXJzaW9uU3VmZml4KHBkZkRlZmF1bHRPcHRpb25zLmFzc2V0c0ZvbGRlcik7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==