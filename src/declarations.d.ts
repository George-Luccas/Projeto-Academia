// Declaração de módulo para permitir a importação de arquivos de folha de estilo (.css) no TypeScript do Expo
declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}
