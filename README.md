<h1 align="center">formcraft</h1>

<p align="center">
  Biblioteca TypeScript para construir, validar e renderizar formulários por código.<br>
  Independente de framework e extensível sem alterar o código-fonte.
</p>

<p align="center">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.x-3178c6?logo=typescript&logoColor=white">
  <img alt="Node" src="https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white">
  <img alt="Testes" src="https://img.shields.io/badge/testes-node%3Atest-5a5a5a">
  <img alt="Licença" src="https://img.shields.io/badge/licen%C3%A7a-MIT-555">
</p>

---

## Sumário

- [Equipe](#equipe)
- [Vídeo de apresentação](#vídeo-de-apresentação)
- [Visão geral](#visão-geral)
- [Instalação](#instalação)
- [Uso rápido](#uso-rápido)
- [Validadores prontos](#validadores-prontos)
- [Grupos de campos](#grupos-de-campos)
- [Renderização em HTML](#renderização-em-html)
- [Eventos](#eventos)
- [Estendendo a biblioteca](#estendendo-a-biblioteca)
- [Arquitetura e padrões de projeto](#arquitetura-e-padrões-de-projeto)
- [Decisões de design](#decisões-de-design)
- [Referência da API](#referência-da-api)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Desenvolvimento](#desenvolvimento)
- [Licença](#licença)

---

## Equipe

| Nome |
|---|
| Ayla Micheluzzi |
| Gabriel Baczinski |

## Vídeo de apresentação

> Em breve. O link do vídeo no YouTube será adicionado aqui.

---

## Visão geral

Todo projeto com formulários reescreve a mesma lógica: guardar o estado de cada campo, rodar regras de validação (algumas assíncronas, como "este e-mail já existe?"), agrupar campos relacionados, avisar a interface quando algo muda e, por fim, desenhar os campos na tela.

A **formcraft** entrega essa lógica como uma biblioteca para ser importada em outros projetos. Ela separa três responsabilidades:

| Camada | Responsável por | Extensível com |
|---|---|---|
| **Modelo** | Estrutura do formulário, valores e estado de cada campo | Subclasses de `Field` e `FieldGroup` |
| **Validação** | Regras aplicadas a cada campo, síncronas ou assíncronas | Classes que implementam `Validator` |
| **Renderização** | Transformar o formulário em HTML ou em outro formato | Subclasses de `HtmlRenderer` ou um `FormVisitor` próprio |

Como a renderização fica separada do modelo, a mesma biblioteca serve para HTML no servidor, para alimentar componentes React ou Vue, ou só para validar dados no back-end.

---

## Instalação

O pacote ainda não está publicado no npm. Instale direto do GitHub (a compilação roda automaticamente na instalação):

```bash
npm install github:gabrielbaczinski/DesignPatterns
```

```typescript
import { FormBuilder, RequiredValidator } from 'formcraft';
```

---

## Uso rápido

```typescript
import { FormBuilder, RequiredValidator, EmailValidator, MinLengthValidator } from 'formcraft';

const form = new FormBuilder('contato')
  .field('nome', 'text', 'Nome completo')
    .placeholder('Maria Silva')
    .validate(new RequiredValidator(), new MinLengthValidator(3))
    .add()
  .field('email', 'email', 'E-mail')
    .validate(new RequiredValidator(), new EmailValidator())
    .add()
  .build();

form.setValue('nome', 'Maria Silva');
form.setValue('email', 'nao-e-email');

const { valid, values, errors } = await form.submit();
// valid  -> false
// values -> { nome: 'Maria Silva', email: 'nao-e-email' }
// errors -> { email: ['E-mail inválido'] }
```

---

## Validadores prontos

Todos aceitam uma mensagem personalizada como último parâmetro.

| Validador | Exemplo | Regra |
|---|---|---|
| `RequiredValidator` | `new RequiredValidator()` | Não pode ser vazio, só espaços, lista vazia ou checkbox desmarcado |
| `EmailValidator` | `new EmailValidator()` | Formato de e-mail |
| `MinLengthValidator` | `new MinLengthValidator(3)` | Mínimo de caracteres |
| `MaxLengthValidator` | `new MaxLengthValidator(100)` | Máximo de caracteres |
| `PatternValidator` | `new PatternValidator(/^\d{5}-\d{3}$/, 'CEP inválido')` | Casa com a expressão regular |
| `RangeValidator` | `new RangeValidator(18, 120)` | Número dentro do intervalo |

Só o `RequiredValidator` rejeita valores vazios. Os demais ignoram campo vazio, então um campo opcional não acusa erro de formato. Para tornar obrigatório, combine com `RequiredValidator`.

---

## Grupos de campos

Grupos podem ser aninhados em qualquer nível. Os valores ficam aninhados e cada campo é acessado pelo **caminho completo**.

```typescript
const form = new FormBuilder('cadastro')
  .field('nome', 'text', 'Nome').validate(new RequiredValidator()).add()
  .group('endereco', 'Endereço')
    .field('cidade', 'text', 'Cidade').validate(new RequiredValidator()).add()
    .field('cep', 'text', 'CEP').add()
  .end()
  .build();

form.setValue('endereco', { cidade: 'Curitiba' }); // objeto parcial
form.setValue('endereco.cep', '80000-000');        // caminho até o campo

form.getValue();
// { nome: '', endereco: { cidade: 'Curitiba', cep: '80000-000' } }

(await form.submit()).errors;
// { nome: ['Campo obrigatório'] }
```

---

## Renderização em HTML

O `HtmlRenderer` gera o HTML do formulário com rótulos, valores, mensagens de erro e atributos de acessibilidade (`aria-invalid`, `aria-describedby`, `aria-busy`). Todo valor é escapado para evitar XSS.

```typescript
import { HtmlRenderer } from 'formcraft';

const html = new HtmlRenderer().render(form);
```

Os tipos `text`, `email`, `password`, `number`, `textarea`, `select` e `checkbox` são suportados. As classes CSS geradas são `fc-field`, `fc-field--invalid` e `fc-errors`.

---

## Eventos

O formulário e cada campo emitem eventos. `on()` retorna uma função que cancela a inscrição.

```typescript
const cancelar = form.on('change', ({ path, value }) => {
  console.log(`${path} mudou para`, value); // "endereco.cidade mudou para Curitiba"
});

form.getField('email').on('validate', ({ valid, errors }) => {
  console.log(valid, errors);
});

cancelar();
```

| Origem | Evento | Dados |
|---|---|---|
| `Form` | `change` | `path`, `value`, `values` |
| `Form` | `validate` | `valid`, `errors` |
| `Form` | `submit` | `valid`, `values`, `errors` |
| `Form` | `reset` | `values` |
| `Field` | `change` | `field`, `value` |
| `Field` | `validate` | `field`, `valid`, `errors` |

O `change` do formulário também é disparado quando a interface altera o `Field` diretamente.

---

## Estendendo a biblioteca

A formcraft segue o **Princípio Aberto/Fechado**: o comportamento é estendido com classes novas, sem modificar a biblioteca.

| O que estender | Como |
|---|---|
| Regra de validação | Implementar `Validator` ou estender `ValueValidator` |
| Grupo de campos reutilizável | Estender `FieldGroup` e adicionar com `.component()` |
| Tipo de campo novo | Usar qualquer texto como tipo e estender `HtmlRenderer` |
| Formato de saída novo | Implementar `FormVisitor` |

### Validador personalizado

`ValueValidator` já ignora valores vazios; a subclasse implementa só a regra.

```typescript
import { ValueValidator, type ValidationResult } from 'formcraft';

class CpfValidator extends ValueValidator {
  protected check(value: unknown): ValidationResult {
    return /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(String(value))
      ? { valid: true }
      : { valid: false, message: 'CPF inválido' };
  }
}
```

### Validador assíncrono

```typescript
import type { Validator, ValidationResult } from 'formcraft';

class EmailDisponivelValidator implements Validator {
  async validate(value: unknown): Promise<ValidationResult> {
    const emUso = await api.emailExiste(String(value));
    return emUso ? { valid: false, message: 'E-mail já cadastrado' } : { valid: true };
  }
}
```

Enquanto a validação roda, `field.getState().validating` é `true`. Se o usuário alterar o valor e validar de novo antes da resposta, o resultado antigo é descartado.

### Grupo de campos reutilizável

```typescript
import { Field, FieldGroup, RequiredValidator } from 'formcraft';

class EnderecoGroup extends FieldGroup {
  constructor(name: string, label: string) {
    super(name, [
      new Field('rua',    { type: 'text', label: 'Rua',    validators: [new RequiredValidator()] }),
      new Field('cidade', { type: 'text', label: 'Cidade', validators: [new RequiredValidator()] }),
    ], label);
  }
}

const form = new FormBuilder('checkout')
  .component(new EnderecoGroup('entrega', 'Endereço de entrega'))
  .component(new EnderecoGroup('cobranca', 'Endereço de cobrança'))
  .build();
```

### Tipo de campo novo

Basta trocar o passo que desenha o controle; rótulo, erros e acessibilidade continuam iguais.

```typescript
import { Field, HtmlRenderer } from 'formcraft';

class MeuRenderer extends HtmlRenderer {
  protected override renderControl(field: Field, attributes: string): string {
    if (field.config.type !== 'rating') return super.renderControl(field, attributes);
    return `<input type="range" min="1" max="5" ${attributes} value="${this.escape(field.getValue())}">`;
  }
}

const form = new FormBuilder('avaliacao').field('nota', 'rating', 'Nota').add().build();
new MeuRenderer().render(form);
```

### Formato de saída novo

```typescript
import type { FormVisitor, Form, FieldGroup, Field } from 'formcraft';

class ResumoVisitor implements FormVisitor<string> {
  visitForm(form: Form): string {
    return form.getComponents().map(c => c.accept(this, c.name)).join('\n');
  }
  visitGroup(group: FieldGroup, path: string): string {
    return group.getChildren().map(c => c.accept(this, `${path}.${c.name}`)).join('\n');
  }
  visitField(field: Field, path: string): string {
    return `${path}: ${field.getValue()}`;
  }
}

form.accept(new ResumoVisitor());
```

---

## Arquitetura e padrões de projeto

```
                       FormBuilder ──build()──▶ Form
                       (Builder)                 │ raiz da árvore
                                                 ▼
                                          FormComponent ◀──── accept(visitor)
                                          (Composite)              │
                                         ┌──────┴──────┐           ▼
                                       Field       FieldGroup   FormVisitor (Visitor)
                                         │                       ├─ HtmlRenderer (Template Method)
                         validators ─────┤                       ├─ ErrorCollector
                         (Strategy)      │                       └─ PathIndexer
                                         └─ on('change') ──▶ Form.on('change')  (Observer)
```

| Padrão | Categoria | Onde está | Problema que resolve |
|---|---|---|---|
| **Builder** | Criacional | `src/builder/FormBuilder.ts` | Montar formulários com muitos campos, opções e grupos aninhados sem construtores enormes nem objetos pela metade |
| **Composite** | Estrutural | `src/fields/` (`FormComponent`, `Field`, `FieldGroup`) | Tratar campo e grupo aninhado do mesmo jeito em valor, validação e reset |
| **Strategy** | Comportamental | `src/validation/Validator.ts`, `src/validation/validators.ts` | Trocar, combinar e criar regras de validação, inclusive assíncronas, sem alterar o `Field` |
| **Visitor** | Comportamental | `src/visitors/`, `src/rendering/HtmlRenderer.ts` | Separar a renderização (e outras operações) do modelo, permitindo novos formatos sem tocar nos campos |
| **Observer** | Comportamental | `src/events/EventEmitter.ts`, usado em `Field` e `Form` | Avisar a interface do cliente sobre mudanças sem acoplar a biblioteca a ela |
| **Template Method** | Comportamental | `HtmlRenderer.visitField()`, `src/validation/ValueValidator.ts` | Fixar o esqueleto de um algoritmo e deixar a subclasse mudar só um passo |

### Builder

`FormBuilder` monta o `Form` passo a passo com uma API fluente. Cada `field()` ou `group()` devolve um sub-builder que conhece quem o abriu, então `add()` e `end()` voltam para o nível certo e os grupos podem ser aninhados em qualquer profundidade. A parte comum a formulário e grupo fica em `ContainerBuilder`, sem duplicação. O `Form` só é criado em `build()`, já completo.

### Composite

`Field` (folha) e `FieldGroup` (composto) implementam `FormComponent`. Um grupo repassa `getValue`, `setValue`, `validate` e `reset` para os filhos, de forma recursiva. O próprio `Form` usa um `FieldGroup` como raiz, então toda a lógica de árvore fica em um lugar só.

### Strategy

Cada regra é um objeto que implementa `Validator`. O `Field` executa a lista de validadores sem saber qual regra cada um aplica: não há `if` ou `switch` por tipo de validação. Como o contrato aceita `Promise`, uma regra assíncrona é só mais uma estratégia.

### Visitor

Operações sobre a árvore do formulário são classes que implementam `FormVisitor`. Cada nó chama o método do seu tipo em `accept()` (double dispatch). A biblioteca usa isso três vezes: `HtmlRenderer` (renderização), `ErrorCollector` (erros por caminho) e `PathIndexer` (índice de caminhos). O cliente cria formatos novos do mesmo jeito, e `Field`/`FieldGroup` não sabem nada sobre HTML.

### Observer

`EventEmitter` é um *subject* genérico com eventos tipados. `Field` e `Form` o usam por composição e expõem só `on()`, então apenas a biblioteca dispara eventos. O `Form` observa os próprios campos e repassa cada mudança com o caminho completo.

### Template Method

`HtmlRenderer.visitField()` define o esqueleto de todo campo (container, rótulo, controle, erros e atributos de acessibilidade) e chama os passos `renderLabel`, `renderControl` e `renderErrors`, que subclasses podem sobrescrever. O mesmo vale para `ValueValidator.validate()`: o esqueleto "valor vazio é aceito" é fixo e a subclasse implementa apenas `check()`.

---

## Decisões de design

- **Estrutura imutável.** Campos e grupos são definidos no `build()` e não mudam depois. Isso elimina estados intermediários inválidos e permite indexar todos os caminhos uma única vez.
- **Falha rápida.** Nomes repetidos, nomes inválidos ou caminhos inexistentes geram erro com mensagem clara, em vez de serem ignorados em silêncio.
- **Caminhos completos.** Valores e erros usam caminhos como `entrega.cidade`, então campos de mesmo nome em grupos diferentes nunca colidem.
- **Estado imutável por campo.** Cada alteração gera um novo objeto `FieldState`, o que facilita a integração com bibliotecas reativas (React, Vue).
- **Validação assíncrona segura.** Validadores rodam em paralelo e cada validação recebe um número de execução; respostas atrasadas de validações antigas são descartadas.
- **Composição em vez de herança no Observer.** `Field` e `Form` têm um `EventEmitter` privado em vez de estendê-lo, escondendo `emit()` do cliente.
- **API pública enxuta.** Classes internas (`EventEmitter`, `ErrorCollector`, `PathIndexer`) não são exportadas; o cliente só vê o que precisa usar ou estender.

---

## Referência da API

### `FormBuilder` e `GroupBuilder`

| Método | Descrição |
|---|---|
| `field(name, type, label)` | Inicia um campo; termine com `.add()` |
| `group(name, label?)` | Inicia um grupo; termine com `.end()` |
| `component(component)` | Adiciona um componente pronto (ex.: subclasse de `FieldGroup`) |
| `build()` | Cria o `Form` (só em `FormBuilder`) |

### `FieldBuilder`

| Método | Descrição |
|---|---|
| `placeholder(text)` | Texto de exemplo |
| `defaultValue(value)` | Valor inicial |
| `options(options)` | Opções de um `select`: `{ value, label }[]` |
| `validate(...validators)` | Adiciona validadores |
| `add()` | Finaliza o campo |

### `Form`

| Método | Descrição |
|---|---|
| `setValue(path, value)` | Altera um campo ou, com objeto parcial, um grupo |
| `getValue()` | Todos os valores, com grupos aninhados |
| `getField(path)` | O `Field` daquele caminho |
| `getErrors()` | Erros por caminho, só dos campos com erro |
| `validate()` | Valida tudo e retorna `Promise<boolean>` |
| `submit()` | Valida e retorna `{ valid, values, errors }` |
| `reset()` | Volta tudo ao valor inicial e limpa os erros |
| `getComponents()` | Componentes do primeiro nível |
| `accept(visitor)` | Executa um `FormVisitor` |
| `on(event, listener)` | Inscreve um ouvinte; retorna a função de cancelamento |

### `Field`

| Membro | Descrição |
|---|---|
| `config` | Configuração: `type`, `label`, `placeholder`, `options`, `validators`... |
| `getValue()` / `setValue(value)` | Lê ou altera o valor |
| `getState()` | `{ value, dirty, validating, valid, errors }` |
| `validate()` / `reset()` | Valida o campo / volta ao valor inicial |
| `on(event, listener)` | Inscreve um ouvinte |

---

## Estrutura do projeto

```
src/
├── index.ts                 API pública
├── Form.ts                  Formulário pronto (raiz da árvore)
├── builder/
│   └── FormBuilder.ts       Builder
├── fields/
│   ├── FormComponent.ts     Composite: interface comum
│   ├── Field.ts             Composite: folha
│   ├── FieldGroup.ts        Composite: composto
│   ├── types.ts             Configuração e estado de campo
│   └── path.ts              Nomes e caminhos ("endereco.cidade")
├── validation/
│   ├── Validator.ts         Strategy: contrato
│   ├── ValueValidator.ts    Template Method: base para regras opcionais
│   └── validators.ts        Validadores prontos
├── visitors/
│   ├── FormVisitor.ts       Visitor: contrato
│   ├── ErrorCollector.ts    Coleta de erros
│   └── PathIndexer.ts       Índice de caminhos
├── rendering/
│   └── HtmlRenderer.ts      Visitor + Template Method
└── events/
    └── EventEmitter.ts      Observer
examples/                    Exemplos de uso padrão e de extensão
test/                        Testes automatizados
```

---

## Desenvolvimento

Requisito: Node.js 18 ou superior.

```bash
git clone https://github.com/gabrielbaczinski/DesignPatterns.git
cd DesignPatterns
npm install

npm test                   # testes automatizados
npm run typecheck          # checagem de tipos (inclui exemplos e testes)
npm run build              # compila a biblioteca para dist/

npm run examples           # roda os quatro exemplos
npm run example            # uso padrão (gera examples/output/cadastro.html)
npm run example:validator  # validadores personalizados, inclusive assíncrono
npm run example:group      # grupo de campos reutilizável
npm run example:renderer   # tipo de campo novo e saída em Markdown
```

---

## Licença

Distribuída sob a licença MIT. Veja [LICENSE](LICENSE).
