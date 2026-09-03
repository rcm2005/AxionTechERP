import { USE_MOCKS, delay } from './mockAdapter';
import { http } from './http';

export interface PlanRequestInput {
  plan: 'solo' | 'pro' | 'enterprise';
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  message?: string;
}

/**
 * Persists a "Solicitar contratação" lead — this product has no payment processor, so this is
 * the real, honest replacement for the old fake checkout: it records the request and a human
 * (Rafael) follows up manually. See `apps/api`'s `plan_requests` table / `POST /plan-requests`.
 */
export async function submitPlanRequest(input: PlanRequestInput): Promise<void> {
  if (USE_MOCKS) {
    await delay(400);
    return;
  }
  await http.post('/plan-requests', {
    plan: input.plan,
    contact_name: input.contactName,
    contact_email: input.contactEmail,
    contact_phone: input.contactPhone,
    message: input.message,
  });
}
