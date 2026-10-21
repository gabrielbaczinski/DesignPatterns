export interface ValidationResult {
  valid: boolean;
  message?: string;
}

// Strategy Pattern: contrato que todo validador deve implementar
export interface Validator {
  validate(value: unknown): ValidationResult | Promise<ValidationResult>;
  readonly name: string;
}

export type FieldType = 'text' | 'email' | 'number' | 'select' | 'checkbox' | 'textarea';

export interface FieldState {
  value: unknown;
  touched: boolean;
  dirty: boolean;
  valid: boolean;
  errors: string[];
}

// Observer Pattern: tipos de eventos emitidos por campos e formulários
export type FieldEventType = 'change' | 'blur' | 'focus' | 'validate';
export type FormEventType = 'submit' | 'reset' | 'change' | 'validate';

export interface FieldEvent {
  type: FieldEventType;
  fieldName: string;
  value: unknown;
  state: FieldState;
}

export interface FormEvent {
  type: FormEventType;
  formName: string;
  values: Record<string, unknown>;
  valid: boolean;
}

// Composite Pattern: interface comum para Field e FieldGroup
export interface FormComponent {
  readonly name: string;
  getValue(): unknown;
  setValue(value: unknown): void;
  validate(): Promise<boolean>;
  getState(): FieldState | Record<string, FieldState>;
  reset(): void;
}

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface FieldConfig {
  type: FieldType;
  label: string;
  placeholder?: string;
  defaultValue?: unknown;
  validators?: Validator[];
  options?: SelectOption[];
}
