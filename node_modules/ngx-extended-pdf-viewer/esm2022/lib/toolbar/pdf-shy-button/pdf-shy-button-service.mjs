import { effect, Injectable } from '@angular/core';
import * as i0 from "@angular/core";
import * as i1 from "../../pdf-notification-service";
export class PdfShyButtonService {
    notificationService;
    buttons = [];
    PDFViewerApplication;
    constructor(notificationService) {
        this.notificationService = notificationService;
        effect(() => {
            this.PDFViewerApplication = notificationService.onPDFJSInitSignal();
        });
    }
    add(button) {
        const id = button.secondaryMenuId ?? this.addDefaultPrefix(button);
        const previousDefinition = this.buttons.findIndex((b) => b.id === id);
        const description = {
            id,
            cssClass: button.cssClass,
            l10nId: button.l10nId,
            l10nLabel: button.l10nLabel,
            title: button.title,
            toggled: button.toggled,
            disabled: button.disabled,
            order: button.order ?? 99999,
            image: button.imageHtml,
            action: button.action,
            eventBusName: button.eventBusName,
            closeOnClick: button.closeOnClick,
        };
        if (previousDefinition >= 0) {
            this.buttons[previousDefinition] = description;
            setTimeout(() => {
                if (this.PDFViewerApplication?.l10n) {
                    const element = document.getElementById(id);
                    this.PDFViewerApplication.l10n.translate(element).then(() => {
                        // Dispatch the 'localized' event on the `eventBus` once the viewer
                        // has been fully initialized and translated.
                    });
                }
            }, 0);
        }
        else {
            this.buttons.push(description);
        }
        this.buttons.sort((a, b) => a.order - b.order);
    }
    addDefaultPrefix(button) {
        if (button.primaryToolbarId.startsWith('primary')) {
            return button.primaryToolbarId.replace('primary', 'secondary');
        }
        return 'secondary' + button.primaryToolbarId.substring(0, 1).toUpperCase() + button.primaryToolbarId.substring(1);
    }
    update(button) {
        const id = button.secondaryMenuId ?? this.addDefaultPrefix(button);
        if (this.buttons.some((b) => b.id === id)) {
            this.add(button);
        }
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "17.3.12", ngImport: i0, type: PdfShyButtonService, deps: [{ token: i1.PDFNotificationService }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "17.3.12", ngImport: i0, type: PdfShyButtonService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "17.3.12", ngImport: i0, type: PdfShyButtonService, decorators: [{
            type: Injectable,
            args: [{
                    providedIn: 'root',
                }]
        }], ctorParameters: () => [{ type: i1.PDFNotificationService }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGRmLXNoeS1idXR0b24tc2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3Byb2plY3RzL25neC1leHRlbmRlZC1wZGYtdmlld2VyL3NyYy9saWIvdG9vbGJhci9wZGYtc2h5LWJ1dHRvbi9wZGYtc2h5LWJ1dHRvbi1zZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxNQUFNLEVBQUUsVUFBVSxFQUFFLE1BQU0sZUFBZSxDQUFDOzs7QUF5Qm5ELE1BQU0sT0FBTyxtQkFBbUI7SUFLWDtJQUpaLE9BQU8sR0FBOEIsRUFBRSxDQUFDO0lBRXZDLG9CQUFvQixDQUFxQztJQUVqRSxZQUFtQixtQkFBMkM7UUFBM0Msd0JBQW1CLEdBQW5CLG1CQUFtQixDQUF3QjtRQUM1RCxNQUFNLENBQUMsR0FBRyxFQUFFO1lBQ1YsSUFBSSxDQUFDLG9CQUFvQixHQUFHLG1CQUFtQixDQUFDLGlCQUFpQixFQUFFLENBQUM7UUFDdEUsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0lBRU0sR0FBRyxDQUFDLE1BQTZCO1FBQ3RDLE1BQU0sRUFBRSxHQUFHLE1BQU0sQ0FBQyxlQUFlLElBQUksSUFBSSxDQUFDLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ25FLE1BQU0sa0JBQWtCLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7UUFDdEUsTUFBTSxXQUFXLEdBQTRCO1lBQzNDLEVBQUU7WUFDRixRQUFRLEVBQUUsTUFBTSxDQUFDLFFBQVE7WUFDekIsTUFBTSxFQUFFLE1BQU0sQ0FBQyxNQUFNO1lBQ3JCLFNBQVMsRUFBRSxNQUFNLENBQUMsU0FBUztZQUMzQixLQUFLLEVBQUUsTUFBTSxDQUFDLEtBQUs7WUFDbkIsT0FBTyxFQUFFLE1BQU0sQ0FBQyxPQUFPO1lBQ3ZCLFFBQVEsRUFBRSxNQUFNLENBQUMsUUFBUTtZQUN6QixLQUFLLEVBQUUsTUFBTSxDQUFDLEtBQUssSUFBSSxLQUFLO1lBQzVCLEtBQUssRUFBRSxNQUFNLENBQUMsU0FBUztZQUN2QixNQUFNLEVBQUUsTUFBTSxDQUFDLE1BQU07WUFDckIsWUFBWSxFQUFFLE1BQU0sQ0FBQyxZQUFZO1lBQ2pDLFlBQVksRUFBRSxNQUFNLENBQUMsWUFBWTtTQUNsQyxDQUFDO1FBQ0YsSUFBSSxrQkFBa0IsSUFBSSxDQUFDLEVBQUU7WUFDM0IsSUFBSSxDQUFDLE9BQU8sQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLFdBQVcsQ0FBQztZQUMvQyxVQUFVLENBQUMsR0FBRyxFQUFFO2dCQUNkLElBQUksSUFBSSxDQUFDLG9CQUFvQixFQUFFLElBQUksRUFBRTtvQkFDbkMsTUFBTSxPQUFPLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQyxFQUFFLENBQUMsQ0FBQztvQkFDNUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRTt3QkFDMUQsbUVBQW1FO3dCQUNuRSw2Q0FBNkM7b0JBQy9DLENBQUMsQ0FBQyxDQUFDO2lCQUNKO1lBQ0gsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1NBQ1A7YUFBTTtZQUNMLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1NBQ2hDO1FBQ0QsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNqRCxDQUFDO0lBRU8sZ0JBQWdCLENBQUMsTUFBNkI7UUFDcEQsSUFBSSxNQUFNLENBQUMsZ0JBQWdCLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxFQUFFO1lBQ2pELE9BQU8sTUFBTSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsV0FBVyxDQUFDLENBQUM7U0FDaEU7UUFDRCxPQUFPLFdBQVcsR0FBRyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxXQUFXLEVBQUUsR0FBRyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3BILENBQUM7SUFFTSxNQUFNLENBQUMsTUFBNkI7UUFDekMsTUFBTSxFQUFFLEdBQUcsTUFBTSxDQUFDLGVBQWUsSUFBSSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLENBQUM7UUFFbkUsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRTtZQUN6QyxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1NBQ2xCO0lBQ0gsQ0FBQzt3R0ExRFUsbUJBQW1COzRHQUFuQixtQkFBbUIsY0FGbEIsTUFBTTs7NEZBRVAsbUJBQW1CO2tCQUgvQixVQUFVO21CQUFDO29CQUNWLFVBQVUsRUFBRSxNQUFNO2lCQUNuQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGVmZmVjdCwgSW5qZWN0YWJsZSB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgU2FmZUh0bWwgfSBmcm9tICdAYW5ndWxhci9wbGF0Zm9ybS1icm93c2VyJztcbmltcG9ydCB7IElQREZWaWV3ZXJBcHBsaWNhdGlvbiB9IGZyb20gJy4uLy4uL29wdGlvbnMvcGRmLXZpZXdlci1hcHBsaWNhdGlvbic7XG5pbXBvcnQgeyBQREZOb3RpZmljYXRpb25TZXJ2aWNlIH0gZnJvbSAnLi4vLi4vcGRmLW5vdGlmaWNhdGlvbi1zZXJ2aWNlJztcbmltcG9ydCB7IFJlc3BvbnNpdmVDU1NDbGFzcyB9IGZyb20gJy4uLy4uL3Jlc3BvbnNpdmUtdmlzaWJpbGl0eSc7XG5pbXBvcnQgeyBQZGZTaHlCdXR0b25Db21wb25lbnQgfSBmcm9tICcuL3BkZi1zaHktYnV0dG9uLmNvbXBvbmVudCc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgUGRmU2h5QnV0dG9uRGVzY3JpcHRpb24ge1xuICBpZDogc3RyaW5nO1xuICBjc3NDbGFzczogUmVzcG9uc2l2ZUNTU0NsYXNzO1xuICBsMTBuSWQ6IHN0cmluZztcbiAgbDEwbkxhYmVsOiBzdHJpbmc7XG4gIHRpdGxlOiBzdHJpbmc7XG4gIHRvZ2dsZWQ6IGJvb2xlYW47XG4gIGRpc2FibGVkOiBib29sZWFuO1xuICBvcmRlcjogbnVtYmVyO1xuICBpbWFnZTogc3RyaW5nIHwgU2FmZUh0bWwgfCB1bmRlZmluZWQ7XG4gIGFjdGlvbj86ICgpID0+IHZvaWQ7XG4gIGV2ZW50QnVzTmFtZT86IHN0cmluZztcbiAgY2xvc2VPbkNsaWNrPzogYm9vbGVhbjtcbn1cblxuQEluamVjdGFibGUoe1xuICBwcm92aWRlZEluOiAncm9vdCcsXG59KVxuZXhwb3J0IGNsYXNzIFBkZlNoeUJ1dHRvblNlcnZpY2Uge1xuICBwdWJsaWMgYnV0dG9uczogUGRmU2h5QnV0dG9uRGVzY3JpcHRpb25bXSA9IFtdO1xuXG4gIHByaXZhdGUgUERGVmlld2VyQXBwbGljYXRpb24hOiBJUERGVmlld2VyQXBwbGljYXRpb24gfCB1bmRlZmluZWQ7XG5cbiAgY29uc3RydWN0b3IocHVibGljIG5vdGlmaWNhdGlvblNlcnZpY2U6IFBERk5vdGlmaWNhdGlvblNlcnZpY2UpIHtcbiAgICBlZmZlY3QoKCkgPT4ge1xuICAgICAgdGhpcy5QREZWaWV3ZXJBcHBsaWNhdGlvbiA9IG5vdGlmaWNhdGlvblNlcnZpY2Uub25QREZKU0luaXRTaWduYWwoKTtcbiAgICB9KTtcbiAgfVxuXG4gIHB1YmxpYyBhZGQoYnV0dG9uOiBQZGZTaHlCdXR0b25Db21wb25lbnQpOiB2b2lkIHtcbiAgICBjb25zdCBpZCA9IGJ1dHRvbi5zZWNvbmRhcnlNZW51SWQgPz8gdGhpcy5hZGREZWZhdWx0UHJlZml4KGJ1dHRvbik7XG4gICAgY29uc3QgcHJldmlvdXNEZWZpbml0aW9uID0gdGhpcy5idXR0b25zLmZpbmRJbmRleCgoYikgPT4gYi5pZCA9PT0gaWQpO1xuICAgIGNvbnN0IGRlc2NyaXB0aW9uOiBQZGZTaHlCdXR0b25EZXNjcmlwdGlvbiA9IHtcbiAgICAgIGlkLFxuICAgICAgY3NzQ2xhc3M6IGJ1dHRvbi5jc3NDbGFzcyxcbiAgICAgIGwxMG5JZDogYnV0dG9uLmwxMG5JZCxcbiAgICAgIGwxMG5MYWJlbDogYnV0dG9uLmwxMG5MYWJlbCxcbiAgICAgIHRpdGxlOiBidXR0b24udGl0bGUsXG4gICAgICB0b2dnbGVkOiBidXR0b24udG9nZ2xlZCxcbiAgICAgIGRpc2FibGVkOiBidXR0b24uZGlzYWJsZWQsXG4gICAgICBvcmRlcjogYnV0dG9uLm9yZGVyID8/IDk5OTk5LFxuICAgICAgaW1hZ2U6IGJ1dHRvbi5pbWFnZUh0bWwsXG4gICAgICBhY3Rpb246IGJ1dHRvbi5hY3Rpb24sXG4gICAgICBldmVudEJ1c05hbWU6IGJ1dHRvbi5ldmVudEJ1c05hbWUsXG4gICAgICBjbG9zZU9uQ2xpY2s6IGJ1dHRvbi5jbG9zZU9uQ2xpY2ssXG4gICAgfTtcbiAgICBpZiAocHJldmlvdXNEZWZpbml0aW9uID49IDApIHtcbiAgICAgIHRoaXMuYnV0dG9uc1twcmV2aW91c0RlZmluaXRpb25dID0gZGVzY3JpcHRpb247XG4gICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgaWYgKHRoaXMuUERGVmlld2VyQXBwbGljYXRpb24/LmwxMG4pIHtcbiAgICAgICAgICBjb25zdCBlbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpO1xuICAgICAgICAgIHRoaXMuUERGVmlld2VyQXBwbGljYXRpb24ubDEwbi50cmFuc2xhdGUoZWxlbWVudCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAvLyBEaXNwYXRjaCB0aGUgJ2xvY2FsaXplZCcgZXZlbnQgb24gdGhlIGBldmVudEJ1c2Agb25jZSB0aGUgdmlld2VyXG4gICAgICAgICAgICAvLyBoYXMgYmVlbiBmdWxseSBpbml0aWFsaXplZCBhbmQgdHJhbnNsYXRlZC5cbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfSwgMCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuYnV0dG9ucy5wdXNoKGRlc2NyaXB0aW9uKTtcbiAgICB9XG4gICAgdGhpcy5idXR0b25zLnNvcnQoKGEsIGIpID0+IGEub3JkZXIgLSBiLm9yZGVyKTtcbiAgfVxuXG4gIHByaXZhdGUgYWRkRGVmYXVsdFByZWZpeChidXR0b246IFBkZlNoeUJ1dHRvbkNvbXBvbmVudCk6IHN0cmluZyB7XG4gICAgaWYgKGJ1dHRvbi5wcmltYXJ5VG9vbGJhcklkLnN0YXJ0c1dpdGgoJ3ByaW1hcnknKSkge1xuICAgICAgcmV0dXJuIGJ1dHRvbi5wcmltYXJ5VG9vbGJhcklkLnJlcGxhY2UoJ3ByaW1hcnknLCAnc2Vjb25kYXJ5Jyk7XG4gICAgfVxuICAgIHJldHVybiAnc2Vjb25kYXJ5JyArIGJ1dHRvbi5wcmltYXJ5VG9vbGJhcklkLnN1YnN0cmluZygwLCAxKS50b1VwcGVyQ2FzZSgpICsgYnV0dG9uLnByaW1hcnlUb29sYmFySWQuc3Vic3RyaW5nKDEpO1xuICB9XG5cbiAgcHVibGljIHVwZGF0ZShidXR0b246IFBkZlNoeUJ1dHRvbkNvbXBvbmVudCk6IHZvaWQge1xuICAgIGNvbnN0IGlkID0gYnV0dG9uLnNlY29uZGFyeU1lbnVJZCA/PyB0aGlzLmFkZERlZmF1bHRQcmVmaXgoYnV0dG9uKTtcblxuICAgIGlmICh0aGlzLmJ1dHRvbnMuc29tZSgoYikgPT4gYi5pZCA9PT0gaWQpKSB7XG4gICAgICB0aGlzLmFkZChidXR0b24pO1xuICAgIH1cbiAgfVxufVxuIl19