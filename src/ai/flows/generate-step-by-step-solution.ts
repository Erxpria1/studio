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
import { checkTurkish } from './turkish-checker';

const GenerateStepByStepSolutionInputSchema = z.object({
  question: z.string().describe('The mathematical question to be solved.'),
  fileData: z.string().optional().describe("A file (image or PDF content) as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'.")
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
  prompt: `Sen adım adım çözüm açıklama konusunda uzman bir matematik çözücüsün. Aşağıdaki matematik sorusuna ayrıntılı, adım adım bir çözüm sun:\n\nSoru: {{{question}}}{{#if fileData}}

Ayrıca soruyu çözmek için aşağıdaki dosyayı da kullan:
{{media url=fileData}}
{{/if}}`,
});

const generateStepByStepSolutionFlow = ai.defineFlow(
  {
    name: 'generateStepByStepSolutionFlow',
    inputSchema: GenerateStepByStepSolutionInputSchema,
    outputSchema: GenerateStepByStepSolutionOutputSchema,
  },
  async input => {
    const {output: initialOutput} = await prompt(input);
    if (!initialOutput) {
      throw new Error("Çözüm üretilemedi.");
    }
    
    // First check
    const firstCheck = await checkTurkish({ text: initialOutput.solution });

    // Second check
    const secondCheck = await checkTurkish({ text: firstCheck.correctedText });

    return { solution: secondCheck.correctedText };
  }
);
