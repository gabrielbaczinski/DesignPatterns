import { FieldConfig, FieldType, Validator, SelectOption } from '../types';
import { Field } from '../fields/Field';
import { FieldGroup } from '../fields/FieldGroup';
import { Form } from '../Form';

// Builder Pattern: separa a construção complexa de um Form de sua representação.
// Permite criar formulários passo a passo com uma API fluente (method chaining),
// evitando construtores com muitos parâmetros e objetos em estados inconsistentes.
export class FormBuilder {
  private fields: Map<string, Field> = new Map();
  private groups: Map<string, FieldGroup> = new Map();
  private formName: string;

  constructor(formName: string) {
    this.formName = formName;
  }

  field(name: string, type: FieldType, label: string): FieldBuilder {
    return new FieldBuilder(name, type, label, this);
  }

  group(groupName: string): GroupBuilder {
    const grp = new FieldGroup(groupName);
    this.groups.set(groupName, grp);
    return new GroupBuilder(groupName, grp, this);
  }

  _addField(field: Field, groupName?: string): this {
    if (groupName) {
      const grp = this.groups.get(groupName);
      if (grp) grp.add(field);
    } else {
      this.fields.set(field.name, field);
    }
    return this;
  }

  build(): Form {
    const form = new Form(this.formName);
    this.fields.forEach(field => form._addComponent(field));
    this.groups.forEach(grp => form._addComponent(grp));
    return form;
  }
}

// Sub-builder para campo independente — .add() volta ao FormBuilder
export class FieldBuilder {
  private config: Partial<FieldConfig> = {};
  private validators: Validator[] = [];
  private groupName?: string;

  constructor(
    private readonly fieldName: string,
    type: FieldType,
    label: string,
    private readonly formBuilder: FormBuilder,
  ) {
    this.config = { type, label };
  }

  placeholder(text: string): this {
    this.config.placeholder = text;
    return this;
  }

  defaultValue(value: unknown): this {
    this.config.defaultValue = value;
    return this;
  }

  options(opts: SelectOption[]): this {
    this.config.options = opts;
    return this;
  }

  // Strategy Pattern: adiciona validadores ao campo
  validate(...validators: Validator[]): this {
    this.validators.push(...validators);
    return this;
  }

  inGroup(groupName: string): this {
    this.groupName = groupName;
    return this;
  }

  add(): FormBuilder {
    const field = new Field(this.fieldName, {
      ...(this.config as FieldConfig),
      validators: this.validators,
    });
    this.formBuilder._addField(field, this.groupName);
    return this.formBuilder;
  }
}

// Sub-builder para campos dentro de um grupo — .add() volta ao GroupBuilder
class GroupFieldBuilder {
  private config: Partial<FieldConfig> = {};
  private validators: Validator[] = [];

  constructor(
    private readonly fieldName: string,
    type: FieldType,
    label: string,
    private readonly group: FieldGroup,
    private readonly groupBuilder: GroupBuilder,
  ) {
    this.config = { type, label };
  }

  placeholder(text: string): this {
    this.config.placeholder = text;
    return this;
  }

  defaultValue(value: unknown): this {
    this.config.defaultValue = value;
    return this;
  }

  options(opts: SelectOption[]): this {
    this.config.options = opts;
    return this;
  }

  validate(...validators: Validator[]): this {
    this.validators.push(...validators);
    return this;
  }

  // Retorna GroupBuilder para continuar encadeando campos no mesmo grupo
  add(): GroupBuilder {
    const field = new Field(this.fieldName, {
      ...(this.config as FieldConfig),
      validators: this.validators,
    });
    this.group.add(field);
    return this.groupBuilder;
  }
}

// Sub-builder para FieldGroup — .end() volta ao FormBuilder
export class GroupBuilder {
  constructor(
    private readonly groupName: string,
    private readonly group: FieldGroup,
    private readonly formBuilder: FormBuilder,
  ) {}

  field(name: string, type: FieldType, label: string): GroupFieldBuilder {
    return new GroupFieldBuilder(name, type, label, this.group, this);
  }

  end(): FormBuilder {
    return this.formBuilder;
  }
}
