import { Form } from '../Form';
import { Field } from '../fields/Field';
import { FieldGroup } from '../fields/FieldGroup';
import type { FormComponent } from '../fields/FormComponent';
import type { FieldConfig, FieldType, SelectOption } from '../fields/types';
import type { Validator } from '../validation/Validator';

type Attach = (component: FormComponent) => void;

/**
 * Builder — parte comum a FormBuilder e GroupBuilder: ambos são "containers"
 * que recebem campos, grupos (que podem ser aninhados) e componentes prontos.
 *
 * Os métodos retornam `this` ou um sub-builder que conhece o seu "pai", então
 * a cadeia fluente mantém o tipo certo em qualquer nível de aninhamento.
 */
export abstract class ContainerBuilder {
  protected readonly children: FormComponent[] = [];

  field(name: string, type: FieldType, label: string): FieldBuilder<this> {
    return new FieldBuilder(name, type, label, this, component => this.children.push(component));
  }

  group(name: string, label?: string): GroupBuilder<this> {
    return new GroupBuilder(name, label, this, component => this.children.push(component));
  }

  /** Ponto de extensão: adiciona um componente do cliente (ex.: subclasse de FieldGroup). */
  component(component: FormComponent): this {
    this.children.push(component);
    return this;
  }
}

/** Builder — monta o Form passo a passo; o Form só existe, completo, após build(). */
export class FormBuilder extends ContainerBuilder {
  constructor(private readonly formName: string) {
    super();
  }

  build(): Form {
    return new Form(this.formName, this.children);
  }
}

/** Sub-builder de grupo: end() cria o FieldGroup e volta para quem o abriu. */
export class GroupBuilder<Parent> extends ContainerBuilder {
  constructor(
    private readonly name: string,
    private readonly label: string | undefined,
    private readonly parent: Parent,
    private readonly attach: Attach,
  ) {
    super();
  }

  end(): Parent {
    this.attach(new FieldGroup(this.name, this.children, this.label));
    return this.parent;
  }
}

/** Sub-builder de campo: add() cria o Field e volta para quem o abriu. */
export class FieldBuilder<Parent> {
  private config: FieldConfig;
  private readonly validators: Validator[] = [];

  constructor(
    private readonly name: string,
    type: FieldType,
    label: string,
    private readonly parent: Parent,
    private readonly attach: Attach,
  ) {
    this.config = { type, label };
  }

  placeholder(placeholder: string): this {
    this.config = { ...this.config, placeholder };
    return this;
  }

  defaultValue(defaultValue: unknown): this {
    this.config = { ...this.config, defaultValue };
    return this;
  }

  options(options: readonly SelectOption[]): this {
    this.config = { ...this.config, options };
    return this;
  }

  /** Strategy: anexa uma ou mais regras de validação ao campo. */
  validate(...validators: Validator[]): this {
    this.validators.push(...validators);
    return this;
  }

  add(): Parent {
    this.attach(new Field(this.name, { ...this.config, validators: [...this.validators] }));
    return this.parent;
  }
}
