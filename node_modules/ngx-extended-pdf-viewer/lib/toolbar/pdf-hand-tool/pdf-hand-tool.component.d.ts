import { PDFNotificationService } from '../../pdf-notification-service';
import { ResponsiveVisibility } from '../../responsive-visibility';
import * as i0 from "@angular/core";
export declare class PdfHandToolComponent {
    showHandToolButton: ResponsiveVisibility;
    set handTool(value: boolean);
    private PDFViewerApplication;
    isSelected: boolean;
    constructor(notificationService: PDFNotificationService);
    private onPdfJsInit;
    onClick(): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<PdfHandToolComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<PdfHandToolComponent, "pdf-hand-tool", never, { "showHandToolButton": { "alias": "showHandToolButton"; "required": false; }; "handTool": { "alias": "handTool"; "required": false; }; }, {}, never, never, false, never>;
}
