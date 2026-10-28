<div align="center">

# formcraft

**Biblioteca TypeScript para construir, validar e renderizar formulários por código.**<br>
Independente de framework e extensível sem alterar o código-fonte.

<br>

| Alunos | Vídeo de apresentação |
|:---:|:---:|
| **Ayla Micheluzzi**<br>**Gabriel Baczinski** | *Em breve* |

<br>

![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?logo=typescript&logoColor=white)
![Node](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)
![Testes](https://img.shields.io/badge/testes-25%20passando-2ea44f)
![Licença](https://img.shields.io/badge/licen%C3%A7a-MIT-555)

</div>

---

## Sobre

Todo sistema tem formulários, e todo projeto reescreve a mesma lógica: guardar valores, validar e mostrar na tela. A **formcraft** entrega isso pronto, separado em três partes independentes:

| Parte | Função | Como estender |
|---|---|---|
| **Campos** | Estrutura do formulário, valores e estado | Estender `Field` ou `FieldGroup` |
| **Validação** | Regras de cada campo, inclusive assíncronas | Implementar `Validator` |
| **Renderização** | Gerar o HTML (ou outro formato) | Estender `HtmlRenderer` ou implementar `FormVisitor` |

## Instalação

```bash
npm install github:gabrielbaczinski/DesignPatterns
```

## Uso

```typescript
import { FormBuilder, HtmlRenderer, RequiredValidator, EmailValidator } from 'formcraft';

const form = new FormBuilder('cadastro')
  .field('nome', 'text', 'Nome').validate(new RequiredValidator()).add()
  .field('email', 'email', 'E-mail').validate(new RequiredValidator(), new EmailValidator()).add()
  .group('endereco', 'Endereço')
    .field('cidade', 'text', 'Cidade').add()
  .end()
  .build();

form.on('change', ({ path, value }) => console.log(path, value));

form.setValue('nome', 'Maria');
form.setValue('endereco.cidade', 'Curitiba');

const { valid, values, errors } = await form.submit();
// valid  -> false
// values -> { nome: 'Maria', email: '', endereco: { cidade: 'Curitiba' } }
// errors -> { email: ['Campo obrigatório'] }

const html = new HtmlRenderer().render(form);
```

**Validadores prontos:** `RequiredValidator`, `EmailValidator`, `MinLengthValidator`, `MaxLengthValidator`, `PatternValidator`, `RangeValidator`.

**Eventos:** `change`, `validate`, `submit` e `reset` no formulário; `change` e `validate` em cada campo.

## Estendendo

Sem alterar a biblioteca, o desenvolvedor pode criar:

```typescript
// Regra nova (síncrona ou assíncrona)
class UsuarioDisponivel implements Validator {
  async validate(value: unknown): Promise<ValidationResult> {
    const emUso = await api.usuarioExiste(String(value));
    return emUso ? { valid: false, message: 'Usuário em uso' } : { valid: true };
  }
}

// Grupo de campos reutilizável
class EnderecoGroup extends FieldGroup {
  constructor(name: string) {
    super(name, [
      new Field('rua', { type: 'text', label: 'Rua' }),
      new Field('cidade', { type: 'text', label: 'Cidade' }),
    ]);
  }
}
new FormBuilder('checkout').component(new EnderecoGroup('entrega')).build();

// Tipo de campo novo
class MeuRenderer extends HtmlRenderer {
  protected override renderControl(field: Field, attributes: string): string {
    if (field.config.type !== 'rating') return super.renderControl(field, attributes);
    return `<input type="range" min="1" max="5" ${attributes}>`;
  }
}
```

Exemplos completos na pasta [`examples/`](examples).

## Padrões de projeto

| Padrão | Onde | Decisão |
|---|---|---|
| **Builder** | `src/builder/FormBuilder.ts` | Montar o formulário em etapas; ele só existe completo, após `build()` |
| **Composite** | `src/fields/` | Campo e grupo de campos são tratados do mesmo jeito, em qualquer nível |
| **Strategy** | `src/validation/` | Cada regra de validação é uma classe; regra nova não altera a lib |
| **Visitor** | `src/visitors/`, `src/rendering/` | A renderização fica fora dos campos; formato novo é uma classe nova |
| **Observer** | `src/events/EventEmitter.ts` | A interface do cliente é avisada das mudanças sem acoplamento |
| **Template Method** | `HtmlRenderer`, `ValueValidator` | Estrutura fixa com um passo que a subclasse pode trocar |

## Rodando o projeto

```bash
npm install
npm test           # 25 testes automatizados
npm run examples   # exemplos de uso e de extensão
npm run build      # compila para dist/
```

<div align="center">
<sub>Distribuído sob a licença MIT</sub>
</div>
