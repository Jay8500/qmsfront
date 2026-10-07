import { EventEmitter, OnDestroy } from '@angular/core';
import { PageViewModeType, ScrollModeType } from '../../options/pdf-viewer';
import { PDFNotificationService } from '../../pdf-notification-service';
import { ResponsiveVisibility } from '../../responsive-visibility';
import * as i0 from "@angular/core";
export declare class PdfInfiniteScrollComponent implements OnDestroy {
    notificationService: PDFNotificationService;
    show: ResponsiveVisibility;
    pageViewMode: PageViewModeType;
    scrollMode: ScrollModeType;
    pageViewModeChange: EventEmitter<PageViewModeType>;
    onClick?: () => void;
    private PDFViewerApplication;
    constructor(notificationService: PDFNotificationService);
    ngOnDestroy(): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<PdfInfiniteScrollComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<PdfInfiniteScrollComponent, "pdf-infinite-scroll", never, { "show": { "alias": "show"; "required": false; }; "pageViewMode": { "alias": "pageViewMode"; "required": false; }; "scrollMode": { "alias": "scrollMode"; "required": false; }; }, { "pageViewModeChange": "pageViewModeChange"; }, never, never, false, never>;
}
