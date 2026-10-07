import { EventEmitter, OnDestroy } from '@angular/core';
import { PDFNotificationService } from '../../pdf-notification-service';
import { ResponsiveVisibility } from '../../responsive-visibility';
import * as i0 from "@angular/core";
export declare class PdfToggleSidebarComponent implements OnDestroy {
    notificationService: PDFNotificationService;
    show: ResponsiveVisibility;
    sidebarVisible: boolean | undefined;
    showChange: EventEmitter<boolean>;
    onClick?: () => void;
    private PDFViewerApplication;
    constructor(notificationService: PDFNotificationService);
    ngOnDestroy(): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<PdfToggleSidebarComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<PdfToggleSidebarComponent, "pdf-toggle-sidebar", never, { "show": { "alias": "show"; "required": false; }; "sidebarVisible": { "alias": "sidebarVisible"; "required": false; }; }, { "showChange": "showChange"; }, never, never, false, never>;
}
