import { Validator, ValidationResult } from '../types';

export class MaxLengthValidator implements Validator {
  readonly name = 'maxLength';
  private readonly max: number;
  private readonly message: string;

  constructor(max: number, message?: string) {
    this.max = max;
    this.message = message ?? `Maximum length is ${max} characters`;
  }

  validate(value: unknown): ValidationResult {
    if (value === null || value === undefined || value === '') return { valid: true };
    const length = String(value).length;
    return length <= this.max
      ? { valid: true }
      : { valid: false, message: this.message };
  }
}
