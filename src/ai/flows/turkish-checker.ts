'use server';

/**
 * @fileOverview This file defines a Genkit flow for checking Turkish grammar and correctness.
 *
 * - checkTurkish - A function that verifies the Turkish text.
 * - TurkishCheckerInput - The input type for the checkTurkish function.
 * - TurkishCheckerOutput - The return type for the checkTurkish function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TurkishCheckerInputSchema = z.object({
  text: z.string().describe('The Turkish text to be checked.'),
});
export type TurkishCheckerInput = z.infer<typeof TurkishCheckerInputSchema>;

const TurkishCheckerOutputSchema = z.object({
  correctedText: z.string().describe('The corrected Turkish text.'),
  isCorrect: z.boolean().describe('Whether the text is grammatically correct and makes sense.'),
});
export type TurkishCheckerOutput = z.infer<typeof TurkishCheckerOutputSchema>;

export async function checkTurkish(
  input: TurkishCheckerInput
): Promise<TurkishCheckerOutput> {
  return turkishCheckerFlow(input);
}

const turkishCheckerPrompt = ai.definePrompt({
  name: 'turkishCheckerPrompt',
  input: {schema: TurkishCheckerInputSchema},
  output: {schema: TurkishCheckerOutputSchema},
  prompt: `You are a Turkish language expert. Check the provided text for grammatical correctness and meaning.
If there are errors, correct them and return the most accurate version of the text in the 'correctedText' field.
If the original text is correct, return the original text in 'correctedText'.
In the 'isCorrect' field, indicate whether the text was correct from the beginning.

Text to check: {{{text}}}

Your response must be ONLY in the JSON format matching the output schema.`,
});

const turkishCheckerFlow = ai.defineFlow(
  {
    name: 'turkishCheckerFlow',
    inputSchema: TurkishCheckerInputSchema,
    outputSchema: TurkishCheckerOutputSchema,
  },
  async input => {
    const {output} = await turkishCheckerPrompt(input);
    return output!;
  }
);
