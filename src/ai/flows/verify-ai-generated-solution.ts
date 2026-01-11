'use server';

/**
 * @fileOverview This file defines a Genkit flow for verifying AI-generated solutions using a WebAssembly-compiled Rust mathematical engine.
 *
 * - verifyAiGeneratedSolution - A function that verifies the AI-generated solution.
 * - VerifyAiGeneratedSolutionInput - The input type for the verifyAiGeneratedSolution function.
 * - VerifyAiGeneratedSolutionOutput - The return type for the verifyAiGeneratedSolution function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { checkTurkish } from './turkish-checker';

const VerifyAiGeneratedSolutionInputSchema = z.object({
  question: z.string().describe('The mathematical question asked by the user.'),
  aiSolution: z.string().describe('The AI-generated solution to the question.'),
});
export type VerifyAiGeneratedSolutionInput = z.infer<typeof VerifyAiGeneratedSolutionInputSchema>;

const VerifyAiGeneratedSolutionOutputSchema = z.object({
  isCorrect: z.boolean().describe('Whether the AI-generated solution is correct.'),
  verificationDetails: z
    .string()
    .describe('Details of the verification process, including any errors.'),
});
export type VerifyAiGeneratedSolutionOutput = z.infer<typeof VerifyAiGeneratedSolutionOutputSchema>;

export async function verifyAiGeneratedSolution(
  input: VerifyAiGeneratedSolutionInput
): Promise<VerifyAiGeneratedSolutionOutput> {
  return verifyAiGeneratedSolutionFlow(input);
}

const verifyAiGeneratedSolutionPrompt = ai.definePrompt({
  name: 'verifyAiGeneratedSolutionPrompt',
  input: {schema: VerifyAiGeneratedSolutionInputSchema},
  output: {schema: VerifyAiGeneratedSolutionOutputSchema},
  prompt: `Sen uzman bir matematiksel çözüm denetleyicisisin. Sana bir soru ve bir çözüm verilecek.
Görevin, çözümü doğrulamak ve doğru olup olmadığını belirlemek.

Soru: {{{question}}}
Çözüm: {{{aiSolution}}}

Doğrulama sürecinin ayrıntılı bir dökümünü sun ve çözümün doğru olup olmadığını belirt. Cevabın SADECE Türkçe olmalı.
Cevabı, çıktı şemasına göre JSON formatında döndür.`,
});

const verifyAiGeneratedSolutionFlow = ai.defineFlow(
  {
    name: 'verifyAiGeneratedSolutionFlow',
    inputSchema: VerifyAiGeneratedSolutionInputSchema,
    outputSchema: VerifyAiGeneratedSolutionOutputSchema,
  },
  async input => {
    // TODO: Integrate with WebAssembly-compiled Rust mathematical engine for more accurate verification.
    // Currently, it relies solely on the LLM's reasoning.
    const {output: initialOutput} = await verifyAiGeneratedSolutionPrompt(input);
    if (!initialOutput) {
      throw new Error("Doğrulama detayı üretilemedi.");
    }
    
    const firstCheck = await checkTurkish({ text: initialOutput.verificationDetails });
    const secondCheck = await checkTurkish({ text: firstCheck.correctedText });

    return { 
        isCorrect: initialOutput.isCorrect,
        verificationDetails: secondCheck.correctedText 
    };
  }
);
