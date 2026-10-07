import { TemplateRef } from '@angular/core';
import { ResponsiveVisibility } from '../../responsive-visibility';
import * as i0 from "@angular/core";
export declare class PdfFindbarComponent {
    showFindButton: ResponsiveVisibility;
    mobileFriendlyZoomScale: number;
    findbarLeft: string | undefined;
    findbarTop: string | undefined;
    customFindbarInputArea: TemplateRef<any> | undefined;
    customFindbar: TemplateRef<any>;
    customFindbarButtons: TemplateRef<any> | undefined;
    showFindHighlightAll: boolean;
    showFindMatchCase: boolean;
    showFindEntireWord: boolean;
    showFindMatchDiacritics: boolean;
    showFindResultsCount: boolean;
    showFindMessages: boolean;
    showFindMultiple: boolean;
    showFindRegexp: boolean;
    static ɵfac: i0.ɵɵFactoryDeclaration<PdfFindbarComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<PdfFindbarComponent, "pdf-findbar", never, { "showFindButton": { "alias": "showFindButton"; "required": false; }; "mobileFriendlyZoomScale": { "alias": "mobileFriendlyZoomScale"; "required": false; }; "findbarLeft": { "alias": "findbarLeft"; "required": false; }; "findbarTop": { "alias": "findbarTop"; "required": false; }; "customFindbarInputArea": { "alias": "customFindbarInputArea"; "required": false; }; "customFindbar": { "alias": "customFindbar"; "required": false; }; "customFindbarButtons": { "alias": "customFindbarButtons"; "required": false; }; "showFindHighlightAll": { "alias": "showFindHighlightAll"; "required": false; }; "showFindMatchCase": { "alias": "showFindMatchCase"; "required": false; }; "showFindEntireWord": { "alias": "showFindEntireWord"; "required": false; }; "showFindMatchDiacritics": { "alias": "showFindMatchDiacritics"; "required": false; }; "showFindResultsCount": { "alias": "showFindResultsCount"; "required": false; }; "showFindMessages": { "alias": "showFindMessages"; "required": false; }; "showFindMultiple": { "alias": "showFindMultiple"; "required": false; }; "showFindRegexp": { "alias": "showFindRegexp"; "required": false; }; }, {}, never, never, false, never>;
}
