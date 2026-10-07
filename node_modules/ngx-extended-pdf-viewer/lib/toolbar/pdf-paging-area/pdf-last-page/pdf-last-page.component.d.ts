import { ChangeDetectorRef } from '@angular/core';
import { UpdateUIStateEvent } from '../../../events/update-ui-state-event';
import { ResponsiveVisibility } from '../../../responsive-visibility';
import { PDFNotificationService } from './../../../pdf-notification-service';
import * as i0 from "@angular/core";
export declare class PdfLastPageComponent {
    private changeDetectorRef;
    show: ResponsiveVisibility;
    disableLastPage: boolean;
    private PDFViewerApplication;
    constructor(notificationService: PDFNotificationService, changeDetectorRef: ChangeDetectorRef);
    firstPage(): void;
    onPdfJsInit(): void;
    updateUIState(event: UpdateUIStateEvent): void;
    lastPage(): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<PdfLastPageComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<PdfLastPageComponent, "pdf-last-page", never, { "show": { "alias": "show"; "required": false; }; }, {}, never, never, false, never>;
}
