// Public API of formcraft
export { Form } from './Form';
export { FormBuilder } from './builder/FormBuilder';
export { Field } from './fields/Field';
export { FieldGroup } from './fields/FieldGroup';
export { EventEmitter } from './events/EventEmitter';

// Validators (Strategy Pattern implementations — out-of-the-box)
export {
  RequiredValidator,
  EmailValidator,
  MinLengthValidator,
  MaxLengthValidator,
  RegexValidator,
  RangeValidator,
} from './validators';

// Types and interfaces (for extensibility)
export type {
  Validator,
  ValidationResult,
  FieldConfig,
  FieldState,
  FieldEvent,
  FormEvent,
  FormComponent,
  FieldType,
  FieldEventType,
  FormEventType,
  SelectOption,
} from './types';
