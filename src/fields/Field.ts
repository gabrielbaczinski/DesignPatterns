import { EventEmitter, type Listener, type Unsubscribe } from '../events/EventEmitter';
import type { FormVisitor } from '../visitors/FormVisitor';
import type { FormComponent } from './FormComponent';
import type { FieldConfig, FieldState } from './types';
import { assertValidName } from './path';

export interface FieldEvents {
  change: { field: Field; value: unknown };
  validate: { field: Field; valid: boolean; errors: readonly string[] };
}

/** Composite — folha: um campo do formulário, com estado próprio. */
export class Field implements FormComponent {
  readonly name: string;
  readonly config: FieldConfig;

  private state: FieldState;
  // Observer: o campo notifica mudanças de valor e resultados de validação.
  private readonly events = new EventEmitter<FieldEvents>();
  // Identifica a validação mais recente; resultados de validações antigas são descartados.
  private validationRun = 0;

  constructor(name: string, config: FieldConfig) {
    assertValidName(name);
    this.name = name;
    this.config = config;
    this.state = this.initialState();
  }

  getValue(): unknown {
    return this.state.value;
  }

  /** O estado é imutável: cada mudança gera um novo objeto. */
  getState(): FieldState {
    return this.state;
  }

  setValue(value: unknown): void {
    if (value === this.state.value) return;
    this.state = { ...this.state, value, dirty: value !== this.initialValue() };
    this.events.emit('change', { field: this, value });
  }

  /**
   * Strategy em ação: executa todos os validadores (em paralelo, já que
   * podem ser assíncronos) sem saber qual regra cada um implementa.
   */
  async validate(): Promise<boolean> {
    const run = ++this.validationRun;
    const value = this.state.value;
    this.state = { ...this.state, validating: true };

    const results = await Promise.all(
      (this.config.validators ?? []).map(validator => validator.validate(value)),
    );
    const errors = results.flatMap(result => (result.valid ? [] : [result.message]));
    const valid = errors.length === 0;

    // Se o usuário digitou de novo (ou o form foi resetado) durante uma validação
    // assíncrona, este resultado está desatualizado e não sobrescreve o estado.
    if (run === this.validationRun) {
      this.state = { ...this.state, validating: false, valid, errors };
      this.events.emit('validate', { field: this, valid, errors });
    }
    return valid;
  }

  reset(): void {
    this.validationRun++;
    this.state = this.initialState();
  }

  accept<R>(visitor: FormVisitor<R>, path: string): R {
    return visitor.visitField(this, path);
  }

  on<K extends keyof FieldEvents>(event: K, listener: Listener<FieldEvents[K]>): Unsubscribe {
    return this.events.on(event, listener);
  }

  private initialValue(): unknown {
    return this.config.defaultValue ?? '';
  }

  private initialState(): FieldState {
    return { value: this.initialValue(), dirty: false, validating: false, valid: true, errors: [] };
  }
}
