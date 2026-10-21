import { FormComponent, FieldState } from '../types';
import { Field } from './Field';

// Composite Pattern: FieldGroup é o "Composite" — contém Fields e outros FieldGroups.
// O cliente usa Field e FieldGroup de forma uniforme via interface FormComponent,
// sem saber se está lidando com um campo simples ou um grupo aninhado.
export class FieldGroup implements FormComponent {
  readonly name: string;
  private children: Map<string, FormComponent> = new Map();

  constructor(name: string) {
    this.name = name;
  }

  add(component: FormComponent): this {
    this.children.set(component.name, component);
    return this;
  }

  remove(componentName: string): this {
    this.children.delete(componentName);
    return this;
  }

  get(componentName: string): FormComponent | undefined {
    return this.children.get(componentName);
  }

  getField(name: string): Field | undefined {
    const component = this.children.get(name);
    return component instanceof Field ? component : undefined;
  }

  // Retorna o valor de todos os filhos como objeto plano
  getValue(): Record<string, unknown> {
    const values: Record<string, unknown> = {};
    this.children.forEach((child, key) => {
      values[key] = child.getValue();
    });
    return values;
  }

  // Distribui o setValue para os filhos correspondentes
  setValue(value: unknown): void {
    if (typeof value !== 'object' || value === null) return;
    const obj = value as Record<string, unknown>;
    Object.entries(obj).forEach(([key, val]) => {
      const child = this.children.get(key);
      if (child) child.setValue(val);
    });
  }

  // Valida todos os filhos e agrega o resultado (operação recursiva no Composite)
  async validate(): Promise<boolean> {
    const results = await Promise.all(
      Array.from(this.children.values()).map(child => child.validate())
    );
    return results.every(Boolean);
  }

  // Agrega os estados de todos os filhos
  getState(): Record<string, FieldState> {
    const states: Record<string, FieldState> = {};
    this.children.forEach((child, key) => {
      const childState = child.getState();
      if ('value' in childState) {
        states[key] = childState as FieldState;
      } else {
        Object.assign(states, childState);
      }
    });
    return states;
  }

  reset(): void {
    this.children.forEach(child => child.reset());
  }

  get size(): number {
    return this.children.size;
  }
}
