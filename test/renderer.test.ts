import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  Field,
  FieldGroup,
  Form,
  FormBuilder,
  HtmlRenderer,
  RequiredValidator,
  type FormVisitor,
} from '../src';

describe('HtmlRenderer', () => {
  it('renderiza form, grupo com legenda e caminhos completos', () => {
    const form = new FormBuilder('cadastro')
      .group('endereco', 'Endereço').field('cidade', 'text', 'Cidade').placeholder('Curitiba').add().end()
      .build();

    assert.equal(
      new HtmlRenderer().render(form),
      '<form name="cadastro" novalidate>' +
        '<fieldset name="endereco"><legend>Endereço</legend>' +
        '<div class="fc-field"><label for="fc-endereco-cidade">Cidade</label>' +
        '<input type="text" id="fc-endereco-cidade" name="endereco.cidade" value="" placeholder="Curitiba">' +
        '</div></fieldset></form>',
    );
  });

  it('mostra erros com atributos de acessibilidade', async () => {
    const form = new FormBuilder('f').field('nome', 'text', 'Nome').validate(new RequiredValidator()).add().build();
    await form.validate();
    const html = new HtmlRenderer().render(form);
    assert.match(html, /class="fc-field fc-field--invalid"/);
    assert.match(html, /aria-invalid="true" aria-describedby="fc-nome-errors"/);
    assert.match(html, /<ul class="fc-errors" id="fc-nome-errors"><li>Campo obrigatório<\/li><\/ul>/);
  });

  it('renderiza select, checkbox e textarea', () => {
    const form = new FormBuilder('f')
      .field('cor', 'select', 'Cor').placeholder('Escolha').options([{ value: 'r', label: 'Vermelho' }]).defaultValue('r').add()
      .field('aceito', 'checkbox', 'Aceito').defaultValue(true).add()
      .field('bio', 'textarea', 'Bio').defaultValue('oi').add()
      .build();
    const html = new HtmlRenderer().render(form);
    assert.match(html, /<select id="fc-cor" name="cor"><option value="">Escolha<\/option><option value="r" selected>Vermelho<\/option><\/select>/);
    assert.match(html, /<input type="checkbox" id="fc-aceito" name="aceito" checked>/);
    assert.match(html, /<textarea id="fc-bio" name="bio">oi<\/textarea>/);
  });

  it('escapa valores digitados (evita XSS)', () => {
    const form = new FormBuilder('f').field('nome', 'text', 'Nome').add().build();
    form.setValue('nome', '"><script>alert(1)</script>');
    const html = new HtmlRenderer().render(form);
    assert.ok(!html.includes('<script>'));
    assert.match(html, /value="&quot;&gt;&lt;script&gt;alert\(1\)&lt;\/script&gt;"/);
  });

  it('marca aria-busy durante validação assíncrona', () => {
    const form = new FormBuilder('f')
      .field('u', 'text', 'U').validate({ validate: () => new Promise(() => undefined) }).add()
      .build();
    void form.validate();
    assert.match(new HtmlRenderer().render(form), /aria-busy="true"/);
  });

  it('subclasse troca só o passo renderControl (Template Method)', () => {
    class StarsRenderer extends HtmlRenderer {
      protected override renderControl(field: Field, attributes: string): string {
        return field.config.type === 'stars' ? `<stars ${attributes}>` : super.renderControl(field, attributes);
      }
    }
    const form = new FormBuilder('f').field('nota', 'stars', 'Nota').add().field('n', 'text', 'N').add().build();
    const html = new StarsRenderer().render(form);
    assert.match(html, /<label for="fc-nota">Nota<\/label><stars id="fc-nota" name="nota">/);
    assert.match(html, /<input type="text" id="fc-n"/);
  });
});

describe('Visitor do cliente', () => {
  it('adiciona uma operação nova sem alterar a biblioteca', () => {
    class FieldCounter implements FormVisitor<number> {
      visitForm(form: Form): number {
        return form.getComponents().reduce((total, c) => total + c.accept(this, c.name), 0);
      }
      visitGroup(group: FieldGroup, path: string): number {
        return group.getChildren().reduce((total, c) => total + c.accept(this, `${path}.${c.name}`), 0);
      }
      visitField(): number {
        return 1;
      }
    }
    const form = new FormBuilder('f')
      .field('a', 'text', 'A').add()
      .group('g').field('b', 'text', 'B').add().field('c', 'text', 'C').add().end()
      .build();
    assert.equal(form.accept(new FieldCounter()), 3);
  });
});
