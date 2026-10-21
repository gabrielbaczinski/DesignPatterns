import { Validator, ValidationResult } from '../types';

export class RegexValidator implements Validator {
  readonly name = 'regex';
  private readonly pattern: RegExp;
  private readonly message: string;

  constructor(pattern: RegExp, message = 'Invalid format') {
    this.pattern = pattern;
    this.message = message;
  }

  validate(value: unknown): ValidationResult {
    if (value === null || value === undefined || value === '') return { valid: true };
    return this.pattern.test(String(value))
      ? { valid: true }
      : { valid: false, message: this.message };
  }
}
