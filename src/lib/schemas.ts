'use server';

import { z } from 'zod';

export const SolutionStepSchema = z.object({
  stepNumber: z.number().describe('The step number in the solution process.'),
  explanation: z.string().describe('The verbal explanation for this step.'),
  formula: z.string().describe('The mathematical formula or calculation for this step, formatted as a LaTeX string.'),
});
export type SolutionStep = z.infer<typeof SolutionStepSchema>;
