// API pública da formcraft.

// Construção e uso
export { FormBuilder } from './builder/FormBuilder';
export type { FieldBuilder, GroupBuilder } from './builder/FormBuilder';
export { Form } from './Form';
export type { FormEvents, FormValues, SubmitResult } from './Form';

// Composite: campos e grupos (estendíveis pelo cliente)
export { Field } from './fields/Field';
export type { FieldEvents } from './fields/Field';
export { FieldGroup } from './fields/FieldGroup';
export type { FormComponent } from './fields/FormComponent';
export type { FieldConfig, FieldState, FieldType, SelectOption } from './fields/types';

// Strategy: validação
export type { Validator, ValidationResult } from './validation/Validator';
export { ValueValidator } from './validation/ValueValidator';
export {
  RequiredValidator,
  EmailValidator,
  MinLengthValidator,
  MaxLengthValidator,
  PatternValidator,
  RangeValidator,
} from './validation/validators';

// Visitor: operações sobre a árvore (renderização e afins)
export type { FormVisitor } from './visitors/FormVisitor';
export type { FormErrors } from './visitors/ErrorCollector';
export { HtmlRenderer } from './rendering/HtmlRenderer';

// Observer
export type { Listener, Unsubscribe } from './events/EventEmitter';
