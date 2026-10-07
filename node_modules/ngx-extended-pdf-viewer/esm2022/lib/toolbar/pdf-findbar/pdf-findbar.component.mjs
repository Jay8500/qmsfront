import { Component, Input } from '@angular/core';
import * as i0 from "@angular/core";
import * as i1 from "@angular/common";
import * as i2 from "./pdf-findbar-message-container/pdf-findbar-message-container.component";
import * as i3 from "./pdf-findbar-options-two-container/pdf-find-entire-word/pdf-find-entire-word.component";
import * as i4 from "./pdf-findbar-options-one-container/pdf-find-highlight-all/pdf-find-highlight-all.component";
import * as i5 from "./pdf-find-input-area/pdf-find-input-area.component";
import * as i6 from "./pdf-findbar-options-one-container/pdf-find-match-case/pdf-find-match-case.component";
import * as i7 from "./pdf-findbar-options-one-container/pdf-find-multiple/pdf-find-multiple.component";
import * as i8 from "./pdf-findbar-options-one-container/pdf-find-regexp/pdf-find-regexp.component";
import * as i9 from "./pdf-findbar-options-three-container/pdf-find-results-count/pdf-find-results-count.component";
import * as i10 from "./pdf-findbar-options-two-container/pdf-match-diacritics/pdf-match-diacritics.component";
export class PdfFindbarComponent {
    showFindButton = true;
    mobileFriendlyZoomScale;
    findbarLeft;
    findbarTop;
    /* UI templates */
    customFindbarInputArea;
    customFindbar;
    customFindbarButtons;
    showFindHighlightAll = true;
    showFindMatchCase = true;
    showFindEntireWord = true;
    showFindMatchDiacritics = true;
    showFindResultsCount = true;
    showFindMessages = true;
    showFindMultiple = true;
    showFindRegexp = true;
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "17.3.12", ngImport: i0, type: PdfFindbarComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "17.3.12", type: PdfFindbarComponent, selector: "pdf-findbar", inputs: { showFindButton: "showFindButton", mobileFriendlyZoomScale: "mobileFriendlyZoomScale", findbarLeft: "findbarLeft", findbarTop: "findbarTop", customFindbarInputArea: "customFindbarInputArea", customFindbar: "customFindbar", customFindbarButtons: "customFindbarButtons", showFindHighlightAll: "showFindHighlightAll", showFindMatchCase: "showFindMatchCase", showFindEntireWord: "showFindEntireWord", showFindMatchDiacritics: "showFindMatchDiacritics", showFindResultsCount: "showFindResultsCount", showFindMessages: "showFindMessages", showFindMultiple: "showFindMultiple", showFindRegexp: "showFindRegexp" }, ngImport: i0, template: "<ng-container [ngTemplateOutlet]=\"customFindbar ? customFindbar : defaultFindbar\"> </ng-container>\n\n<ng-template #defaultFindbar>\n  <div class=\"findbar hidden doorHanger\" id=\"findbar\" [style.transform]=\"'scale(' + mobileFriendlyZoomScale + ')'\"\n    [style.transformOrigin]=\"'left top'\" [style.left]=\"findbarLeft\" [style.top]=\"findbarTop\">\n    <ng-container [ngTemplateOutlet]=\"customFindbarButtons ? customFindbarButtons : defaultFindbarButtons\">\n    </ng-container>\n  </div>\n</ng-template>\n\n<ng-template #defaultFindbarButtons>\n  <pdf-find-input-area [customFindbarInputArea]=\"customFindbarInputArea\"></pdf-find-input-area>\n  <pdf-find-highlight-all [class.hidden]=\"!showFindHighlightAll\"></pdf-find-highlight-all>\n  <pdf-find-match-case [class.hidden]=\"!showFindMatchCase\"></pdf-find-match-case>\n  <pdf-match-diacritics [class.hidden]=\"!showFindMatchDiacritics\"></pdf-match-diacritics>\n  <pdf-find-entire-word [class.hidden]=\"!showFindEntireWord\"></pdf-find-entire-word>\n  <pdf-find-multiple [class.hidden]=\"!showFindMultiple\"></pdf-find-multiple>\n  <pdf-find-regexp [class.hidden]=\"!showFindRegexp\"></pdf-find-regexp>\n  <pdf-find-results-count [class.hidden]=\"!showFindResultsCount\"></pdf-find-results-count>\n  <pdf-findbar-message-container [class.hidden]=\"!showFindMessages\"></pdf-findbar-message-container>\n</ng-template>", styles: [""], dependencies: [{ kind: "directive", type: i1.NgTemplateOutlet, selector: "[ngTemplateOutlet]", inputs: ["ngTemplateOutletContext", "ngTemplateOutlet", "ngTemplateOutletInjector"] }, { kind: "component", type: i2.PdfFindbarMessageContainerComponent, selector: "pdf-findbar-message-container" }, { kind: "component", type: i3.PdfFindEntireWordComponent, selector: "pdf-find-entire-word" }, { kind: "component", type: i4.PdfFindHighlightAllComponent, selector: "pdf-find-highlight-all" }, { kind: "component", type: i5.PdfFindInputAreaComponent, selector: "pdf-find-input-area", inputs: ["customFindbarInputArea"] }, { kind: "component", type: i6.PdfFindMatchCaseComponent, selector: "pdf-find-match-case" }, { kind: "component", type: i7.PdfFindMultipleComponent, selector: "pdf-find-multiple" }, { kind: "component", type: i8.PdfFindRegExpComponent, selector: "pdf-find-regexp" }, { kind: "component", type: i9.PdfFindResultsCountComponent, selector: "pdf-find-results-count" }, { kind: "component", type: i10.PdfMatchDiacriticsComponent, selector: "pdf-match-diacritics" }] });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "17.3.12", ngImport: i0, type: PdfFindbarComponent, decorators: [{
            type: Component,
            args: [{ selector: 'pdf-findbar', template: "<ng-container [ngTemplateOutlet]=\"customFindbar ? customFindbar : defaultFindbar\"> </ng-container>\n\n<ng-template #defaultFindbar>\n  <div class=\"findbar hidden doorHanger\" id=\"findbar\" [style.transform]=\"'scale(' + mobileFriendlyZoomScale + ')'\"\n    [style.transformOrigin]=\"'left top'\" [style.left]=\"findbarLeft\" [style.top]=\"findbarTop\">\n    <ng-container [ngTemplateOutlet]=\"customFindbarButtons ? customFindbarButtons : defaultFindbarButtons\">\n    </ng-container>\n  </div>\n</ng-template>\n\n<ng-template #defaultFindbarButtons>\n  <pdf-find-input-area [customFindbarInputArea]=\"customFindbarInputArea\"></pdf-find-input-area>\n  <pdf-find-highlight-all [class.hidden]=\"!showFindHighlightAll\"></pdf-find-highlight-all>\n  <pdf-find-match-case [class.hidden]=\"!showFindMatchCase\"></pdf-find-match-case>\n  <pdf-match-diacritics [class.hidden]=\"!showFindMatchDiacritics\"></pdf-match-diacritics>\n  <pdf-find-entire-word [class.hidden]=\"!showFindEntireWord\"></pdf-find-entire-word>\n  <pdf-find-multiple [class.hidden]=\"!showFindMultiple\"></pdf-find-multiple>\n  <pdf-find-regexp [class.hidden]=\"!showFindRegexp\"></pdf-find-regexp>\n  <pdf-find-results-count [class.hidden]=\"!showFindResultsCount\"></pdf-find-results-count>\n  <pdf-findbar-message-container [class.hidden]=\"!showFindMessages\"></pdf-findbar-message-container>\n</ng-template>" }]
        }], propDecorators: { showFindButton: [{
                type: Input
            }], mobileFriendlyZoomScale: [{
                type: Input
            }], findbarLeft: [{
                type: Input
            }], findbarTop: [{
                type: Input
            }], customFindbarInputArea: [{
                type: Input
            }], customFindbar: [{
                type: Input
            }], customFindbarButtons: [{
                type: Input
            }], showFindHighlightAll: [{
                type: Input
            }], showFindMatchCase: [{
                type: Input
            }], showFindEntireWord: [{
                type: Input
            }], showFindMatchDiacritics: [{
                type: Input
            }], showFindResultsCount: [{
                type: Input
            }], showFindMessages: [{
                type: Input
            }], showFindMultiple: [{
                type: Input
            }], showFindRegexp: [{
                type: Input
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGRmLWZpbmRiYXIuY29tcG9uZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vcHJvamVjdHMvbmd4LWV4dGVuZGVkLXBkZi12aWV3ZXIvc3JjL2xpYi90b29sYmFyL3BkZi1maW5kYmFyL3BkZi1maW5kYmFyLmNvbXBvbmVudC50cyIsIi4uLy4uLy4uLy4uLy4uLy4uL3Byb2plY3RzL25neC1leHRlbmRlZC1wZGYtdmlld2VyL3NyYy9saWIvdG9vbGJhci9wZGYtZmluZGJhci9wZGYtZmluZGJhci5jb21wb25lbnQuaHRtbCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBZSxNQUFNLGVBQWUsQ0FBQzs7Ozs7Ozs7Ozs7O0FBUTlELE1BQU0sT0FBTyxtQkFBbUI7SUFFdkIsY0FBYyxHQUF5QixJQUFJLENBQUM7SUFHNUMsdUJBQXVCLENBQVM7SUFHaEMsV0FBVyxDQUFxQjtJQUdoQyxVQUFVLENBQXFCO0lBRXRDLGtCQUFrQjtJQUVYLHNCQUFzQixDQUErQjtJQUdyRCxhQUFhLENBQW1CO0lBR2hDLG9CQUFvQixDQUErQjtJQUduRCxvQkFBb0IsR0FBRyxJQUFJLENBQUM7SUFHNUIsaUJBQWlCLEdBQUcsSUFBSSxDQUFDO0lBR3pCLGtCQUFrQixHQUFHLElBQUksQ0FBQztJQUcxQix1QkFBdUIsR0FBRyxJQUFJLENBQUM7SUFHL0Isb0JBQW9CLEdBQUcsSUFBSSxDQUFDO0lBRzVCLGdCQUFnQixHQUFHLElBQUksQ0FBQztJQUd4QixnQkFBZ0IsR0FBWSxJQUFJLENBQUM7SUFHakMsY0FBYyxHQUFZLElBQUksQ0FBQzt3R0E3QzNCLG1CQUFtQjs0RkFBbkIsbUJBQW1CLDJwQkNSaEMsdTJDQW9CYzs7NEZEWkQsbUJBQW1CO2tCQUwvQixTQUFTOytCQUNFLGFBQWE7OEJBTWhCLGNBQWM7c0JBRHBCLEtBQUs7Z0JBSUMsdUJBQXVCO3NCQUQ3QixLQUFLO2dCQUlDLFdBQVc7c0JBRGpCLEtBQUs7Z0JBSUMsVUFBVTtzQkFEaEIsS0FBSztnQkFLQyxzQkFBc0I7c0JBRDVCLEtBQUs7Z0JBSUMsYUFBYTtzQkFEbkIsS0FBSztnQkFJQyxvQkFBb0I7c0JBRDFCLEtBQUs7Z0JBSUMsb0JBQW9CO3NCQUQxQixLQUFLO2dCQUlDLGlCQUFpQjtzQkFEdkIsS0FBSztnQkFJQyxrQkFBa0I7c0JBRHhCLEtBQUs7Z0JBSUMsdUJBQXVCO3NCQUQ3QixLQUFLO2dCQUlDLG9CQUFvQjtzQkFEMUIsS0FBSztnQkFJQyxnQkFBZ0I7c0JBRHRCLEtBQUs7Z0JBSUMsZ0JBQWdCO3NCQUR0QixLQUFLO2dCQUlDLGNBQWM7c0JBRHBCLEtBQUsiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb21wb25lbnQsIElucHV0LCBUZW1wbGF0ZVJlZiB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgUmVzcG9uc2l2ZVZpc2liaWxpdHkgfSBmcm9tICcuLi8uLi9yZXNwb25zaXZlLXZpc2liaWxpdHknO1xuXG5AQ29tcG9uZW50KHtcbiAgc2VsZWN0b3I6ICdwZGYtZmluZGJhcicsXG4gIHRlbXBsYXRlVXJsOiAnLi9wZGYtZmluZGJhci5jb21wb25lbnQuaHRtbCcsXG4gIHN0eWxlVXJsczogWycuL3BkZi1maW5kYmFyLmNvbXBvbmVudC5jc3MnXSxcbn0pXG5leHBvcnQgY2xhc3MgUGRmRmluZGJhckNvbXBvbmVudCB7XG4gIEBJbnB1dCgpXG4gIHB1YmxpYyBzaG93RmluZEJ1dHRvbjogUmVzcG9uc2l2ZVZpc2liaWxpdHkgPSB0cnVlO1xuXG4gIEBJbnB1dCgpXG4gIHB1YmxpYyBtb2JpbGVGcmllbmRseVpvb21TY2FsZTogbnVtYmVyO1xuXG4gIEBJbnB1dCgpXG4gIHB1YmxpYyBmaW5kYmFyTGVmdDogc3RyaW5nIHwgdW5kZWZpbmVkO1xuXG4gIEBJbnB1dCgpXG4gIHB1YmxpYyBmaW5kYmFyVG9wOiBzdHJpbmcgfCB1bmRlZmluZWQ7XG5cbiAgLyogVUkgdGVtcGxhdGVzICovXG4gIEBJbnB1dCgpXG4gIHB1YmxpYyBjdXN0b21GaW5kYmFySW5wdXRBcmVhOiBUZW1wbGF0ZVJlZjxhbnk+IHwgdW5kZWZpbmVkO1xuXG4gIEBJbnB1dCgpXG4gIHB1YmxpYyBjdXN0b21GaW5kYmFyOiBUZW1wbGF0ZVJlZjxhbnk+O1xuXG4gIEBJbnB1dCgpXG4gIHB1YmxpYyBjdXN0b21GaW5kYmFyQnV0dG9uczogVGVtcGxhdGVSZWY8YW55PiB8IHVuZGVmaW5lZDtcblxuICBASW5wdXQoKVxuICBwdWJsaWMgc2hvd0ZpbmRIaWdobGlnaHRBbGwgPSB0cnVlO1xuXG4gIEBJbnB1dCgpXG4gIHB1YmxpYyBzaG93RmluZE1hdGNoQ2FzZSA9IHRydWU7XG5cbiAgQElucHV0KClcbiAgcHVibGljIHNob3dGaW5kRW50aXJlV29yZCA9IHRydWU7XG5cbiAgQElucHV0KClcbiAgcHVibGljIHNob3dGaW5kTWF0Y2hEaWFjcml0aWNzID0gdHJ1ZTtcblxuICBASW5wdXQoKVxuICBwdWJsaWMgc2hvd0ZpbmRSZXN1bHRzQ291bnQgPSB0cnVlO1xuXG4gIEBJbnB1dCgpXG4gIHB1YmxpYyBzaG93RmluZE1lc3NhZ2VzID0gdHJ1ZTtcblxuICBASW5wdXQoKVxuICBwdWJsaWMgc2hvd0ZpbmRNdWx0aXBsZTogYm9vbGVhbiA9IHRydWU7XG5cbiAgQElucHV0KClcbiAgcHVibGljIHNob3dGaW5kUmVnZXhwOiBib29sZWFuID0gdHJ1ZTtcbn1cbiIsIjxuZy1jb250YWluZXIgW25nVGVtcGxhdGVPdXRsZXRdPVwiY3VzdG9tRmluZGJhciA/IGN1c3RvbUZpbmRiYXIgOiBkZWZhdWx0RmluZGJhclwiPiA8L25nLWNvbnRhaW5lcj5cblxuPG5nLXRlbXBsYXRlICNkZWZhdWx0RmluZGJhcj5cbiAgPGRpdiBjbGFzcz1cImZpbmRiYXIgaGlkZGVuIGRvb3JIYW5nZXJcIiBpZD1cImZpbmRiYXJcIiBbc3R5bGUudHJhbnNmb3JtXT1cIidzY2FsZSgnICsgbW9iaWxlRnJpZW5kbHlab29tU2NhbGUgKyAnKSdcIlxuICAgIFtzdHlsZS50cmFuc2Zvcm1PcmlnaW5dPVwiJ2xlZnQgdG9wJ1wiIFtzdHlsZS5sZWZ0XT1cImZpbmRiYXJMZWZ0XCIgW3N0eWxlLnRvcF09XCJmaW5kYmFyVG9wXCI+XG4gICAgPG5nLWNvbnRhaW5lciBbbmdUZW1wbGF0ZU91dGxldF09XCJjdXN0b21GaW5kYmFyQnV0dG9ucyA/IGN1c3RvbUZpbmRiYXJCdXR0b25zIDogZGVmYXVsdEZpbmRiYXJCdXR0b25zXCI+XG4gICAgPC9uZy1jb250YWluZXI+XG4gIDwvZGl2PlxuPC9uZy10ZW1wbGF0ZT5cblxuPG5nLXRlbXBsYXRlICNkZWZhdWx0RmluZGJhckJ1dHRvbnM+XG4gIDxwZGYtZmluZC1pbnB1dC1hcmVhIFtjdXN0b21GaW5kYmFySW5wdXRBcmVhXT1cImN1c3RvbUZpbmRiYXJJbnB1dEFyZWFcIj48L3BkZi1maW5kLWlucHV0LWFyZWE+XG4gIDxwZGYtZmluZC1oaWdobGlnaHQtYWxsIFtjbGFzcy5oaWRkZW5dPVwiIXNob3dGaW5kSGlnaGxpZ2h0QWxsXCI+PC9wZGYtZmluZC1oaWdobGlnaHQtYWxsPlxuICA8cGRmLWZpbmQtbWF0Y2gtY2FzZSBbY2xhc3MuaGlkZGVuXT1cIiFzaG93RmluZE1hdGNoQ2FzZVwiPjwvcGRmLWZpbmQtbWF0Y2gtY2FzZT5cbiAgPHBkZi1tYXRjaC1kaWFjcml0aWNzIFtjbGFzcy5oaWRkZW5dPVwiIXNob3dGaW5kTWF0Y2hEaWFjcml0aWNzXCI+PC9wZGYtbWF0Y2gtZGlhY3JpdGljcz5cbiAgPHBkZi1maW5kLWVudGlyZS13b3JkIFtjbGFzcy5oaWRkZW5dPVwiIXNob3dGaW5kRW50aXJlV29yZFwiPjwvcGRmLWZpbmQtZW50aXJlLXdvcmQ+XG4gIDxwZGYtZmluZC1tdWx0aXBsZSBbY2xhc3MuaGlkZGVuXT1cIiFzaG93RmluZE11bHRpcGxlXCI+PC9wZGYtZmluZC1tdWx0aXBsZT5cbiAgPHBkZi1maW5kLXJlZ2V4cCBbY2xhc3MuaGlkZGVuXT1cIiFzaG93RmluZFJlZ2V4cFwiPjwvcGRmLWZpbmQtcmVnZXhwPlxuICA8cGRmLWZpbmQtcmVzdWx0cy1jb3VudCBbY2xhc3MuaGlkZGVuXT1cIiFzaG93RmluZFJlc3VsdHNDb3VudFwiPjwvcGRmLWZpbmQtcmVzdWx0cy1jb3VudD5cbiAgPHBkZi1maW5kYmFyLW1lc3NhZ2UtY29udGFpbmVyIFtjbGFzcy5oaWRkZW5dPVwiIXNob3dGaW5kTWVzc2FnZXNcIj48L3BkZi1maW5kYmFyLW1lc3NhZ2UtY29udGFpbmVyPlxuPC9uZy10ZW1wbGF0ZT4iXX0=