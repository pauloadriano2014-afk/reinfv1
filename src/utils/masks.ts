export const maskCNPJ = (value: string) => {
  return value
    .replace(/\D/g, '') // Remove tudo o que não é dígito
    .replace(/^(\d{2})(\d)/, '$1.$2') // Coloca ponto após os 2 primeiros dígitos
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3') // Coloca ponto após os 5 primeiros dígitos
    .replace(/\.(\d{3})(\d)/, '.$1/$2') // Coloca a barra após os 8 primeiros dígitos
    .replace(/(\d{4})(\d)/, '$1-$2') // Coloca o hífen após os 12 primeiros dígitos
    .slice(0, 18); // Limita o tamanho máximo
};

export const unmask = (value: string) => {
  return value.replace(/\D/g, ''); // Remove a máscara para salvar no banco
};