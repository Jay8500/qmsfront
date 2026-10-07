import {
  Component,
  input,
  model,
  inject,
  signal,
  forwardRef,
  output,
  effect,Input
} from '@angular/core';
import { Validations } from '../../validations'; // Adjust path as necessary
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';
import { SharedModule } from '../../shared/shared.module';

const CUSTOM_VALUE_ACCESSOR: any = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => DateComponent), // Reference the class named 'Input'
  multi: true,
};
@Component({
  selector: 'hqms-date',
  imports: [SharedModule],
  template: `
    <div class="row">
      <div class="col-md-12 col-12">
        <div class="form-group">
            <div class="d-flex justify-content-between align-items-center" >
        @if(isLabelShow()){
          <label for="roleName">{{ labelName() }}</label>
        }

        </div>
        <div style="position: relative;display:inline-block;width:100%">
          <input [type]="defaulyComponentType()" class="form-control"
          [(ngModel)]="value"
          (ngModelChange)="onValueChange($event)"
          (blur)="onBlur()"
          [name]="fieldName()"
          [placeholder]="labelName()"
          [disabled]="isDisabled()" [min]="minDate()" [max]="maxDate()"/>
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
    </div>
  `,
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
export class DateComponent implements ControlValueAccessor {
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
  formName =  input.required<string>();
  fieldName = input.required<string>();
  minDate:any = input<any>(null);
  maxDate:any = input<any>(null);
 @Input() value:any =null;
  touched = signal<boolean>(false);
  hasError = signal<boolean>(false);
  currentError = signal<{ errorKey: string; message: string } | null>(null);
  isDisabled = input.required<boolean>(); // Tracks disabled state
  isLabelShow = input<boolean>(true); // Tracks disabled state
  isMandatory = input<boolean>(true); // Tracks disabled state
  defaulyComponentType = input<string>("date"); // Tracks disabled state
  showOwnError = input<boolean>(true);

  writeValue(value: any): void {
    this.value= value || '';
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
    // effect(() => {
    //   this.statusChange.emit({
    //     fieldName: this.fieldName(),
    //     isValid: !this.hasError(),
    //     isTouched: this.touched(),
    //   });
    // });
  }


  onValueChange(newValue: string) {
    this.value=newValue;
    this.runValidation(newValue);
    this.onChange(newValue);
    this.statusChange.emit({
        fieldName: this.fieldName(),
        isValid: !this.hasError(),
        isTouched: this.touched(),
    });
  }

  onBlur() {

    this.touched.set(true);
    this.onTouched();
    this.runValidation(this.value);
  }

  public markAsTouchedAndValidate() {
    this.touched.set(true);
    this.onTouched();
    this.runValidation(this.value);
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
    };
  }
}

