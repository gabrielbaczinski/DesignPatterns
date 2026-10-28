export type ValidationResult = { valid: true } | { valid: false; message: string };

/**
 * Strategy — contrato de toda regra de validação.
 *
 * O Field guarda uma lista de Validators e executa cada um sem saber qual
 * regra é. Para criar uma regra nova, o cliente implementa esta interface;
 * o retorno pode ser uma Promise, o que permite validações assíncronas
 * (ex.: consultar uma API).
 */
export interface Validator {
  validate(value: unknown): ValidationResult | Promise<ValidationResult>;
}
