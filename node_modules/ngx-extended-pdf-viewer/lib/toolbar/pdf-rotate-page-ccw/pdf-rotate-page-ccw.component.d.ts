import { ChangeDetectorRef } from '@angular/core';
import { UpdateUIStateEvent } from '../../events/update-ui-state-event';
import { PDFNotificationService } from '../../pdf-notification-service';
import { ResponsiveVisibility } from '../../responsive-visibility';
import * as i0 from "@angular/core";
export declare class PdfRotatePageCcwComponent {
    private notificationService;
    private changeDetectorRef;
    showRotateCcwButton: ResponsiveVisibility;
    disableRotate: boolean;
    counterClockwise: boolean;
    private PDFViewerApplication;
    constructor(notificationService: PDFNotificationService, changeDetectorRef: ChangeDetectorRef);
    rotateCCW(): void;
    onPdfJsInit(): void;
    updateUIState(event: UpdateUIStateEvent): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<PdfRotatePageCcwComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<PdfRotatePageCcwComponent, "pdf-rotate-page-ccw", never, { "showRotateCcwButton": { "alias": "showRotateCcwButton"; "required": false; }; "counterClockwise": { "alias": "counterClockwise"; "required": false; }; }, {}, never, never, false, never>;
}
