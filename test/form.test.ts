import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { FormBuilder, RequiredValidator, type ValidationResult, type Validator } from '../src';

function buildForm() {
  return new FormBuilder('f')
    .field('nome', 'text', 'Nome').validate(new RequiredValidator()).add()
    .group('entrega')
      .field('cidade', 'text', 'Cidade').validate(new RequiredValidator()).add()
    .end()
    .group('cobranca')
      .field('cidade', 'text', 'Cidade').validate(new RequiredValidator()).add()
    .end()
    .build();
}

/** Validador assíncrono que só responde quando o teste mandar. */
class ControlledValidator implements Validator {
  private resolvers: Array<(result: ValidationResult) => void> = [];

  validate(): Promise<ValidationResult> {
    return new Promise(resolve => this.resolvers.push(resolve));
  }

  resolve(index: number, result: ValidationResult): void {
    this.resolvers[index]!(result);
  }
}

describe('Form', () => {
  it('mantém grupos aninhados, sem colisão entre campos de mesmo nome', () => {
    const form = buildForm();
    form.setValue('entrega', { cidade: 'Curitiba' });
    form.setValue('cobranca.cidade', 'Londrina');
    assert.deepEqual(form.getValue(), {
      nome: '',
      entrega: { cidade: 'Curitiba' },
      cobranca: { cidade: 'Londrina' },
    });
  });

  it('reporta erros pelo caminho completo e valida recursivamente', async () => {
    const form = buildForm();
    form.setValue('entrega.cidade', 'Curitiba');
    const result = await form.submit();
    assert.equal(result.valid, false);
    assert.deepEqual(result.errors, {
      nome: ['Campo obrigatório'],
      'cobranca.cidade': ['Campo obrigatório'],
    });
  });

  it('falha cedo com caminho inexistente ou valor de grupo inválido', () => {
    const form = buildForm();
    assert.throws(() => form.setValue('idade', 1), /não tem o campo "idade"/);
    assert.throws(() => form.setValue('entrega', { bairro: 'x' }), /não tem o campo "bairro"/);
    assert.throws(() => form.setValue('entrega', 'texto'), /espera um objeto/);
    assert.throws(() => form.getField('entrega'), /é um grupo/);
  });

  it('emite change com o caminho, inclusive quando o Field é alterado direto', () => {
    const form = buildForm();
    const paths: string[] = [];
    form.on('change', ({ path }) => paths.push(path));
    form.setValue('nome', 'Ana');
    form.getField('cobranca.cidade').setValue('Maringá');
    form.setValue('nome', 'Ana'); // mesmo valor: não emite
    assert.deepEqual(paths, ['nome', 'cobranca.cidade']);
  });

  it('emite validate, submit e reset; unsubscribe para de ouvir', async () => {
    const form = buildForm();
    const events: string[] = [];
    form.on('validate', () => events.push('validate'));
    const off = form.on('submit', () => events.push('submit'));
    form.on('reset', ({ values }) => events.push(`reset:${JSON.stringify(values)}`));

    await form.submit();
    off();
    await form.submit();
    form.setValue('nome', 'x');
    form.reset();

    assert.deepEqual(events, [
      'validate',
      'submit',
      'validate',
      'reset:{"nome":"","entrega":{"cidade":""},"cobranca":{"cidade":""}}',
    ]);
  });

  it('controla dirty, validating e limpa erros no reset', async () => {
    const form = new FormBuilder('f').field('a', 'text', 'A').defaultValue('x').validate(new RequiredValidator()).add().build();
    const field = form.getField('a');

    field.setValue('');
    assert.equal(field.getState().dirty, true);
    await form.validate();
    assert.deepEqual(field.getState().errors, ['Campo obrigatório']);

    field.setValue('x');
    assert.equal(field.getState().dirty, false);

    form.reset();
    assert.deepEqual(field.getState(), { value: 'x', dirty: false, validating: false, valid: true, errors: [] });
  });

  it('descarta o resultado de uma validação assíncrona antiga', async () => {
    const validator = new ControlledValidator();
    const form = new FormBuilder('f').field('u', 'text', 'U').validate(validator).add().build();
    const field = form.getField('u');

    const primeira = field.validate();
    const segunda = field.validate();
    assert.equal(field.getState().validating, true);

    validator.resolve(1, { valid: true });
    await segunda;
    validator.resolve(0, { valid: false, message: 'antigo' });
    await primeira;

    assert.deepEqual(field.getState().errors, []);
    assert.equal(field.getState().validating, false);
  });

  it('reset cancela o efeito de validação em andamento', async () => {
    const validator = new ControlledValidator();
    const form = new FormBuilder('f').field('u', 'text', 'U').validate(validator).add().build();

    const pendente = form.validate();
    form.reset();
    validator.resolve(0, { valid: false, message: 'erro' });
    await pendente;

    assert.deepEqual(form.getErrors(), {});
  });
});
