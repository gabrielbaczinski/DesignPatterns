import type { FormVisitor } from '../visitors/FormVisitor';

/**
 * Composite — interface comum de Field (folha) e FieldGroup (composto).
 *
 * Quem usa um FormComponent não precisa saber se é um campo ou um grupo
 * aninhado: valor, validação e reset funcionam do mesmo jeito.
 * `accept()` é a porta de entrada do Visitor (renderização, coleta de erros...).
 */
export interface FormComponent {
  readonly name: string;
  getValue(): unknown;
  setValue(value: unknown): void;
  validate(): Promise<boolean>;
  reset(): void;
  accept<R>(visitor: FormVisitor<R>, path: string): R;
}
