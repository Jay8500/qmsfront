import * as i0 from "@angular/core";
export declare class PdfCspPolicyService {
    private sanitizer;
    private csp_nonce;
    constructor();
    init(): void;
    addTrustedCSS(styles: HTMLElement, css: string): void;
    addTrustedJavaScript(scripts: HTMLScriptElement, css: string): void;
    sanitizeHTML(html: string): string;
    addTrustedHTML(element: HTMLElement, html: string): void;
    createTrustedHTML(html: string): any;
    generateTrustedURL(sourcePath: any): any;
    static ɵfac: i0.ɵɵFactoryDeclaration<PdfCspPolicyService, never>;
    static ɵprov: i0.ɵɵInjectableDeclaration<PdfCspPolicyService>;
}
