import { USE_MOCKS, delay } from './mockAdapter';
import { http } from './http';

export interface EarlyAccessInput {
  name: string;
  email: string;
  vertical: string;
}

/**
 * Persists an early-access lead from the landing page. Real POST first — the caller falls back
 * to `mailto:` only if this call fails (network/server down), never as the primary path.
 */
export async function submitEarlyAccess(input: EarlyAccessInput): Promise<void> {
  if (USE_MOCKS) {
    await delay(400);
    return;
  }
  await http.post('/early-access', input);
}
