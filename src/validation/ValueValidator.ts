import type { ValidationResult, Validator } from './Validator';

/** Valor "vazio": null, undefined, texto em branco, lista vazia ou checkbox desmarcado. */
export function isEmpty(value: unknown): boolean {
  return (
    value === null ||
    value === undefined ||
    value === false ||
    (typeof value === 'string' && value.trim() === '') ||
    (Array.isArray(value) && value.length === 0)
  );
}

/**
 * Template Method — base para regras que só fazem sentido quando há valor
 * (e-mail, tamanho, formato...).
 *
 * O esqueleto é fixo: valor vazio é aceito, e a obrigatoriedade fica a cargo
 * do RequiredValidator. A subclasse implementa apenas o passo `check()`.
 * Assim cada regra continua independente e combinável.
 */
export abstract class ValueValidator implements Validator {
  validate(value: unknown): ValidationResult | Promise<ValidationResult> {
    return isEmpty(value) ? { valid: true } : this.check(value);
  }

  protected abstract check(value: unknown): ValidationResult | Promise<ValidationResult>;
}
