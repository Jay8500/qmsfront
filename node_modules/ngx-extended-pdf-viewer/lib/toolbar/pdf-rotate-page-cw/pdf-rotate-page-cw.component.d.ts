import { ChangeDetectorRef } from '@angular/core';
import { UpdateUIStateEvent } from '../../events/update-ui-state-event';
import { PDFNotificationService } from '../../pdf-notification-service';
import { ResponsiveVisibility } from '../../responsive-visibility';
import * as i0 from "@angular/core";
export declare class PdfRotatePageCwComponent {
    private notificationService;
    private changeDetectorRef;
    showRotateCwButton: ResponsiveVisibility;
    disableRotate: boolean;
    clockwise: boolean;
    counterClockwise: boolean;
    private PDFViewerApplication;
    constructor(notificationService: PDFNotificationService, changeDetectorRef: ChangeDetectorRef);
    rotateCW(): void;
    onPdfJsInit(): void;
    updateUIState(event: UpdateUIStateEvent): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<PdfRotatePageCwComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<PdfRotatePageCwComponent, "pdf-rotate-page-cw", never, { "showRotateCwButton": { "alias": "showRotateCwButton"; "required": false; }; "clockwise": { "alias": "clockwise"; "required": false; }; "counterClockwise": { "alias": "counterClockwise"; "required": false; }; }, {}, never, never, false, never>;
}
