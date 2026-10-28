import type { Validator } from '../validation/Validator';

/**
 * Tipos prontos + qualquer outro texto. O cliente pode criar tipos novos
 * (ex.: 'date', 'rating') sem alterar a biblioteca; `string & {}` mantém
 * o autocomplete dos tipos prontos no editor.
 */
export type FieldType =
  | 'text'
  | 'email'
  | 'password'
  | 'number'
  | 'textarea'
  | 'select'
  | 'checkbox'
  | (string & {});

export interface SelectOption {
  readonly value: string;
  readonly label: string;
}

export interface FieldConfig {
  readonly type: FieldType;
  readonly label: string;
  readonly placeholder?: string;
  readonly defaultValue?: unknown;
  readonly options?: readonly SelectOption[];
  readonly validators?: readonly Validator[];
}

export interface FieldState {
  readonly value: unknown;
  /** O valor atual é diferente do valor inicial. */
  readonly dirty: boolean;
  /** Há uma validação (possivelmente assíncrona) em andamento. */
  readonly validating: boolean;
  /** Resultado da última validação concluída (true antes da primeira). */
  readonly valid: boolean;
  readonly errors: readonly string[];
}
