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
  fileData: z.string().optional().describe("A file (image or PDF content) as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
  step: z.number().optional().describe("The specific step to generate. If not provided, all steps are generated.")
});
export type GenerateStepByStepSolutionInput = z.infer<typeof GenerateStepByStepSolutionInputSchema>;

const SolutionStepSchema = z.object({
  stepNumber: z.number().describe('The step number in the solution process.'),
  explanation: z.string().describe('The verbal explanation for this step.'),
  formula: z.string().describe('The mathematical formula or calculation for this step, formatted as a LaTeX string.'),
});
export type SolutionStep = z.infer<typeof SolutionStepSchema>;


const GenerateStepByStepSolutionOutputSchema = z.object({
  solution: z.array(SolutionStepSchema).describe('An array of steps representing the step-by-step solution to the mathematical question.'),
});
export type GenerateStepByStepSolutionOutput = z.infer<typeof GenerateStepByStepSolutionOutputSchema>;

export async function generateStepByStepSolution(input: GenerateStepByStepSolutionInput): Promise<GenerateStepByStepSolutionOutput> {
  return generateStepByStepSolutionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateStepByStepSolutionPrompt',
  input: {schema: GenerateStepByStepSolutionInputSchema},
  output: {schema: GenerateStepByStepSolutionOutputSchema},
  prompt: `Sen adım adım çözüm açıklama konusunda uzman bir matematik çözücüsün. Aşağıdaki matematik sorusuna ayrıntılı, 3 adımlı bir çözüm sun. Her adım için, bir açıklama ve bir LaTeX formatında formül sağla.
{{#if step}}
Sadece ${'{{{step}}}'}. adımı oluştur.
{{/if}}

Soru: {{{question}}}{{#if fileData}}

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
    if (!initialOutput || !initialOutput.solution) {
      throw new Error("Çözüm üretilemedi.");
    }

    const checkedSolution = await Promise.all(initialOutput.solution.map(async (step) => {
        const firstCheck = await checkTurkish({ text: step.explanation });
        const secondCheck = await checkTurkish({ text: firstCheck.correctedText });
        return {
            ...step,
            explanation: secondCheck.correctedText
        };
    }));

    return { solution: checkedSolution };
  }
);
