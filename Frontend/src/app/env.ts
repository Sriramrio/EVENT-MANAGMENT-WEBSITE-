import { z } from 'zod';
const schema = z.object({
  VITE_API_MODE: z.enum(['mock', 'api']).default('mock'),
  VITE_API_BASE_URL: z.string().url().optional(),
  VITE_EVENT_CODE: z.string().min(1).default('MSME-SANGAMAM-2026'),
  VITE_TELEMETRY_ENABLED: z.enum(['true', 'false']).default('false')
}).superRefine((value, ctx) => {
  if (value.VITE_API_MODE === 'api' && !value.VITE_API_BASE_URL) {
    ctx.addIssue({ code: 'custom', path: ['VITE_API_BASE_URL'], message: 'VITE_API_BASE_URL is required in api mode.' });
  }
});
const parsed = schema.safeParse(import.meta.env);
if (!parsed.success) throw new Error(`Invalid runtime configuration: ${parsed.error.message}`);
export const env = parsed.data;
