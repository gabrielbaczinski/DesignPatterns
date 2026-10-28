import { EventEmitter, type Listener, type Unsubscribe } from './events/EventEmitter';
import { Field } from './fields/Field';
import { FieldGroup } from './fields/FieldGroup';
import type { FormComponent } from './fields/FormComponent';
import { ErrorCollector, type FormErrors } from './visitors/ErrorCollector';
import type { FormVisitor } from './visitors/FormVisitor';
import { PathIndexer } from './visitors/PathIndexer';

export type FormValues = Record<string, unknown>;

export interface SubmitResult {
  valid: boolean;
  values: FormValues;
  errors: FormErrors;
}

export interface FormEvents {
  change: { path: string; value: unknown; values: FormValues };
  validate: { valid: boolean; errors: FormErrors };
  submit: SubmitResult;
  reset: { values: FormValues };
}

/**
 * O formulário pronto, criado pelo FormBuilder.
 *
 * Internamente é a raiz de um Composite (um FieldGroup), então valor,
 * validação e reset são delegados à árvore. Campos são acessados pelo
 * caminho completo ("endereco.cidade").
 */
export class Form {
  readonly name: string;

  private readonly root: FieldGroup;
  private readonly index: ReadonlyMap<string, FormComponent>;
  private readonly events = new EventEmitter<FormEvents>();

  constructor(name: string, components: readonly FormComponent[]) {
    this.name = name;
    this.root = new FieldGroup(name, components);

    const indexer = new PathIndexer();
    this.accept(indexer);
    this.index = indexer.index;

    // Observer em cadeia: o Form observa cada campo e repassa a mudança com o
    // caminho completo, mesmo quando a UI altera o Field diretamente.
    this.index.forEach((component, path) => {
      if (component instanceof Field) {
        component.on('change', ({ value }) =>
          this.events.emit('change', { path, value, values: this.getValue() }),
        );
      }
    });
  }

  getComponents(): readonly FormComponent[] {
    return this.root.getChildren();
  }

  getValue(): FormValues {
    return this.root.getValue();
  }

  /** `path` pode ser um campo ("email") ou um grupo ("endereco", com objeto parcial). */
  setValue(path: string, value: unknown): void {
    this.find(path).setValue(value);
  }

  getField(path: string): Field {
    const component = this.find(path);
    if (!(component instanceof Field)) {
      throw new Error(`"${path}" é um grupo, não um campo.`);
    }
    return component;
  }

  getErrors(): FormErrors {
    return this.accept(new ErrorCollector());
  }

  async validate(): Promise<boolean> {
    const valid = await this.root.validate();
    this.events.emit('validate', { valid, errors: this.getErrors() });
    return valid;
  }

  async submit(): Promise<SubmitResult> {
    const valid = await this.validate();
    const result: SubmitResult = { valid, values: this.getValue(), errors: this.getErrors() };
    this.events.emit('submit', result);
    return result;
  }

  reset(): void {
    this.root.reset();
    this.events.emit('reset', { values: this.getValue() });
  }

  accept<R>(visitor: FormVisitor<R>): R {
    return visitor.visitForm(this);
  }

  on<K extends keyof FormEvents>(event: K, listener: Listener<FormEvents[K]>): Unsubscribe {
    return this.events.on(event, listener);
  }

  private find(path: string): FormComponent {
    const component = this.index.get(path);
    if (!component) {
      throw new Error(`O formulário "${this.name}" não tem o campo "${path}".`);
    }
    return component;
  }
}
