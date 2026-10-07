import { Injectable, input } from '@angular/core';
import * as validationsData from '../assets/validations.json';
const REGEX_PATTERNS: Record<string, RegExp> = {
  alphaOnly: /^[a-zA-Z\s]*$/,
  numeric: /^\d+$/,
  email: /^[^@\s]+@[^@\s]+\.[^@\s]+$/,
  length10: /^\d{10}$/,
  length1: /^\d{1}$/,
  webUrl: /^(https?.\/\/)?(www\.)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/[a-zA-Z0-9-._~:/?#[\]@!$&'()*+,;=]*)?$/,
  anythingUpto180 : /^[\s\S]{0,180}$/,
  anythingUpto500 : /^[\s\S]{0,500}$/,
  notAbove100: /^(100|[1-9]?[0-9])$/,
  minLength3: /^[\s\S]{3,}$/,
  range1to999: /^[1-9]\d{0,2}$/
};

interface ErrorMessageMap {
  [key: string]: string;
}
interface FieldConfig {
  validators: string[];
  messages: ErrorMessageMap;
}
interface FormConfig {
  [fieldName: string]: FieldConfig;
}
interface ValidationConfig {
  [formName: string]: FormConfig;
}
@Injectable({
  providedIn: 'root',
})
export class Validations {
  private readonly validationConfig: ValidationConfig = validationsData as unknown as ValidationConfig;
  constructor() { }

  private getConfig(): ValidationConfig {
    return this.validationConfig;
  }

  validateField(
    formName: string,
    fieldName: string,
    value: string | null | undefined,
    comparedKey?:any
  ): { errorKey: string; message: string } | null {
    const fieldConfig = this.getConfig()[formName]?.[fieldName];
    if (!fieldConfig) {
      return null;
    }
    const valueTrimmed = (value || '').toString().trim();
    for (const validatorKey of fieldConfig.validators) {
      if (validatorKey === 'required' && valueTrimmed.length === 0) {
        return {
          errorKey: 'required',
          message: fieldConfig.messages['required'],
        };
      };
      if (valueTrimmed.length === 0) {
        continue;
      };
      const regex = REGEX_PATTERNS[validatorKey];
       if (regex && !regex.test(valueTrimmed)) {
        return {
          errorKey: validatorKey,
          message: fieldConfig.messages[validatorKey],
        };
       };
       if(validatorKey == 'comparedKey'){
        if(parseInt(valueTrimmed)  > parseInt(comparedKey())){
         return {
          errorKey: validatorKey,
          message: fieldConfig.messages[validatorKey],
         };
        }
       };
       if(validatorKey == 'leftcomparedKey'){
        if(parseInt(valueTrimmed)  < parseInt(comparedKey())){
         return {
          errorKey: validatorKey,
          message: fieldConfig.messages[validatorKey],
         };
        }
       };
    };
    return null; // VALID
  }
}
