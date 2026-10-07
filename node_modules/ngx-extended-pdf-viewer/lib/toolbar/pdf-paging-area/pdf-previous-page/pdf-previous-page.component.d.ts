import { ChangeDetectorRef } from '@angular/core';
import { UpdateUIStateEvent } from '../../../events/update-ui-state-event';
import { PDFNotificationService } from '../../../pdf-notification-service';
import { ResponsiveVisibility } from '../../../responsive-visibility';
import * as i0 from "@angular/core";
export declare class PdfPreviousPageComponent {
    private changeDetectorRef;
    show: ResponsiveVisibility;
    disablePreviousPage: boolean;
    private PDFViewerApplication;
    constructor(notificationService: PDFNotificationService, changeDetectorRef: ChangeDetectorRef);
    onPdfJsInit(): void;
    updateUIState(event: UpdateUIStateEvent): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<PdfPreviousPageComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<PdfPreviousPageComponent, "pdf-previous-page", never, { "show": { "alias": "show"; "required": false; }; }, {}, never, never, false, never>;
}
