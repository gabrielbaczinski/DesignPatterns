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

Campos dentro de grupos são acessados pelo caminho completo (`endereco.cidade`). Um grupo também aceita um objeto parcial: `form.setValue('endereco', { cidade: 'Curitiba' })`.

### Documentação

<details>
<summary><b>Validadores prontos</b></summary>

<br>

Todos aceitam uma mensagem personalizada como último parâmetro. Só o `RequiredValidator` rejeita campo vazio; os outros ignoram campo vazio, então combine-os com ele quando o campo for obrigatório.

| Validador | Exemplo | Regra |
|---|---|---|
| `RequiredValidator` | `new RequiredValidator()` | Não pode ser vazio, só espaços, lista vazia ou checkbox desmarcado |
| `EmailValidator` | `new EmailValidator()` | Formato de e-mail |
| `MinLengthValidator` | `new MinLengthValidator(3)` | Mínimo de caracteres |
| `MaxLengthValidator` | `new MaxLengthValidator(100)` | Máximo de caracteres |
| `PatternValidator` | `new PatternValidator(/^\d{5}-\d{3}$/, 'CEP inválido')` | Casa com a expressão regular |
| `RangeValidator` | `new RangeValidator(18, 120)` | Número dentro do intervalo |

</details>

<details>
<summary><b>Montagem do formulário (FormBuilder)</b></summary>

<br>

| Método | Descrição |
|---|---|
| `field(name, type, label)` | Inicia um campo. Tipos prontos: `text`, `email`, `password`, `number`, `textarea`, `select`, `checkbox` (ou qualquer outro texto, para tipos novos) |
| `.placeholder(text)` | Texto de exemplo |
| `.defaultValue(value)` | Valor inicial, usado também pelo `reset()` |
| `.options([{ value, label }])` | Opções de um `select` |
| `.validate(...validators)` | Regras do campo |
| `.add()` | Finaliza o campo |
| `group(name, label?)` | Inicia um grupo, que pode conter outros grupos; finalize com `.end()` |
| `component(component)` | Adiciona um componente criado pelo desenvolvedor (ex.: subclasse de `FieldGroup`) |
| `build()` | Cria o `Form` |

Nomes repetidos no mesmo nível ou com caracteres inválidos geram erro já na montagem.

</details>

<details>
<summary><b>Formulário (Form) e campo (Field)</b></summary>

<br>

| `Form` | Descrição |
|---|---|
| `setValue(path, value)` | Altera um campo ou, com objeto parcial, um grupo |
| `getValue()` | Todos os valores, com os grupos aninhados |
| `getField(path)` | Retorna o `Field` daquele caminho |
| `validate()` | Valida tudo e retorna `Promise<boolean>` |
| `submit()` | Valida e retorna `{ valid, values, errors }` |
| `getErrors()` | Erros por caminho, só dos campos com erro |
| `reset()` | Volta tudo ao valor inicial e limpa os erros |
| `on(evento, ouvinte)` | Inscreve um ouvinte e retorna a função que cancela a inscrição |
| `accept(visitor)` | Executa um `FormVisitor` (ex.: um renderizador próprio) |

| `Field` | Descrição |
|---|---|
| `config` | Configuração do campo: `type`, `label`, `placeholder`, `options`, `validators` |
| `getValue()` / `setValue(value)` | Lê ou altera o valor |
| `getState()` | `{ value, dirty, validating, valid, errors }` |
| `validate()` / `reset()` | Valida o campo / volta ao valor inicial |
| `on(evento, ouvinte)` | Inscreve um ouvinte |

Caminho inexistente gera erro com mensagem clara, em vez de ser ignorado.

</details>

<details>
<summary><b>Eventos</b></summary>

<br>

| Origem | Evento | Dados recebidos |
|---|---|---|
| `Form` | `change` | `path`, `value`, `values` |
| `Form` | `validate` | `valid`, `errors` |
| `Form` | `submit` | `valid`, `values`, `errors` |
| `Form` | `reset` | `values` |
| `Field` | `change` | `field`, `value` |
| `Field` | `validate` | `field`, `valid`, `errors` |

O `change` do formulário também dispara quando a interface altera o `Field` diretamente.

</details>

<details>
<summary><b>Renderização em HTML</b></summary>

<br>

`new HtmlRenderer().render(form)` gera um `<form>` com um `<fieldset>` por grupo e, para cada campo, rótulo, controle e mensagens de erro. Inclui atributos de acessibilidade (`aria-invalid`, `aria-describedby`, `aria-busy` durante validação assíncrona) e escapa todos os valores para evitar XSS. Classes CSS geradas: `fc-field`, `fc-field--invalid` e `fc-errors`.

A biblioteca é *headless*: cuida de estado, regras e HTML, e o app de quem a usa liga os eventos da tela (digitação, envio) a `setValue()` e `submit()`. Isso a mantém independente de framework.

</details>

## Estendendo

Sem alterar a biblioteca, o desenvolvedor pode criar:

```typescript
import { Field, FieldGroup, FormBuilder, HtmlRenderer, type Validator, type ValidationResult } from 'formcraft';

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

<details>
<summary><b>Por que cada padrão foi escolhido</b></summary>

<br>

**Builder.** Um formulário tem muitos campos, cada um com várias opções, e grupos dentro de grupos. Um construtor com muitos parâmetros seria ilegível, e criar o formulário vazio para ir preenchendo deixaria ele existir pela metade. Com o Builder, a montagem é feita em etapas e o `Form` só nasce no `build()`, completo e com estrutura imutável.

**Composite.** Formulários têm campos soltos e grupos aninhados. Tratar cada caso com `if (é grupo)` espalharia a lógica e, na primeira versão do projeto, causava colisão entre campos de mesmo nome em grupos diferentes. Com `Field` e `FieldGroup` implementando a mesma interface, o grupo só repassa cada operação aos filhos, e tudo é identificado pelo caminho completo.

**Strategy.** Cada campo combina regras diferentes, e o desenvolvedor precisa criar as suas. Um `switch` por tipo de regra obrigaria a editar a biblioteca a cada regra nova. Com cada regra numa classe, o campo executa a lista sem saber qual é qual, e regras assíncronas funcionam igual. Se uma validação assíncrona antiga responder depois de uma mais nova, a resposta antiga é descartada.

**Visitor.** A renderização precisa ficar separada das regras, e há várias operações que percorrem a árvore do formulário. Um método `render()` em cada campo prenderia o modelo ao HTML. Com o Visitor, cada operação é uma classe: a biblioteca usa isso para gerar HTML, coletar erros e indexar caminhos, e o desenvolvedor cria formatos novos do mesmo jeito. O custo conhecido do padrão (adicionar um tipo de nó novo exige mudar os visitors) não pesa aqui, porque os nós são só campo e grupo.

**Observer.** A interface de quem usa a biblioteca precisa reagir a mudanças, mas a biblioteca não pode depender dela. O desenvolvedor se inscreve com `on()`; `Field` e `Form` têm um emissor de eventos privado em vez de herdar dele, então só a biblioteca dispara eventos.

**Template Method.** Todo campo em HTML segue a mesma estrutura (rótulo, controle, erros, acessibilidade). Para um tipo de campo novo, a subclasse troca só o passo `renderControl`, sem reescrever o resto. O mesmo vale para `ValueValidator`, em que a subclasse implementa só a regra (`check`).

</details>

<details>
<summary><b>Estrutura do projeto</b></summary>

<br>

```
src/
├── index.ts               API pública
├── Form.ts                Formulário pronto
├── builder/               Builder
├── fields/                Composite: Field, FieldGroup e interface comum
├── validation/            Strategy: contrato e validadores prontos
├── visitors/              Visitor: contrato, coleta de erros e índice de caminhos
├── rendering/             HtmlRenderer
└── events/                Observer
examples/                  Uso padrão e extensões
test/                      Testes automatizados
```

</details>

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
