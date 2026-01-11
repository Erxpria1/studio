'use server';

/**
 * @fileOverview Analyzes the user's mathematical question and provides an explanation of the solution.
 *
 * - analyzeUserQuestion - A function that analyzes the user's question and returns an explanation.
 * - AnalyzeUserQuestionInput - The input type for the analyzeUserQuestion function.
 * - AnalyzeUserQuestionOutput - The return type for the analyzeUserQuestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeUserQuestionInputSchema = z.object({
  question: z.string().describe('The mathematical question to be analyzed.'),
});
export type AnalyzeUserQuestionInput = z.infer<typeof AnalyzeUserQuestionInputSchema>;

const AnalyzeUserQuestionOutputSchema = z.object({
  explanation: z.string().describe('An explanation of the solution to the mathematical question.'),
});
export type AnalyzeUserQuestionOutput = z.infer<typeof AnalyzeUserQuestionOutputSchema>;

export async function analyzeUserQuestion(input: AnalyzeUserQuestionInput): Promise<AnalyzeUserQuestionOutput> {
  return analyzeUserQuestionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeUserQuestionPrompt',
  input: {schema: AnalyzeUserQuestionInputSchema},
  output: {schema: AnalyzeUserQuestionOutputSchema},
  prompt: `You are an AI expert in mathematical analysis. Your task is to analyze the user's question and provide a clear and concise explanation of the solution.

Question: {{{question}}}

Explanation:`,
});

const analyzeUserQuestionFlow = ai.defineFlow(
  {
    name: 'analyzeUserQuestionFlow',
    inputSchema: AnalyzeUserQuestionInputSchema,
    outputSchema: AnalyzeUserQuestionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
