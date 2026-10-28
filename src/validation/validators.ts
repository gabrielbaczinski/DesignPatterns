// Estratégias de validação prontas para uso (out-of-the-box).
import type { ValidationResult, Validator } from './Validator';
import { ValueValidator, isEmpty } from './ValueValidator';

const VALID: ValidationResult = { valid: true };
const invalid = (message: string): ValidationResult => ({ valid: false, message });

export class RequiredValidator implements Validator {
  constructor(private readonly message = 'Campo obrigatório') {}

  validate(value: unknown): ValidationResult {
    return isEmpty(value) ? invalid(this.message) : VALID;
  }
}

export class EmailValidator extends ValueValidator {
  private static readonly PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  constructor(private readonly message = 'E-mail inválido') {
    super();
  }

  protected check(value: unknown): ValidationResult {
    return EmailValidator.PATTERN.test(String(value)) ? VALID : invalid(this.message);
  }
}

export class MinLengthValidator extends ValueValidator {
  constructor(
    private readonly min: number,
    private readonly message = `Mínimo de ${min} caracteres`,
  ) {
    super();
  }

  protected check(value: unknown): ValidationResult {
    return String(value).length >= this.min ? VALID : invalid(this.message);
  }
}

export class MaxLengthValidator extends ValueValidator {
  constructor(
    private readonly max: number,
    private readonly message = `Máximo de ${max} caracteres`,
  ) {
    super();
  }

  protected check(value: unknown): ValidationResult {
    return String(value).length <= this.max ? VALID : invalid(this.message);
  }
}

export class PatternValidator extends ValueValidator {
  constructor(
    private readonly pattern: RegExp,
    private readonly message = 'Formato inválido',
  ) {
    super();
  }

  protected check(value: unknown): ValidationResult {
    return this.pattern.test(String(value)) ? VALID : invalid(this.message);
  }
}

export class RangeValidator extends ValueValidator {
  constructor(
    private readonly min: number,
    private readonly max: number,
    private readonly message = `Informe um número entre ${min} e ${max}`,
  ) {
    super();
  }

  protected check(value: unknown): ValidationResult {
    const number = Number(value);
    return Number.isFinite(number) && number >= this.min && number <= this.max
      ? VALID
      : invalid(this.message);
  }
}
