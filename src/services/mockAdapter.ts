export const USE_MOCKS = import.meta.env.VITE_USE_MOCKS !== 'false';

export function delay(ms = 220): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
