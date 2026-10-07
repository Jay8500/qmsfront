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
} from '@angular/core';
import { Validations } from '../../validations'; // Adjust path as necessary
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';
import { SharedModule } from '../../shared/shared.module';
const CUSTOM_VALUE_ACCESSOR: any = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => MultiselectComponent), // Reference the class named 'Input'
  multi: true,
};

@Component({
  selector: 'hqms-multiselect',
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
        <p-multiselect
          [options]="selectOptions"
          [(ngModel)]="value"
          [placeholder]="'Select a ' + labelName()"
          class="form-control"
          (ngModelChange)="onValueChange($event)"
          (onBlur)="onBlur()"
          [name]="fieldName()"
          [showClear]="true"
          [disabled]="isDisabled()"
          [placeholder]="labelName()"
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
export class MultiselectComponent implements ControlValueAccessor {
  @Input() selectOptions: any = [
    {
      label: 'Test',
      value: 1,
    },
    {
      label: 'Test 1',
      value: 2,
    },
  ];
  private readonly validationService = inject(Validations);
  statusChange = output<{
   fieldName: string;
    value: any;
    isValid: boolean;
    isTouched: boolean;
  }>();
  private onChange = (val: any) => { };
  private onTouched = () => { }; // --- INPUTS & STATE ---

  labelName = input.required<string>();
  formName = input.required<string>();
  fieldName = input.required<string>();
  isDisabled = input.required<boolean>();; // Tracks disabled state
  isLabelShow = input<boolean>(true); // Tracks disabled state
  isMandatory = input<boolean>(true); // Tracks disabled state
  showOwnError = input<boolean>(true);

  value = model<any>([]);
  touched = signal<boolean>(false);
  hasError = signal<boolean>(false);
  currentError = signal<{ errorKey: string; message: string } | null>(null);

  writeValue(value: any): void {
    this.value.set(value || []);
    if (value) {
      this.runValidation(value);
    }
  }

  registerOnChange(fn: (value: any) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  constructor() {

  }

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


  private runValidation(value: any) {
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
}

