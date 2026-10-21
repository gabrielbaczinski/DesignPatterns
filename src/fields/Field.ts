import { Validator, FieldState, FieldConfig, FieldEvent, FieldEventType, FormComponent } from '../types';
import { EventEmitter } from '../events/EventEmitter';

// Composite Pattern: Field é o "Leaf" — componente folha sem filhos
export class Field implements FormComponent {
  readonly name: string;
  readonly config: FieldConfig;

  private state: FieldState;
  private validators: Validator[];

  // Observer Pattern: cada campo é também um emissor de eventos
  private emitter = new EventEmitter<Record<FieldEventType, FieldEvent>>();

  constructor(name: string, config: FieldConfig) {
    this.name = name;
    this.config = config;
    this.validators = config.validators ?? [];
    this.state = {
      value: config.defaultValue ?? '',
      touched: false,
      dirty: false,
      valid: true,
      errors: [],
    };
  }

  getValue(): unknown {
    return this.state.value;
  }

  setValue(value: unknown): void {
    const changed = value !== this.state.value;
    this.state = { ...this.state, value, dirty: true };
    if (changed) {
      this.emitter.emit('change', {
        type: 'change',
        fieldName: this.name,
        value,
        state: { ...this.state },
      });
    }
  }

  touch(): void {
    this.state = { ...this.state, touched: true };
    this.emitter.emit('blur', {
      type: 'blur',
      fieldName: this.name,
      value: this.state.value,
      state: { ...this.state },
    });
  }

  // Strategy Pattern em ação: percorre os validadores e executa cada estratégia
  async validate(): Promise<boolean> {
    const errors: string[] = [];

    for (const validator of this.validators) {
      const result = await validator.validate(this.state.value);
      if (!result.valid && result.message) {
        errors.push(result.message);
      }
    }

    const valid = errors.length === 0;
    this.state = { ...this.state, valid, errors };

    this.emitter.emit('validate', {
      type: 'validate',
      fieldName: this.name,
      value: this.state.value,
      state: { ...this.state },
    });

    return valid;
  }

  getState(): FieldState {
    return { ...this.state };
  }

  reset(): void {
    this.state = {
      value: this.config.defaultValue ?? '',
      touched: false,
      dirty: false,
      valid: true,
      errors: [],
    };
  }

  addValidator(validator: Validator): this {
    this.validators.push(validator);
    return this;
  }

  // Observer Pattern: expõe API de inscrição de eventos
  on(eventType: FieldEventType, listener: (event: FieldEvent) => void): () => void {
    return this.emitter.on(eventType, listener);
  }
}
