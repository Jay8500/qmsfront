import { OnDestroy, Renderer2 } from '@angular/core';
import { NgxHasHeight } from '../ngx-has-height';
import { VerbosityLevel } from '../options/verbosity-level';
import { PdfCspPolicyService } from '../pdf-csp-policy.service';
import * as i0 from "@angular/core";
export declare class DynamicCssComponent implements OnDestroy {
    private readonly renderer;
    private readonly document;
    private readonly platformId;
    private readonly pdfCspPolicyService;
    private readonly nonce?;
    zoom: number;
    width: number;
    xxs: number;
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
    get style(): string;
    constructor(renderer: Renderer2, document: Document, platformId: any, pdfCspPolicyService: PdfCspPolicyService, nonce?: string | null);
    updateToolbarWidth(): void;
    removeScrollbarInInfiniteScrollMode(restoreHeight: boolean, pageViewMode: string, primaryMenuVisible: boolean, ngxExtendedPdfViewer: NgxHasHeight, logLevel: VerbosityLevel): void;
    checkHeight(ngxExtendedPdfViewer: NgxHasHeight, logLevel: VerbosityLevel): void;
    /**
     * The height is defined with one of the units vh, vw, em, rem, etc.
     * So the height check isn't necessary.
     * @param height the height of the container
     */
    private isHeightDefinedWithUnits;
    /**
     * #1702 workaround to a Firefox bug: when printing, container.clientHeight is temporarily 0,
     * causing ngx-extended-pdf-viewer to default to 100 pixels height. So it's better to do nothing.
     * @returns true if data-pdfjsprinting is set
     */
    private isPrinting;
    /**
     * Checks if the code is running in a browser environment.
     */
    private isBrowser;
    private getContainer;
    private isContainerHeightZero;
    private adjustHeight;
    private calculateBorderMargin;
    ngOnDestroy(): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<DynamicCssComponent, [null, null, null, null, { optional: true; }]>;
    static ɵcmp: i0.ɵɵComponentDeclaration<DynamicCssComponent, "pdf-dynamic-css", never, { "zoom": { "alias": "zoom"; "required": false; }; "width": { "alias": "width"; "required": false; }; }, {}, never, never, false, never>;
}
