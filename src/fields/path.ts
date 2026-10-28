// Nomes de campos formam caminhos com ponto: "endereco.cidade".
const VALID_NAME = /^[A-Za-z_][\w-]*$/;

export function assertValidName(name: string): void {
  if (!VALID_NAME.test(name)) {
    throw new Error(
      `Nome inválido: "${name}". Use letras, números, "_" ou "-" e comece com letra ou "_".`,
    );
  }
}

export function joinPath(parent: string, name: string): string {
  return parent ? `${parent}.${name}` : name;
}
