import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Field, FieldGroup, FormBuilder, RequiredValidator } from '../src';

describe('FormBuilder', () => {
  it('monta campos e grupos aninhados na ordem declarada', () => {
    const form = new FormBuilder('f')
      .field('a', 'text', 'A').add()
      .group('g')
        .field('b', 'text', 'B').add()
        .group('h')
          .field('c', 'text', 'C').defaultValue('x').add()
        .end()
      .end()
      .field('d', 'text', 'D').add()
      .build();

    assert.deepEqual(form.getValue(), { a: '', g: { b: '', h: { c: 'x' } }, d: '' });
    assert.deepEqual(form.getComponents().map(c => c.name), ['a', 'g', 'd']);
  });

  it('repassa configuração e validadores para o Field', () => {
    const required = new RequiredValidator();
    const form = new FormBuilder('f')
      .field('cor', 'select', 'Cor')
        .placeholder('Escolha')
        .options([{ value: 'r', label: 'Vermelho' }])
        .validate(required)
        .add()
      .build();

    const { config } = form.getField('cor');
    assert.equal(config.type, 'select');
    assert.equal(config.label, 'Cor');
    assert.equal(config.placeholder, 'Escolha');
    assert.deepEqual(config.options, [{ value: 'r', label: 'Vermelho' }]);
    assert.deepEqual(config.validators, [required]);
  });

  it('aceita componentes do cliente com component()', () => {
    class Par extends FieldGroup {
      constructor(name: string) {
        super(name, [new Field('x', { type: 'text', label: 'X' }), new Field('y', { type: 'text', label: 'Y' })]);
      }
    }
    const form = new FormBuilder('f').component(new Par('p1')).group('g').component(new Par('p2')).end().build();
    assert.deepEqual(form.getValue(), { p1: { x: '', y: '' }, g: { p2: { x: '', y: '' } } });
  });

  it('rejeita nomes repetidos e nomes inválidos', () => {
    assert.throws(
      () => new FormBuilder('f').field('a', 'text', 'A').add().field('a', 'text', 'A').add().build(),
      /nomes repetidos/,
    );
    assert.throws(() => new FormBuilder('f').field('a.b', 'text', 'A').add(), /Nome inválido/);
  });
});
