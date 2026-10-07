import {
  Component,
  input,
  model,
  inject,
  signal,
  forwardRef,
  output,
  effect,
} from '@angular/core';
import { Validations } from '../../validations'; // Adjust path as necessary
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';
import { SharedModule } from '../../shared/shared.module';

const CUSTOM_VALUE_ACCESSOR: any = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => CheckboxComponent), // Reference the class named 'Input'
  multi: true,
};
@Component({
  selector: 'hqms-checkbox',
  imports: [SharedModule],
  template: `
        <div class="form-check">
          <input type="checkbox"
            [ngModel]="value()" class="form-check-input"
            [name]="fieldName()" [disabled]="isDisabled()"
            (change)="onValueChange($event)" id="checkChecked"
          />
          <label for="checkChecked" class="form-check-label">{{ labelName() }}</label>
           @if (showOwnError() && touched() && hasError()) {
           <small class="error"> {{ currentError()!.message }} </small>
           }
        </div>
    `,
    styles : `.form-check {
                label {
                    font-size: 14px;
                    color: #0E2024;
                }
                .form-check-input {
                    box-shadow: none;
                    outline: none;
                }
            }  `,
  providers: [CUSTOM_VALUE_ACCESSOR],
})
export class CheckboxComponent implements ControlValueAccessor {
  private readonly validationService = inject(Validations);
  statusChange = output<{
    fieldName: string;
    isValid: boolean;
    isTouched: boolean;
  }>();
  // --- External Callbacks (Functions received from Angular Forms) ---
  private onChange = (val: any) => { };
  private onTouched = () => { }; // --- INPUTS & STATE ---

  labelName = input.required<string>();
  formName = input.required<string>();
  fieldName = input.required<string>();
  value = model<boolean>(false);
  touched = signal<boolean>(false);
  hasError = signal<boolean>(false);
  currentError = signal<{ errorKey: string; message: string } | null>(null);
  isDisabled = input.required<boolean>(); // Tracks disabled state
  showOwnError = input<boolean>(true);

  writeValue(value: any): void {
    this.value.set(value || false);
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
    console.log("newValue ",newValue);
    this.value.set(newValue);
    this.onChange(newValue);
    if (this.touched()) {
      this.runValidation(newValue);
    }
  }

  public markAsTouchedAndValidate(): void {
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

