import { Validator, ValidationResult } from '../types';

export class EmailValidator implements Validator {
  readonly name = 'email';
  private readonly message: string;
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  constructor(message = 'Please enter a valid email address') {
    this.message = message;
  }

  validate(value: unknown): ValidationResult {
    if (value === null || value === undefined || value === '') {
      return { valid: true }; // use RequiredValidator to enforce presence
    }
    const isValid = EmailValidator.EMAIL_REGEX.test(String(value));
    return isValid ? { valid: true } : { valid: false, message: this.message };
  }
}
