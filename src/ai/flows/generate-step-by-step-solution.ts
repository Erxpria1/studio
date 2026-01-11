'use server';
/**
 * @fileOverview Generates a step-by-step solution to a mathematical question using AI.
 *
 * - generateStepByStepSolution - A function that takes a mathematical question as input and returns a step-by-step solution.
 * - GenerateStepByStepSolutionInput - The input type for the generateStepByStepSolution function.
 * - GenerateStepByStepSolutionOutput - The return type for the generateStepByStepSolution function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateStepByStepSolutionInputSchema = z.object({
  question: z.string().describe('The mathematical question to be solved.'),
});
export type GenerateStepByStepSolutionInput = z.infer<typeof GenerateStepByStepSolutionInputSchema>;

const GenerateStepByStepSolutionOutputSchema = z.object({
  solution: z.string().describe('The step-by-step solution to the mathematical question.'),
});
export type GenerateStepByStepSolutionOutput = z.infer<typeof GenerateStepByStepSolutionOutputSchema>;

export async function generateStepByStepSolution(input: GenerateStepByStepSolutionInput): Promise<GenerateStepByStepSolutionOutput> {
  return generateStepByStepSolutionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateStepByStepSolutionPrompt',
  input: {schema: GenerateStepByStepSolutionInputSchema},
  output: {schema: GenerateStepByStepSolutionOutputSchema},
  prompt: `You are an expert mathematics solver that specializes in explaining the answer step by step.  Provide a detailed step-by-step solution to the following mathematical question:\n\nQuestion: {{{question}}}`,
});

const generateStepByStepSolutionFlow = ai.defineFlow(
  {
    name: 'generateStepByStepSolutionFlow',
    inputSchema: GenerateStepByStepSolutionInputSchema,
    outputSchema: GenerateStepByStepSolutionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
