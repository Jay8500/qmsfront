import {
  zindexutils
} from "./chunk-NALEIRKL.js";
import {
  BaseComponent,
  PARENT_INSTANCE
} from "./chunk-BPOVKMEI.js";
import {
  BaseStyle
} from "./chunk-LKPDQWVH.js";
import {
  PrimeTemplate,
  SharedModule
} from "./chunk-CKIUYQGF.js";
import {
  Bind
} from "./chunk-GTLP5B3U.js";
import {
  dt,
  lt
} from "./chunk-Y5ZV6UA3.js";
import {
  CommonModule,
  NgTemplateOutlet,
  isPlatformBrowser
} from "./chunk-CTIYIVGR.js";
import "./chunk-QVAR6IHG.js";
import {
  ChangeDetectionStrategy,
  Component,
  ContentChild,
  ContentChildren,
  Injectable,
  InjectionToken,
  Input,
  NgModule,
  ViewEncapsulation,
  booleanAttribute,
  inject,
  numberAttribute,
  setClassMetadata,
  ɵɵHostDirectivesFeature,
  ɵɵInheritDefinitionFeature,
  ɵɵProvidersFeature,
  ɵɵadvance,
  ɵɵattribute,
  ɵɵclassMap,
  ɵɵcontentQuery,
  ɵɵdefineComponent,
  ɵɵdefineInjectable,
  ɵɵdefineInjector,
  ɵɵdefineNgModule,
  ɵɵelementContainer,
  ɵɵgetInheritedFactory,
  ɵɵloadQuery,
  ɵɵprojection,
  ɵɵprojectionDef,
  ɵɵproperty,
  ɵɵqueryRefresh,
  ɵɵtemplate
} from "./chunk-BZQAI6PH.js";
import "./chunk-RSS3ODKE.js";
import "./chunk-IMDIBY5Y.js";

// node_modules/@primeuix/styles/dist/blockui/index.mjs
var style = "\n    .p-blockui {\n        position: relative;\n    }\n\n    .p-blockui-mask {\n        border-radius: dt('blockui.border.radius');\n    }\n\n    .p-blockui-mask.p-overlay-mask {\n        position: absolute;\n    }\n\n    .p-blockui-mask-document.p-overlay-mask {\n        position: fixed;\n    }\n";

// node_modules/primeng/fesm2022/primeng-blockui.mjs
var _c0 = ["content"];
var _c1 = ["*"];
function BlockUI_ng_container_1_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementContainer(0);
  }
}
var classes = {
  root: ({
    instance
  }) => ["p-blockui p-blockui-mask", {
    "p-blockui-mask-document": !instance.target
  }]
};
var BlockUiStyle = class _BlockUiStyle extends BaseStyle {
  name = "blockui";
  style = style;
  classes = classes;
  static ɵfac = /* @__PURE__ */ (() => {
    let ɵBlockUiStyle_BaseFactory;
    return function BlockUiStyle_Factory(__ngFactoryType__) {
      return (ɵBlockUiStyle_BaseFactory || (ɵBlockUiStyle_BaseFactory = ɵɵgetInheritedFactory(_BlockUiStyle)))(__ngFactoryType__ || _BlockUiStyle);
    };
  })();
  static ɵprov = ɵɵdefineInjectable({
    token: _BlockUiStyle,
    factory: _BlockUiStyle.ɵfac
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(BlockUiStyle, [{
    type: Injectable
  }], null, null);
})();
var BlockUIClasses;
(function(BlockUIClasses2) {
  BlockUIClasses2["root"] = "p-blockui";
})(BlockUIClasses || (BlockUIClasses = {}));
var BLOCKUI_INSTANCE = new InjectionToken("BLOCKUI_INSTANCE");
var BlockUI = class _BlockUI extends BaseComponent {
  componentName = "BlockUI";
  $pcBlockUI = inject(BLOCKUI_INSTANCE, {
    optional: true,
    skipSelf: true
  }) ?? void 0;
  bindDirectiveInstance = inject(Bind, {
    self: true
  });
  onAfterViewChecked() {
    this.bindDirectiveInstance.setAttrs(this.ptms(["host", "root"]));
  }
  /**
   * Name of the local ng-template variable referring to another component.
   * @group Props
   */
  target;
  /**
   * Whether to automatically manage layering.
   * @group Props
   */
  autoZIndex = true;
  /**
   * Base zIndex value to use in layering.
   * @group Props
   */
  baseZIndex = 0;
  /**
   * Class of the element.
   * @deprecated since v20.0.0, use `class` instead.
   * @group Props
   */
  styleClass;
  /**
   * Current blocked state as a boolean.
   * @group Props
   */
  get blocked() {
    return this._blocked;
  }
  set blocked(val) {
    if (this.el && this.el.nativeElement) {
      if (val) {
        this.block();
      } else if (this._blocked) {
        this.unblock();
      }
    } else {
      this._blocked = val;
    }
  }
  /**
   * template of the content
   * @group Templates
   */
  contentTemplate;
  _blocked = false;
  animationEndListener;
  _componentStyle = inject(BlockUiStyle);
  constructor() {
    super();
  }
  onAfterViewInit() {
    if (this._blocked) this.block();
    if (this.target && !this.target.getBlockableElement) {
      throw "Target of BlockUI must implement BlockableUI interface";
    }
  }
  _contentTemplate;
  templates;
  onAfterContentInit() {
    this.templates.forEach((item) => {
      switch (item.getType()) {
        case "content":
          this.contentTemplate = item.template;
          break;
        default:
          this.contentTemplate = item.template;
          break;
      }
    });
  }
  block() {
    if (isPlatformBrowser(this.platformId)) {
      this._blocked = true;
      this.el.nativeElement.style.display = "flex";
      if (this.target) {
        this.target.getBlockableElement().appendChild(this.el.nativeElement);
        this.target.getBlockableElement().style.position = "relative";
      } else {
        this.renderer.appendChild(this.document.body, this.el.nativeElement);
        lt();
      }
      if (this.autoZIndex) {
        zindexutils.set("modal", this.el.nativeElement, this.baseZIndex + this.config.zIndex.modal);
      }
      this.renderer.addClass(this.el.nativeElement, "p-overlay-mask");
      this.renderer.addClass(this.el.nativeElement, "p-overlay-mask-enter-active");
    }
  }
  unblock() {
    if (isPlatformBrowser(this.platformId) && this.el && this._blocked) {
      this._blocked = false;
      if (!this.animationEndListener) {
        this.animationEndListener = this.renderer.listen(this.el.nativeElement, "animationend", this.destroyModal.bind(this));
      }
      this.renderer.removeClass(this.el.nativeElement, "p-overlay-mask-enter-active");
      this.renderer.addClass(this.el.nativeElement, "p-overlay-mask-leave-active");
    }
  }
  destroyModal() {
    this._blocked = false;
    if (this.el && isPlatformBrowser(this.platformId)) {
      this.el.nativeElement.style.display = "none";
      this.renderer.removeClass(this.el.nativeElement, "p-overlay-mask");
      this.renderer.removeClass(this.el.nativeElement, "p-overlay-mask-leave-active");
      zindexutils.clear(this.el.nativeElement);
      if (!this.target) {
        this.document.body.removeChild(this.el.nativeElement);
        dt();
      }
    }
    this.unbindAnimationEndListener();
    this.cd.markForCheck();
  }
  unbindAnimationEndListener() {
    if (this.animationEndListener && this.el) {
      this.animationEndListener();
      this.animationEndListener = null;
    }
  }
  onDestroy() {
    if (this._blocked) {
      this._blocked = false;
      if (this.el && isPlatformBrowser(this.platformId)) {
        zindexutils.clear(this.el.nativeElement);
        if (!this.target) {
          dt();
        }
      }
      this.unbindAnimationEndListener();
    }
  }
  static ɵfac = function BlockUI_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _BlockUI)();
  };
  static ɵcmp = ɵɵdefineComponent({
    type: _BlockUI,
    selectors: [["p-blockUI"], ["p-blockui"], ["p-block-ui"]],
    contentQueries: function BlockUI_ContentQueries(rf, ctx, dirIndex) {
      if (rf & 1) {
        ɵɵcontentQuery(dirIndex, _c0, 4)(dirIndex, PrimeTemplate, 4);
      }
      if (rf & 2) {
        let _t;
        ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.contentTemplate = _t.first);
        ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.templates = _t);
      }
    },
    hostVars: 3,
    hostBindings: function BlockUI_HostBindings(rf, ctx) {
      if (rf & 2) {
        ɵɵattribute("aria-busy", ctx.blocked);
        ɵɵclassMap(ctx.cn(ctx.cx("root"), ctx.styleClass));
      }
    },
    inputs: {
      target: "target",
      autoZIndex: [2, "autoZIndex", "autoZIndex", booleanAttribute],
      baseZIndex: [2, "baseZIndex", "baseZIndex", numberAttribute],
      styleClass: "styleClass",
      blocked: [2, "blocked", "blocked", booleanAttribute]
    },
    features: [ɵɵProvidersFeature([BlockUiStyle, {
      provide: BLOCKUI_INSTANCE,
      useExisting: _BlockUI
    }, {
      provide: PARENT_INSTANCE,
      useExisting: _BlockUI
    }]), ɵɵHostDirectivesFeature([Bind]), ɵɵInheritDefinitionFeature],
    ngContentSelectors: _c1,
    decls: 2,
    vars: 1,
    consts: [[4, "ngTemplateOutlet"]],
    template: function BlockUI_Template(rf, ctx) {
      if (rf & 1) {
        ɵɵprojectionDef();
        ɵɵprojection(0);
        ɵɵtemplate(1, BlockUI_ng_container_1_Template, 1, 0, "ng-container", 0);
      }
      if (rf & 2) {
        ɵɵadvance();
        ɵɵproperty("ngTemplateOutlet", ctx.contentTemplate || ctx._contentTemplate);
      }
    },
    dependencies: [CommonModule, NgTemplateOutlet, SharedModule],
    encapsulation: 2,
    changeDetection: 0
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(BlockUI, [{
    type: Component,
    args: [{
      selector: "p-blockUI, p-blockui, p-block-ui",
      standalone: true,
      imports: [CommonModule, SharedModule],
      template: `
        <ng-content></ng-content>
        <ng-container *ngTemplateOutlet="contentTemplate || _contentTemplate"></ng-container>
    `,
      changeDetection: ChangeDetectionStrategy.OnPush,
      encapsulation: ViewEncapsulation.None,
      providers: [BlockUiStyle, {
        provide: BLOCKUI_INSTANCE,
        useExisting: BlockUI
      }, {
        provide: PARENT_INSTANCE,
        useExisting: BlockUI
      }],
      host: {
        "[attr.aria-busy]": "blocked",
        "[class]": "cn(cx('root'), styleClass)"
      },
      hostDirectives: [Bind]
    }]
  }], () => [], {
    target: [{
      type: Input
    }],
    autoZIndex: [{
      type: Input,
      args: [{
        transform: booleanAttribute
      }]
    }],
    baseZIndex: [{
      type: Input,
      args: [{
        transform: numberAttribute
      }]
    }],
    styleClass: [{
      type: Input
    }],
    blocked: [{
      type: Input,
      args: [{
        transform: booleanAttribute
      }]
    }],
    contentTemplate: [{
      type: ContentChild,
      args: ["content", {
        descendants: false
      }]
    }],
    templates: [{
      type: ContentChildren,
      args: [PrimeTemplate]
    }]
  });
})();
var BlockUIModule = class _BlockUIModule {
  static ɵfac = function BlockUIModule_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _BlockUIModule)();
  };
  static ɵmod = ɵɵdefineNgModule({
    type: _BlockUIModule,
    imports: [BlockUI, SharedModule],
    exports: [BlockUI, SharedModule]
  });
  static ɵinj = ɵɵdefineInjector({
    imports: [BlockUI, SharedModule, SharedModule]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(BlockUIModule, [{
    type: NgModule,
    args: [{
      imports: [BlockUI, SharedModule],
      exports: [BlockUI, SharedModule]
    }]
  }], null, null);
})();
export {
  BlockUI,
  BlockUIClasses,
  BlockUIModule,
  BlockUiStyle
};
//# sourceMappingURL=primeng_blockui.js.map
