import { Validator, ValidationResult } from '../types';

export class MinLengthValidator implements Validator {
  readonly name = 'minLength';
  private readonly min: number;
  private readonly message: string;

  constructor(min: number, message?: string) {
    this.min = min;
    this.message = message ?? `Minimum length is ${min} characters`;
  }

  validate(value: unknown): ValidationResult {
    if (value === null || value === undefined || value === '') return { valid: true };
    const length = String(value).length;
    return length >= this.min
      ? { valid: true }
      : { valid: false, message: this.message };
  }
}
