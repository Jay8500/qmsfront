import { Component, effect, EventEmitter, Input, Output, TemplateRef, ViewChild } from '@angular/core';
import * as i0 from "@angular/core";
import * as i1 from "../../../pdf-notification-service";
export class PdfSidebarContentComponent {
    notificationService;
    customThumbnail;
    hideSidebarToolbar = false;
    mobileFriendlyZoomScale = 1.0;
    defaultThumbnail;
    linkService;
    thumbnailDrawn = new EventEmitter();
    PDFViewerApplication;
    thumbnailListener;
    get top() {
        let top = 0;
        if (!this.hideSidebarToolbar) {
            top = 32 * this.mobileFriendlyZoomScale;
            if (top === 32) {
                top = 33; // prevent the border of the sidebar toolbar from being cut off
            }
        }
        return `${top}px`;
    }
    constructor(notificationService) {
        this.notificationService = notificationService;
        if (typeof window !== 'undefined') {
            effect(() => {
                this.PDFViewerApplication = notificationService.onPDFJSInitSignal();
                if (this.PDFViewerApplication) {
                    this.thumbnailListener = this.createThumbnail.bind(this);
                    this.PDFViewerApplication.eventBus.on('rendercustomthumbnail', this.thumbnailListener);
                }
            });
        }
    }
    ngOnDestroy() {
        this.linkService = undefined;
        if (this.thumbnailListener) {
            this.PDFViewerApplication?.eventBus.off('rendercustomthumbnail', this.thumbnailListener);
        }
    }
    createThumbnail({ pdfThumbnailView, linkService, id, container, thumbPageTitlePromiseOrPageL10nArgs, }) {
        this.linkService = linkService;
        const template = this.customThumbnail ?? this.defaultThumbnail;
        const view = template.createEmbeddedView(null);
        const newElement = view.rootNodes[0];
        newElement.classList.remove('pdf-viewer-template');
        const anchor = newElement;
        anchor.href = linkService.getAnchorUrl(`#page=${id}`);
        anchor.className = `thumbnail${id}`;
        anchor.setAttribute('data-l10n-id', 'pdfjs-thumb-page-title');
        anchor.setAttribute('data-l10n-args', thumbPageTitlePromiseOrPageL10nArgs);
        this.replacePageNumberEverywhere(newElement, id.toString());
        anchor.onclick = () => {
            linkService.page = id;
            return false;
        };
        pdfThumbnailView.anchor = anchor;
        const img = newElement.getElementsByTagName('img')[0];
        pdfThumbnailView.div = newElement.getElementsByClassName('thumbnail')[0];
        container.appendChild(newElement);
        const thumbnailDrawnEvent = {
            thumbnail: newElement,
            container: container,
            pageId: id,
        };
        this.thumbnailDrawn.emit(thumbnailDrawnEvent);
        return img;
    }
    onKeyDown(event) {
        if (event.code === 'ArrowDown') {
            if (this.linkService) {
                if (event.ctrlKey || event.metaKey) {
                    this.linkService.page = this.linkService.pagesCount;
                }
                else if (this.linkService.page < this.linkService.pagesCount) {
                    this.linkService.page = this.linkService.page + 1;
                }
                event.preventDefault();
            }
        }
        else if (event.code === 'ArrowUp') {
            if (this.linkService) {
                if (event.ctrlKey || event.metaKey) {
                    this.linkService.page = 1;
                }
                else if (this.linkService.page > 1) {
                    this.linkService.page = this.linkService.page - 1;
                }
                event.preventDefault();
            }
        }
    }
    replacePageNumberEverywhere(element, pageNumber) {
        if (element.attributes) {
            Array.from(element.attributes).forEach((attr) => {
                if (attr.value.includes('PAGE_NUMBER')) {
                    attr.value = attr.value.replace('PAGE_NUMBER', pageNumber);
                }
            });
        }
        element.childNodes.forEach((child) => {
            if (child.nodeType === Node.ELEMENT_NODE) {
                this.replacePageNumberEverywhere(child, pageNumber);
            }
            else if (child.nodeType === Node.TEXT_NODE) {
                if (child.nodeValue?.includes('PAGE_NUMBER')) {
                    child.nodeValue = child.nodeValue.replace('PAGE_NUMBER', pageNumber);
                }
            }
        });
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "17.3.12", ngImport: i0, type: PdfSidebarContentComponent, deps: [{ token: i1.PDFNotificationService }], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "17.3.12", type: PdfSidebarContentComponent, selector: "pdf-sidebar-content", inputs: { customThumbnail: "customThumbnail", hideSidebarToolbar: "hideSidebarToolbar", mobileFriendlyZoomScale: "mobileFriendlyZoomScale" }, outputs: { thumbnailDrawn: "thumbnailDrawn" }, viewQueries: [{ propertyName: "defaultThumbnail", first: true, predicate: ["defaultThumbnail"], descendants: true, read: TemplateRef }], ngImport: i0, template: "<div id=\"sidebarContent\" [style.top]=\"top\">\n  <div id=\"thumbnailView\" (keydown)=\"onKeyDown($event)\"></div>\n  <div id=\"outlineView\" class=\"hidden\"></div>\n  <div id=\"attachmentsView\" class=\"hidden\"></div>\n  <div id=\"layersView\" class=\"hidden\"></div>\n</div>\n\n<ng-template #defaultThumbnail>\n  <a class=\"pdf-viewer-template\">\n    <div class=\"thumbnail\" data-page-number=\"PAGE_NUMBER\">\n      <img class=\"thumbnailImage\" alt=\"miniature of the page\" />\n    </div>\n  </a>\n</ng-template>\n", styles: [""] });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "17.3.12", ngImport: i0, type: PdfSidebarContentComponent, decorators: [{
            type: Component,
            args: [{ selector: 'pdf-sidebar-content', template: "<div id=\"sidebarContent\" [style.top]=\"top\">\n  <div id=\"thumbnailView\" (keydown)=\"onKeyDown($event)\"></div>\n  <div id=\"outlineView\" class=\"hidden\"></div>\n  <div id=\"attachmentsView\" class=\"hidden\"></div>\n  <div id=\"layersView\" class=\"hidden\"></div>\n</div>\n\n<ng-template #defaultThumbnail>\n  <a class=\"pdf-viewer-template\">\n    <div class=\"thumbnail\" data-page-number=\"PAGE_NUMBER\">\n      <img class=\"thumbnailImage\" alt=\"miniature of the page\" />\n    </div>\n  </a>\n</ng-template>\n" }]
        }], ctorParameters: () => [{ type: i1.PDFNotificationService }], propDecorators: { customThumbnail: [{
                type: Input
            }], hideSidebarToolbar: [{
                type: Input
            }], mobileFriendlyZoomScale: [{
                type: Input
            }], defaultThumbnail: [{
                type: ViewChild,
                args: ['defaultThumbnail', { read: TemplateRef }]
            }], thumbnailDrawn: [{
                type: Output
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGRmLXNpZGViYXItY29udGVudC5jb21wb25lbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wcm9qZWN0cy9uZ3gtZXh0ZW5kZWQtcGRmLXZpZXdlci9zcmMvbGliL3NpZGViYXIvcGRmLXNpZGViYXIvcGRmLXNpZGViYXItY29udGVudC9wZGYtc2lkZWJhci1jb250ZW50LmNvbXBvbmVudC50cyIsIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3Byb2plY3RzL25neC1leHRlbmRlZC1wZGYtdmlld2VyL3NyYy9saWIvc2lkZWJhci9wZGYtc2lkZWJhci9wZGYtc2lkZWJhci1jb250ZW50L3BkZi1zaWRlYmFyLWNvbnRlbnQuY29tcG9uZW50Lmh0bWwiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUUsWUFBWSxFQUFFLEtBQUssRUFBYSxNQUFNLEVBQUUsV0FBVyxFQUFFLFNBQVMsRUFBRSxNQUFNLGVBQWUsQ0FBQzs7O0FBK0JsSCxNQUFNLE9BQU8sMEJBQTBCO0lBaUNsQjtJQS9CWixlQUFlLENBQStCO0lBRzlDLGtCQUFrQixHQUFHLEtBQUssQ0FBQztJQUczQix1QkFBdUIsR0FBRyxHQUFHLENBQUM7SUFHOUIsZ0JBQWdCLENBQW9CO0lBRW5DLFdBQVcsQ0FBNkI7SUFHekMsY0FBYyxHQUFHLElBQUksWUFBWSxFQUEwQixDQUFDO0lBRTNELG9CQUFvQixDQUFxQztJQUV6RCxpQkFBaUIsQ0FBTTtJQUUvQixJQUFXLEdBQUc7UUFDWixJQUFJLEdBQUcsR0FBRyxDQUFDLENBQUM7UUFDWixJQUFJLENBQUMsSUFBSSxDQUFDLGtCQUFrQixFQUFFO1lBQzVCLEdBQUcsR0FBRyxFQUFFLEdBQUcsSUFBSSxDQUFDLHVCQUF1QixDQUFDO1lBQ3hDLElBQUksR0FBRyxLQUFLLEVBQUUsRUFBRTtnQkFDZCxHQUFHLEdBQUcsRUFBRSxDQUFDLENBQUMsK0RBQStEO2FB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IjpbImltcG9ydCB7IENvbXBvbmVudCwgZWZmZWN0LCBFdmVudEVtaXR0ZXIsIElucHV0LCBPbkRlc3Ryb3ksIE91dHB1dCwgVGVtcGxhdGVSZWYsIFZpZXdDaGlsZCB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgUGRmVGh1bWJuYWlsRHJhd25FdmVudCB9IGZyb20gJy4uLy4uLy4uL2V2ZW50cy9wZGYtdGh1bWJuYWlsLWRyYXduLWV2ZW50JztcbmltcG9ydCB7IElQREZWaWV3ZXJBcHBsaWNhdGlvbiB9IGZyb20gJy4uLy4uLy4uL29wdGlvbnMvcGRmLXZpZXdlci1hcHBsaWNhdGlvbic7XG5pbXBvcnQgeyBQREZOb3RpZmljYXRpb25TZXJ2aWNlIH0gZnJvbSAnLi4vLi4vLi4vcGRmLW5vdGlmaWNhdGlvbi1zZXJ2aWNlJztcbmRlY2xhcmUgY2xhc3MgUERGVGh1bWJuYWlsVmlldyB7XG4gIGFuY2hvcjogSFRNTEFuY2hvckVsZW1lbnQ7XG4gIGRpdjogSFRNTEVsZW1lbnQ7XG4gIHJpbmc6IEhUTUxFbGVtZW50O1xuICBjYW52YXNXaWR0aDogbnVtYmVyO1xuICBjYW52YXNIZWlnaHQ6IG51bWJlcjtcbn1cblxuaW50ZXJmYWNlIFJlbmRlckN1c3RvbVRodW1ibmFpbEV2ZW50IHtcbiAgcGRmVGh1bWJuYWlsVmlldzogUERGVGh1bWJuYWlsVmlldztcbiAgbGlua1NlcnZpY2U6IFBERkxpbmtTZXJ2aWNlO1xuICBpZDogbnVtYmVyO1xuICBjb250YWluZXI6IEhUTUxEaXZFbGVtZW50O1xuICB0aHVtYlBhZ2VUaXRsZVByb21pc2VPclBhZ2VMMTBuQXJnczogc3RyaW5nO1xufVxuXG5kZWNsYXJlIGNsYXNzIFBERkxpbmtTZXJ2aWNlIHtcbiAgcHVibGljIHBhZ2U6IG51bWJlcjtcbiAgcHVibGljIHBhZ2VzQ291bnQ6IG51bWJlcjtcbiAgcHVibGljIGdldEFuY2hvclVybCh0YXJnZXRVcmw6IHN0cmluZyk6IHN0cmluZztcbn1cblxuQENvbXBvbmVudCh7XG4gIHNlbGVjdG9yOiAncGRmLXNpZGViYXItY29udGVudCcsXG4gIHRlbXBsYXRlVXJsOiAnLi9wZGYtc2lkZWJhci1jb250ZW50LmNvbXBvbmVudC5odG1sJyxcbiAgc3R5bGVVcmxzOiBbJy4vcGRmLXNpZGViYXItY29udGVudC5jb21wb25lbnQuY3NzJ10sXG59KVxuZXhwb3J0IGNsYXNzIFBkZlNpZGViYXJDb250ZW50Q29tcG9uZW50IGltcGxlbWVudHMgT25EZXN0cm95IHtcbiAgQElucHV0KClcbiAgcHVibGljIGN1c3RvbVRodW1ibmFpbDogVGVtcGxhdGVSZWY8YW55PiB8IHVuZGVmaW5lZDtcblxuICBASW5wdXQoKVxuICBwdWJsaWMgaGlkZVNpZGViYXJUb29sYmFyID0gZmFsc2U7XG5cbiAgQElucHV0KClcbiAgcHVibGljIG1vYmlsZUZyaWVuZGx5Wm9vbVNjYWxlID0gMS4wO1xuXG4gIEBWaWV3Q2hpbGQoJ2RlZmF1bHRUaHVtYm5haWwnLCB7IHJlYWQ6IFRlbXBsYXRlUmVmIH0pXG4gIHB1YmxpYyBkZWZhdWx0VGh1bWJuYWlsITogVGVtcGxhdGVSZWY8YW55PjtcblxuICBwcml2YXRlIGxpbmtTZXJ2aWNlOiBQREZMaW5rU2VydmljZSB8IHVuZGVmaW5lZDtcblxuICBAT3V0cHV0KClcbiAgcHVibGljIHRodW1ibmFpbERyYXduID0gbmV3IEV2ZW50RW1pdHRlcjxQZGZUaHVtYm5haWxEcmF3bkV2ZW50PigpO1xuXG4gIHByaXZhdGUgUERGVmlld2VyQXBwbGljYXRpb24hOiBJUERGVmlld2VyQXBwbGljYXRpb24gfCB1bmRlZmluZWQ7XG5cbiAgcHJpdmF0ZSB0aHVtYm5haWxMaXN0ZW5lcjogYW55O1xuXG4gIHB1YmxpYyBnZXQgdG9wKCk6IHN0cmluZyB7XG4gICAgbGV0IHRvcCA9IDA7XG4gICAgaWYgKCF0aGlzLmhpZGVTaWRlYmFyVG9vbGJhcikge1xuICAgICAgdG9wID0gMzIgKiB0aGlzLm1vYmlsZUZyaWVuZGx5Wm9vbVNjYWxlO1xuICAgICAgaWYgKHRvcCA9PT0gMzIpIHtcbiAgICAgICAgdG9wID0gMzM7IC8vIHByZXZlbnQgdGhlIGJvcmRlciBvZiB0aGUgc2lkZWJhciB0b29sYmFyIGZyb20gYmVpbmcgY3V0IG9mZlxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gYCR7dG9wfXB4YDtcbiAgfVxuXG4gIGNvbnN0cnVjdG9yKHB1YmxpYyBub3RpZmljYXRpb25TZXJ2aWNlOiBQREZOb3RpZmljYXRpb25TZXJ2aWNlKSB7XG4gICAgaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICBlZmZlY3QoKCkgPT4ge1xuICAgICAgICB0aGlzLlBERlZpZXdlckFwcGxpY2F0aW9uID0gbm90aWZpY2F0aW9uU2VydmljZS5vblBERkpTSW5pdFNpZ25hbCgpO1xuICAgICAgICBpZiAodGhpcy5QREZWaWV3ZXJBcHBsaWNhdGlvbikge1xuICAgICAgICAgIHRoaXMudGh1bWJuYWlsTGlzdGVuZXIgPSB0aGlzLmNyZWF0ZVRodW1ibmFpbC5iaW5kKHRoaXMpO1xuICAgICAgICAgIHRoaXMuUERGVmlld2VyQXBwbGljYXRpb24uZXZlbnRCdXMub24oJ3JlbmRlcmN1c3RvbXRodW1ibmFpbCcsIHRoaXMudGh1bWJuYWlsTGlzdGVuZXIpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBwdWJsaWMgbmdPbkRlc3Ryb3koKTogdm9pZCB7XG4gICAgdGhpcy5saW5rU2VydmljZSA9IHVuZGVmaW5lZDtcbiAgICBpZiAodGhpcy50aHVtYm5haWxMaXN0ZW5lcikge1xuICAgICAgdGhpcy5QREZWaWV3ZXJBcHBsaWNhdGlvbj8uZXZlbnRCdXMub2ZmKCdyZW5kZXJjdXN0b210aHVtYm5haWwnLCB0aGlzLnRodW1ibmFpbExpc3RlbmVyKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGNyZWF0ZVRodW1ibmFpbCh7XG4gICAgcGRmVGh1bWJuYWlsVmlldyxcbiAgICBsaW5rU2VydmljZSxcbiAgICBpZCxcbiAgICBjb250YWluZXIsXG4gICAgdGh1bWJQYWdlVGl0bGVQcm9taXNlT3JQYWdlTDEwbkFyZ3MsXG4gIH06IFJlbmRlckN1c3RvbVRodW1ibmFpbEV2ZW50KTogSFRNTEltYWdlRWxlbWVudCB8IHVuZGVmaW5lZCB7XG4gICAgdGhpcy5saW5rU2VydmljZSA9IGxpbmtTZXJ2aWNlO1xuICAgIGNvbnN0IHRlbXBsYXRlID0gdGhpcy5jdXN0b21UaHVtYm5haWwgPz8gdGhpcy5kZWZhdWx0VGh1bWJuYWlsO1xuICAgIGNvbnN0IHZpZXcgPSB0ZW1wbGF0ZS5jcmVhdGVFbWJlZGRlZFZpZXcobnVsbCk7XG4gICAgY29uc3QgbmV3RWxlbWVudCA9IHZpZXcucm9vdE5vZGVzWzBdIGFzIEhUTUxFbGVtZW50O1xuICAgIG5ld0VsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZSgncGRmLXZpZXdlci10ZW1wbGF0ZScpO1xuXG4gICAgY29uc3QgYW5jaG9yID0gbmV3RWxlbWVudCBhcyBIVE1MQW5jaG9yRWxlbWVudDtcbiAgICBhbmNob3IuaHJlZiA9IGxpbmtTZXJ2aWNlLmdldEFuY2hvclVybChgI3BhZ2U9JHtpZH1gKTtcbiAgICBhbmNob3IuY2xhc3NOYW1lID0gYHRodW1ibmFpbCR7aWR9YDtcblxuICAgIGFuY2hvci5zZXRBdHRyaWJ1dGUoJ2RhdGEtbDEwbi1pZCcsICdwZGZqcy10aHVtYi1wYWdlLXRpdGxlJyk7XG4gICAgYW5jaG9yLnNldEF0dHJpYnV0ZSgnZGF0YS1sMTBuLWFyZ3MnLCB0aHVtYlBhZ2VUaXRsZVByb21pc2VPclBhZ2VMMTBuQXJncyk7XG5cbiAgICB0aGlzLnJlcGxhY2VQYWdlTnVtYmVyRXZlcnl3aGVyZShuZXdFbGVtZW50LCBpZC50b1N0cmluZygpKTtcblxuICAgIGFuY2hvci5vbmNsaWNrID0gKCkgPT4ge1xuICAgICAgbGlua1NlcnZpY2UucGFnZSA9IGlkO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH07XG4gICAgcGRmVGh1bWJuYWlsVmlldy5hbmNob3IgPSBhbmNob3I7XG5cbiAgICBjb25zdCBpbWc6IEhUTUxJbWFnZUVsZW1lbnQgfCB1bmRlZmluZWQgPSBuZXdFbGVtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpbWcnKVswXTtcbiAgICBwZGZUaHVtYm5haWxWaWV3LmRpdiA9IG5ld0VsZW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgndGh1bWJuYWlsJylbMF0gYXMgSFRNTEVsZW1lbnQ7XG5cbiAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQobmV3RWxlbWVudCk7XG5cbiAgICBjb25zdCB0aHVtYm5haWxEcmF3bkV2ZW50OiBQZGZUaHVtYm5haWxEcmF3bkV2ZW50ID0ge1xuICAgICAgdGh1bWJuYWlsOiBuZXdFbGVtZW50LFxuICAgICAgY29udGFpbmVyOiBjb250YWluZXIsXG4gICAgICBwYWdlSWQ6IGlkLFxuICAgIH07XG4gICAgdGhpcy50aHVtYm5haWxEcmF3bi5lbWl0KHRodW1ibmFpbERyYXduRXZlbnQpO1xuICAgIHJldHVybiBpbWc7XG4gIH1cblxuICBwdWJsaWMgb25LZXlEb3duKGV2ZW50OiBLZXlib2FyZEV2ZW50KTogdm9pZCB7XG4gICAgaWYgKGV2ZW50LmNvZGUgPT09ICdBcnJvd0Rvd24nKSB7XG4gICAgICBpZiAodGhpcy5saW5rU2VydmljZSkge1xuICAgICAgICBpZiAoZXZlbnQuY3RybEtleSB8fCBldmVudC5tZXRhS2V5KSB7XG4gICAgICAgICAgdGhpcy5saW5rU2VydmljZS5wYWdlID0gdGhpcy5saW5rU2VydmljZS5wYWdlc0NvdW50O1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMubGlua1NlcnZpY2UucGFnZSA8IHRoaXMubGlua1NlcnZpY2UucGFnZXNDb3VudCkge1xuICAgICAgICAgIHRoaXMubGlua1NlcnZpY2UucGFnZSA9IHRoaXMubGlua1NlcnZpY2UucGFnZSArIDE7XG4gICAgICAgIH1cbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGV2ZW50LmNvZGUgPT09ICdBcnJvd1VwJykge1xuICAgICAgaWYgKHRoaXMubGlua1NlcnZpY2UpIHtcbiAgICAgICAgaWYgKGV2ZW50LmN0cmxLZXkgfHwgZXZlbnQubWV0YUtleSkge1xuICAgICAgICAgIHRoaXMubGlua1NlcnZpY2UucGFnZSA9IDE7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5saW5rU2VydmljZS5wYWdlID4gMSkge1xuICAgICAgICAgIHRoaXMubGlua1NlcnZpY2UucGFnZSA9IHRoaXMubGlua1NlcnZpY2UucGFnZSAtIDE7XG4gICAgICAgIH1cbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHJlcGxhY2VQYWdlTnVtYmVyRXZlcnl3aGVyZShlbGVtZW50OiBFbGVtZW50LCBwYWdlTnVtYmVyOiBzdHJpbmcpOiB2b2lkIHtcbiAgICBpZiAoZWxlbWVudC5hdHRyaWJ1dGVzKSB7XG4gICAgICBBcnJheS5mcm9tKGVsZW1lbnQuYXR0cmlidXRlcykuZm9yRWFjaCgoYXR0cikgPT4ge1xuICAgICAgICBpZiAoYXR0ci52YWx1ZS5pbmNsdWRlcygnUEFHRV9OVU1CRVInKSkge1xuICAgICAgICAgIGF0dHIudmFsdWUgPSBhdHRyLnZhbHVlLnJlcGxhY2UoJ1BBR0VfTlVNQkVSJywgcGFnZU51bWJlcik7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGVsZW1lbnQuY2hpbGROb2Rlcy5mb3JFYWNoKChjaGlsZCkgPT4ge1xuICAgICAgaWYgKGNoaWxkLm5vZGVUeXBlID09PSBOb2RlLkVMRU1FTlRfTk9ERSkge1xuICAgICAgICB0aGlzLnJlcGxhY2VQYWdlTnVtYmVyRXZlcnl3aGVyZShjaGlsZCBhcyBFbGVtZW50LCBwYWdlTnVtYmVyKTtcbiAgICAgIH0gZWxzZSBpZiAoY2hpbGQubm9kZVR5cGUgPT09IE5vZGUuVEVYVF9OT0RFKSB7XG4gICAgICAgIGlmIChjaGlsZC5ub2RlVmFsdWU/LmluY2x1ZGVzKCdQQUdFX05VTUJFUicpKSB7XG4gICAgICAgICAgY2hpbGQubm9kZVZhbHVlID0gY2hpbGQubm9kZVZhbHVlLnJlcGxhY2UoJ1BBR0VfTlVNQkVSJywgcGFnZU51bWJlcik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgfVxufVxuIiwiPGRpdiBpZD1cInNpZGViYXJDb250ZW50XCIgW3N0eWxlLnRvcF09XCJ0b3BcIj5cbiAgPGRpdiBpZD1cInRodW1ibmFpbFZpZXdcIiAoa2V5ZG93bik9XCJvbktleURvd24oJGV2ZW50KVwiPjwvZGl2PlxuICA8ZGl2IGlkPVwib3V0bGluZVZpZXdcIiBjbGFzcz1cImhpZGRlblwiPjwvZGl2PlxuICA8ZGl2IGlkPVwiYXR0YWNobWVudHNWaWV3XCIgY2xhc3M9XCJoaWRkZW5cIj48L2Rpdj5cbiAgPGRpdiBpZD1cImxheWVyc1ZpZXdcIiBjbGFzcz1cImhpZGRlblwiPjwvZGl2PlxuPC9kaXY+XG5cbjxuZy10ZW1wbGF0ZSAjZGVmYXVsdFRodW1ibmFpbD5cbiAgPGEgY2xhc3M9XCJwZGYtdmlld2VyLXRlbXBsYXRlXCI+XG4gICAgPGRpdiBjbGFzcz1cInRodW1ibmFpbFwiIGRhdGEtcGFnZS1udW1iZXI9XCJQQUdFX05VTUJFUlwiPlxuICAgICAgPGltZyBjbGFzcz1cInRodW1ibmFpbEltYWdlXCIgYWx0PVwibWluaWF0dXJlIG9mIHRoZSBwYWdlXCIgLz5cbiAgICA8L2Rpdj5cbiAgPC9hPlxuPC9uZy10ZW1wbGF0ZT5cbiJdfQ==