import { EventEmitter, OnDestroy, TemplateRef } from '@angular/core';
import { PdfThumbnailDrawnEvent } from '../../../events/pdf-thumbnail-drawn-event';
import { PDFNotificationService } from '../../../pdf-notification-service';
import * as i0 from "@angular/core";
export declare class PdfSidebarContentComponent implements OnDestroy {
    notificationService: PDFNotificationService;
    customThumbnail: TemplateRef<any> | undefined;
    hideSidebarToolbar: boolean;
    mobileFriendlyZoomScale: number;
    defaultThumbnail: TemplateRef<any>;
    private linkService;
    thumbnailDrawn: EventEmitter<PdfThumbnailDrawnEvent>;
    private PDFViewerApplication;
    private thumbnailListener;
    get top(): string;
    constructor(notificationService: PDFNotificationService);
    ngOnDestroy(): void;
    private createThumbnail;
    onKeyDown(event: KeyboardEvent): void;
    private replacePageNumberEverywhere;
    static ɵfac: i0.ɵɵFactoryDeclaration<PdfSidebarContentComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<PdfSidebarContentComponent, "pdf-sidebar-content", never, { "customThumbnail": { "alias": "customThumbnail"; "required": false; }; "hideSidebarToolbar": { "alias": "hideSidebarToolbar"; "required": false; }; "mobileFriendlyZoomScale": { "alias": "mobileFriendlyZoomScale"; "required": false; }; }, { "thumbnailDrawn": "thumbnailDrawn"; }, never, never, false, never>;
}
