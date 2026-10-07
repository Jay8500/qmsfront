import { OnDestroy } from '@angular/core';
import { IPDFViewerApplication } from '../../../options/pdf-viewer-application';
import { PDFNotificationService } from '../../../pdf-notification-service';
import { ResponsiveVisibility } from '../../../responsive-visibility';
import * as i0 from "@angular/core";
export declare class PdfZoomInComponent implements OnDestroy {
    showZoomButtons: ResponsiveVisibility;
    disabled: boolean;
    PDFViewerApplication: IPDFViewerApplication | undefined;
    private eventListener;
    constructor(notificationService: PDFNotificationService);
    private onPdfJsInit;
    ngOnDestroy(): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<PdfZoomInComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<PdfZoomInComponent, "pdf-zoom-in", never, { "showZoomButtons": { "alias": "showZoomButtons"; "required": false; }; }, {}, never, never, false, never>;
}
