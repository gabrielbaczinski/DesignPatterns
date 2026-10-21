import { FormComponent, FieldState, FormEvent, FormEventType } from './types';
import { Field } from './fields/Field';
import { FieldGroup } from './fields/FieldGroup';
import { EventEmitter } from './events/EventEmitter';

export class Form {
  readonly name: string;
  private components: Map<string, FormComponent> = new Map();

  // Observer Pattern: o Form emite eventos de nível superior
  private emitter = new EventEmitter<Record<FormEventType, FormEvent>>();

  constructor(name: string) {
    this.name = name;
  }

  // Usado internamente pelo FormBuilder
  _addComponent(component: FormComponent): this {
    this.components.set(component.name, component);
    return this;
  }

  getField(name: string): Field | undefined {
    const component = this.components.get(name);
    if (component instanceof Field) return component;
    if (component instanceof FieldGroup) return component.getField(name);
    return undefined;
  }

  getGroup(name: string): FieldGroup | undefined {
    const component = this.components.get(name);
    return component instanceof FieldGroup ? component : undefined;
  }

  getValue(fieldName?: string): unknown {
    if (fieldName) {
      const component = this.components.get(fieldName);
      return component?.getValue();
    }
    const values: Record<string, unknown> = {};
    this.components.forEach((component, key) => {
      const val = component.getValue();
      if (component instanceof FieldGroup) {
        Object.assign(values, val);
      } else {
        values[key] = val;
      }
    });
    return values;
  }

  setValue(fieldName: string, value: unknown): void {
    const component = this.components.get(fieldName);
    if (!component) return;
    component.setValue(value);

    this.emitter.emit('change', {
      type: 'change',
      formName: this.name,
      values: this.getValue() as Record<string, unknown>,
      valid: true,
    });
  }

  async validate(): Promise<boolean> {
    const results = await Promise.all(
      Array.from(this.components.values()).map(c => c.validate())
    );
    const valid = results.every(Boolean);

    this.emitter.emit('validate', {
      type: 'validate',
      formName: this.name,
      values: this.getValue() as Record<string, unknown>,
      valid,
    });

    return valid;
  }

  async submit(): Promise<{ valid: boolean; values: Record<string, unknown> }> {
    const valid = await this.validate();
    const values = this.getValue() as Record<string, unknown>;

    this.emitter.emit('submit', { type: 'submit', formName: this.name, values, valid });
    return { valid, values };
  }

  reset(): void {
    this.components.forEach(c => c.reset());
    this.emitter.emit('reset', {
      type: 'reset',
      formName: this.name,
      values: this.getValue() as Record<string, unknown>,
      valid: true,
    });
  }

  getState(): Record<string, FieldState> {
    const states: Record<string, FieldState> = {};
    this.components.forEach((component) => {
      const state = component.getState();
      if ('value' in state) {
        states[component.name] = state as FieldState;
      } else {
        Object.assign(states, state);
      }
    });
    return states;
  }

  // Observer Pattern: API para ouvir eventos do formulário
  on(eventType: FormEventType, listener: (event: FormEvent) => void): () => void {
    return this.emitter.on(eventType, listener);
  }
}
