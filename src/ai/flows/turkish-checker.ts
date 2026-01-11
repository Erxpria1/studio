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
  prompt: `Sen bir Türkçe dil uzmanısın. Sana verilen metnin dilbilgisi ve anlam açısından doğruluğunu kontrol et.
Eğer hatalar varsa düzelt ve metnin en doğru halini 'correctedText' alanında döndür. Metnin orijinali doğruysa, 'correctedText' olarak orijinal metni döndür.
'isCorrect' alanında ise metnin en başta doğru olup olmadığını belirt.

Kontrol edilecek metin: {{{text}}}

Cevabını sadece ve sadece output şemasına uygun JSON formatında ver.`,
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
