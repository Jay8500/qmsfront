import {
  $t,
  xt
} from "./chunk-Y5ZV6UA3.js";
import {
  NG_VALIDATORS
} from "./chunk-23W3ULGX.js";
import {
  isPlatformBrowser
} from "./chunk-CTIYIVGR.js";
import "./chunk-QVAR6IHG.js";
import {
  DOCUMENT,
  Directive,
  ElementRef,
  EventEmitter,
  HostListener,
  Inject,
  Input,
  NgModule,
  Output,
  PLATFORM_ID,
  booleanAttribute,
  forwardRef,
  setClassMetadata,
  ɵɵProvidersFeature,
  ɵɵdefineDirective,
  ɵɵdefineInjector,
  ɵɵdefineNgModule,
  ɵɵdirectiveInject,
  ɵɵlistener
} from "./chunk-BZQAI6PH.js";
import "./chunk-RSS3ODKE.js";
import "./chunk-IMDIBY5Y.js";

// node_modules/primeng/fesm2022/primeng-keyfilter.mjs
var KEYFILTER_VALIDATOR = {
  provide: NG_VALIDATORS,
  useExisting: forwardRef(() => KeyFilter),
  multi: true
};
var DEFAULT_MASKS = {
  pint: /^[\d]*$/,
  int: /^[-]?[\d]*$/,
  pnum: /^[\d\.]*$/,
  money: /^[\d\.\s,]*$/,
  num: /^[-]?[\d\.]*$/,
  hex: /^[0-9a-f]*$/i,
  email: /^[a-z0-9_\.\-@]*$/i,
  alpha: /^[a-z_]*$/i,
  alphanum: /^[a-z0-9_]*$/i
};
var KEYS = {
  TAB: 9,
  RETURN: 13,
  ESC: 27,
  BACKSPACE: 8,
  DELETE: 46
};
var SAFARI_KEYS = {
  63234: 37,
  // left
  63235: 39,
  // right
  63232: 38,
  // up
  63233: 40,
  // down
  63276: 33,
  // page up
  63277: 34,
  // page down
  63272: 46,
  // delete
  63273: 36,
  // home
  63275: 35
  // end
};
var KeyFilter = class _KeyFilter {
  document;
  platformId;
  el;
  /**
   * When enabled, instead of blocking keys, input is validated internally to test against the regular expression.
   * @group Props
   */
  pValidateOnly;
  /**
   * Sets the pattern for key filtering.
   * @group Props
   */
  set pattern(_pattern) {
    this._pattern = _pattern;
    if (_pattern instanceof RegExp) {
      this.regex = _pattern;
    } else if (_pattern && _pattern in DEFAULT_MASKS) {
      this.regex = DEFAULT_MASKS[_pattern];
    } else {
      this.regex = /./;
    }
  }
  get pattern() {
    return this._pattern;
  }
  /**
   * Emits a value whenever the ngModel of the component changes.
   * @param {(string | number)} modelValue - Custom model change event.
   * @group Emits
   */
  ngModelChange = new EventEmitter();
  regex = /./;
  _pattern;
  isAndroid;
  lastValue;
  constructor(document, platformId, el) {
    this.document = document;
    this.platformId = platformId;
    this.el = el;
    if (isPlatformBrowser(this.platformId)) {
      this.isAndroid = $t();
    } else {
      this.isAndroid = false;
    }
  }
  isNavKeyPress(e) {
    let k = e.keyCode;
    k = xt().safari ? SAFARI_KEYS[k] || k : k;
    return k >= 33 && k <= 40 || k == KEYS.RETURN || k == KEYS.TAB || k == KEYS.ESC;
  }
  isSpecialKey(e) {
    let k = e.keyCode || e.charCode;
    return k == 9 || k == 13 || k == 27 || k == 16 || k == 17 || k >= 18 && k <= 20 || xt().opera && !e.shiftKey && (k == 8 || k >= 33 && k <= 35 || k >= 36 && k <= 39 || k >= 44 && k <= 45);
  }
  getKey(e) {
    let k = e.keyCode || e.charCode;
    return xt().safari ? SAFARI_KEYS[k] || k : k;
  }
  getCharCode(e) {
    return e.charCode || e.keyCode || e.which;
  }
  findDelta(value, prevValue) {
    let delta = "";
    for (let i = 0; i < value.length; i++) {
      let str = value.substr(0, i) + value.substr(i + value.length - prevValue.length);
      if (str === prevValue) delta = value.substr(i, value.length - prevValue.length);
    }
    return delta;
  }
  isValidChar(c) {
    return this.regex.test(c);
  }
  isValidString(str) {
    for (let i = 0; i < str.length; i++) {
      if (!this.isValidChar(str.substr(i, 1))) {
        return false;
      }
    }
    return true;
  }
  onInput(e) {
    if (this.isAndroid && !this.pValidateOnly) {
      let val = this.el.nativeElement.value;
      let lastVal = this.lastValue || "";
      let inserted = this.findDelta(val, lastVal);
      let removed = this.findDelta(lastVal, val);
      let pasted = inserted.length > 1 || !inserted && !removed;
      if (pasted) {
        if (!this.isValidString(val)) {
          this.el.nativeElement.value = lastVal;
          this.ngModelChange.emit(lastVal);
        }
      } else if (!removed) {
        if (!this.isValidChar(inserted)) {
          this.el.nativeElement.value = lastVal;
          this.ngModelChange.emit(lastVal);
        }
      }
      val = this.el.nativeElement.value;
      if (this.isValidString(val)) {
        this.lastValue = val;
      }
    }
  }
  onKeyPress(e) {
    if (this.isAndroid || this.pValidateOnly) {
      return;
    }
    let browser = xt();
    let k = this.getKey(e);
    if (browser.mozilla && (e.ctrlKey || e.altKey)) {
      return;
    } else if (k == 17 || k == 18) {
      return;
    }
    if (k == 13) {
      return;
    }
    let c = this.getCharCode(e);
    let cc = String.fromCharCode(c);
    let ok = true;
    if (!browser.mozilla && (this.isSpecialKey(e) || !cc)) {
      return;
    }
    let existingValue = this.el.nativeElement.value || "";
    let combinedValue = existingValue + cc;
    ok = this.regex.test(combinedValue);
    if (!ok) {
      e.preventDefault();
    }
  }
  onPaste(e) {
    let clipboardData = e.clipboardData;
    if (!clipboardData && this.document.defaultView) {
      const windowClipboard = this.document.defaultView.clipboardData;
      if (windowClipboard) {
        clipboardData = {
          getData: (_format) => windowClipboard.getData("text")
        };
      }
    }
    if (clipboardData) {
      let pattern = /\{[0-9]+\}/;
      const pastedText = clipboardData.getData("text");
      if (pattern.test(this.regex.toString())) {
        if (!this.regex.test(pastedText)) {
          e.preventDefault();
          return;
        }
      } else {
        for (let char of pastedText.toString()) {
          if (!this.regex.test(char)) {
            e.preventDefault();
            return;
          }
        }
      }
    }
  }
  validate(_c) {
    if (this.pValidateOnly) {
      let value = this.el.nativeElement.value;
      if (value && !this.regex.test(value)) {
        return {
          validatePattern: false
        };
      }
    }
  }
  static ɵfac = function KeyFilter_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _KeyFilter)(ɵɵdirectiveInject(DOCUMENT), ɵɵdirectiveInject(PLATFORM_ID), ɵɵdirectiveInject(ElementRef));
  };
  static ɵdir = ɵɵdefineDirective({
    type: _KeyFilter,
    selectors: [["", "pKeyFilter", ""]],
    hostBindings: function KeyFilter_HostBindings(rf, ctx) {
      if (rf & 1) {
        ɵɵlistener("input", function KeyFilter_input_HostBindingHandler($event) {
          return ctx.onInput($event);
        })("keypress", function KeyFilter_keypress_HostBindingHandler($event) {
          return ctx.onKeyPress($event);
        })("paste", function KeyFilter_paste_HostBindingHandler($event) {
          return ctx.onPaste($event);
        });
      }
    },
    inputs: {
      pValidateOnly: [2, "pValidateOnly", "pValidateOnly", booleanAttribute],
      pattern: [0, "pKeyFilter", "pattern"]
    },
    outputs: {
      ngModelChange: "ngModelChange"
    },
    features: [ɵɵProvidersFeature([KEYFILTER_VALIDATOR])]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(KeyFilter, [{
    type: Directive,
    args: [{
      selector: "[pKeyFilter]",
      standalone: true,
      providers: [KEYFILTER_VALIDATOR]
    }]
  }], () => [{
    type: Document,
    decorators: [{
      type: Inject,
      args: [DOCUMENT]
    }]
  }, {
    type: void 0,
    decorators: [{
      type: Inject,
      args: [PLATFORM_ID]
    }]
  }, {
    type: ElementRef
  }], {
    pValidateOnly: [{
      type: Input,
      args: [{
        transform: booleanAttribute
      }]
    }],
    pattern: [{
      type: Input,
      args: ["pKeyFilter"]
    }],
    ngModelChange: [{
      type: Output
    }],
    onInput: [{
      type: HostListener,
      args: ["input", ["$event"]]
    }],
    onKeyPress: [{
      type: HostListener,
      args: ["keypress", ["$event"]]
    }],
    onPaste: [{
      type: HostListener,
      args: ["paste", ["$event"]]
    }]
  });
})();
var KeyFilterModule = class _KeyFilterModule {
  static ɵfac = function KeyFilterModule_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _KeyFilterModule)();
  };
  static ɵmod = ɵɵdefineNgModule({
    type: _KeyFilterModule,
    imports: [KeyFilter],
    exports: [KeyFilter]
  });
  static ɵinj = ɵɵdefineInjector({});
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(KeyFilterModule, [{
    type: NgModule,
    args: [{
      imports: [KeyFilter],
      exports: [KeyFilter]
    }]
  }], null, null);
})();
export {
  KEYFILTER_VALIDATOR,
  KeyFilter,
  KeyFilterModule
};
//# sourceMappingURL=primeng_keyfilter.js.map
