import { Validator, ValidationResult } from '../types';

// Strategy Pattern: algoritmo "required" encapsulado como classe independente
export class RequiredValidator implements Validator {
  readonly name = 'required';
  private readonly message: string;

  constructor(message = 'This field is required') {
    this.message = message;
  }

  validate(value: unknown): ValidationResult {
    const isEmpty =
      value === null ||
      value === undefined ||
      value === '' ||
      (Array.isArray(value) && value.length === 0);

    return isEmpty
      ? { valid: false, message: this.message }
      : { valid: true };
  }
}
