import {
  Component,
  input,
  model,
  inject,
  signal,
  forwardRef,
  output,
  effect,
  Input,
  Output,
  EventEmitter
} from '@angular/core';
import { Validations } from '../../validations'; // Adjust path as necessary
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';
import { SharedModule } from '../../shared/shared.module';
const CUSTOM_VALUE_ACCESSOR: any = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => SelectComponent), // Reference the class named 'Input'
  multi: true,
};

@Component({
  selector: 'hqms-select',
  imports: [SharedModule],
  template: ` <div class="row">
    <div class="col-md-12 col-12">
      <div class="form-group">
        <div class="d-flex justify-content-between align-items-center" >
        @if(isLabelShow()){
          <label for="roleName">{{ labelName() }}</label>
        }

        </div>
         <div style="position: relative;display:inline-block;width:100%">
        <p-select
          [options]="selectOptions"
          [(ngModel)]="value"
          [placeholder]="'Select ' + labelName()"
          class="form-control"
          (ngModelChange)="onValueChange($event)"
          (onBlur)="onBlur()"
          [name]="fieldName()"
           [showClear]="showClear()"
           [filter]="true"
          [disabled]="isDisabled()"
          (onClear)="onClearClick()"
        />
         <div style=" position: absolute;
                            top: 0;
                            right: 0;
                            width: 0;
                            height: 0;
                            border-top: 12px solid red;
                            border-left: 12px solid transparent;"></div>
        </div>
        @if (showOwnError() && touched() && hasError()) {
        <small class="error"> {{ currentError()!.message }} </small>
        }
      </div>
    </div>
  </div>`,
  styles: `
    .error {
      color : red;
      font-weight :bold;
       font-size: 12px;
    }
    .form-group {
                margin-bottom: 15px;
                label {
                    font-size: 14px;
                    color: #0E2024;
                    width: 100%;
                    margin-bottom: 5px;
                }
                .form-control {
                    background: #EBF2FA;
                    border-color: #EBF2FA;
                    height: 45px;
                    border-radius: 6px;
                    box-shadow: none !important;
                    outline: none !important;
                    font-size: 14px;
                    color: #0E2024;
                }
            }
  `,
  providers: [CUSTOM_VALUE_ACCESSOR],
})
export class SelectComponent implements ControlValueAccessor {
  @Input() selectOptions: any = [];
  @Output() onClearEmit = new EventEmitter();
  private readonly validationService = inject(Validations);
  statusChange = output<{
    fieldName: string;
    value: any;
    isValid: boolean;
    isTouched: boolean;
  }>();
  // --- External Callbacks (Functions received from Angular Forms) ---
  private onChange = (val: any) => { };
  private onTouched = () => { }; // --- INPUTS & STATE ---

  labelName = input.required<string>();
  formName = input.required<string>();
  fieldName = input.required<string>();
  value = model<any>(null);
  touched = signal<boolean>(false);
  hasError = signal<boolean>(false);
  currentError = signal<{ errorKey: string; message: string } | null>(null);
  isDisabled = input.required<boolean>(); // Tracks disabled state
  isLabelShow = input<boolean>(true); // Tracks disabled state
  isMandatory = input<boolean>(true); // Tracks disabled state
  showClear =  model<any>(false);
  // When false, this component never runs its own Validations-service check
  // or shows its own error message — the parent page owns validation and
  // error display entirely instead. Default true preserves existing
  // behavior for every page that doesn't opt out.
  showOwnError = input<boolean>(true);
  // =========================================================
  // === CONTROL VALUE ACCESSOR (CVA) REQUIRED METHODS =======
  // =========================================================

  // 1. Called by Angular Forms to write a value into the component.
  writeValue(value: any): void {
    this.value.set(value || '');
    if (value) {
      this.runValidation(value);
    }
  }

  // 2. Registers a function to call when the control's value changes.
  registerOnChange(fn: (value: any) => void): void {
    this.onChange = fn;
  }

  // 3. Registers a function to call when the control is touched (blurred).
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  constructor() {
    // effect(() => {
    //   this.statusChange.emit({
    //     fieldName: this.fieldName(),
    //     value: this.value(),
    //     isValid: !this.hasError(),
    //     isTouched: this.touched(),
    //   });
    // });
  }
  // =========================================================
  // === COMPONENT EVENT HANDLERS (Modified for CVA) =========
  // =========================================================
  onValueChange(newValue: any) {
    this.value.set(newValue);
    this.onChange(newValue);
    if (this.touched()) {
      this.runValidation(newValue);
       this.statusChange.emit({
        fieldName: this.fieldName(),
        value: this.value(),
        isValid: !this.hasError(),
        isTouched: this.touched(),
      });
    }
  }

  onBlur() {
    this.touched.set(true);
    this.onTouched();
    this.runValidation(this.value());
  }

  public markAsTouchedAndValidate() {
    this.touched.set(true);
    this.onTouched();
    this.runValidation(this.value());
  }

  private runValidation(value: string) {
    if (!this.showOwnError()) return;
    const errorResult = this.validationService.validateField(
      this.formName(),
      this.fieldName(),
      value
    );
    if (errorResult) {
      this.currentError.set(errorResult);
      this.hasError.set(true);
    } else {
      this.currentError.set(null);
      this.hasError.set(false);
    }
  }

  onClearClick(){
    this.onClearEmit.emit(true)
  }
}
