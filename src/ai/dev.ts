import { config } from 'dotenv';
config();

import '@/ai/flows/generate-step-by-step-solution.ts';
import '@/ai/flows/verify-ai-generated-solution.ts';
import '@/ai/flows/analyze-user-question.ts';