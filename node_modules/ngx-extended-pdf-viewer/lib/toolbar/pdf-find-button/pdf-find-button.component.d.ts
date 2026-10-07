import { PDFNotificationService } from '../../pdf-notification-service';
import { ResponsiveVisibility } from '../../responsive-visibility';
import * as i0 from "@angular/core";
export declare class PdfFindButtonComponent {
    notificationService: PDFNotificationService;
    showFindButton: ResponsiveVisibility | undefined;
    hasTextLayer: boolean;
    textLayer: boolean | undefined;
    findbarVisible: boolean;
    private PDFViewerApplication;
    constructor(notificationService: PDFNotificationService);
    onClick(): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<PdfFindButtonComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<PdfFindButtonComponent, "pdf-find-button", never, { "showFindButton": { "alias": "showFindButton"; "required": false; }; "hasTextLayer": { "alias": "hasTextLayer"; "required": false; }; "textLayer": { "alias": "textLayer"; "required": false; }; "findbarVisible": { "alias": "findbarVisible"; "required": false; }; }, {}, never, never, false, never>;
}
