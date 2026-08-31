// Paleta de marca oferecida no onboarding.
//
// NOTA DE DUPLICAÇÃO CONSCIENTE: os mesmos valores existem hoje inline em
// `src/pages/onboarding/OnboardingPage.tsx`. Não foram extraídos de lá porque
// (a) o wizard antigo deve permanecer intocado e (b) exportar uma constante
// daquele arquivo dispararia o aviso `react/only-export-components` do oxlint.
// Se um dia o wizard for aposentado, apague a cópia de lá e aponte para cá.
export interface CorMarca {
  nome: string;
  valor: string;
}

export const CORES_MARCA: readonly CorMarca[] = [
  { nome: 'Azul', valor: '#3157d5' },
  { nome: 'Verde', valor: '#0e7c5a' },
  { nome: 'Dourado', valor: '#c9a24a' },
  { nome: 'Roxo', valor: '#7c4fd6' },
  { nome: 'Vinho', valor: '#a11d4a' },
  { nome: 'Grafite', valor: '#3a3f4b' },
] as const;
