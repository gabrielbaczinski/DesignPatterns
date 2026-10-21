import { Validator, ValidationResult } from '../types';

export class RangeValidator implements Validator {
  readonly name = 'range';
  private readonly min: number;
  private readonly max: number;
  private readonly message: string;

  constructor(min: number, max: number, message?: string) {
    this.min = min;
    this.max = max;
    this.message = message ?? `Value must be between ${min} and ${max}`;
  }

  validate(value: unknown): ValidationResult {
    if (value === null || value === undefined || value === '') return { valid: true };
    const num = Number(value);
    if (isNaN(num)) return { valid: false, message: 'Value must be a number' };
    return num >= this.min && num <= this.max
      ? { valid: true }
      : { valid: false, message: this.message };
  }
}
