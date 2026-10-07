import { PDFNotificationService } from '../../pdf-notification-service';
import { ResponsiveVisibility } from '../../responsive-visibility';
import * as i0 from "@angular/core";
export declare class PdfSelectToolComponent {
    showSelectToolButton: ResponsiveVisibility;
    isSelected: boolean;
    set handTool(value: boolean);
    private PDFViewerApplication;
    constructor(notificationService: PDFNotificationService);
    private onPdfJsInit;
    onClick(): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<PdfSelectToolComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<PdfSelectToolComponent, "pdf-select-tool", never, { "showSelectToolButton": { "alias": "showSelectToolButton"; "required": false; }; "handTool": { "alias": "handTool"; "required": false; }; }, {}, never, never, false, never>;
}
