'use server';

import { generateStepByStepSolution, type GenerateStepByStepSolutionOutput } from '@/ai/flows/generate-step-by-step-solution';
import { verifyAiGeneratedSolution } from '@/ai/flows/verify-ai-generated-solution';
import { z } from 'zod';

const MathQuestionSchema = z.object({
  question: z.string().min(3, "Soru en az 3 karakter uzunluğunda olmalıdır."),
  fileData: z.string().optional(),
});

export type SolutionState = {
  id: number;
  status: 'success' | 'error';
  question: string;
  solution?: GenerateStepByStepSolutionOutput['solution'];
  isCorrect?: boolean;
  verificationDetails?: string;
  error?: string;
};

export async function getSolution(
  prevState: SolutionState,
  formData: FormData
): Promise<SolutionState> {
  console.log("getSolution eylemi başlatıldı.");
  const validatedFields = MathQuestionSchema.safeParse({
    question: formData.get('question'),
    fileData: formData.get('fileData'),
  });

  const question = formData.get('question') as string;

  if (!validatedFields.success) {
    const errorMessage = validatedFields.error.flatten().fieldErrors.question?.join(', ');
    console.error("Doğrulama hatası:", errorMessage);
    return {
      id: Date.now(),
      status: 'error',
      question: question,
      error: errorMessage,
    };
  }
  
  const { question: validQuestion, fileData } = validatedFields.data;
  console.log("Doğrulanan soru:", validQuestion);

  try {
    console.log("Adım adım çözüm oluşturma başlatılıyor...");
    const solutionResult = await generateStepByStepSolution({ question: validQuestion, fileData });
    console.log("Çözüm sonucu alındı:", solutionResult);

    if (!solutionResult.solution) {
      throw new Error("Yapay zeka bir çözüm üretemedi.");
    }
    
    // For verification, we can join the steps into a single string
    const aiSolutionText = solutionResult.solution.map(step => `${step.explanation} ${step.formula}`).join('\n');
    
    console.log("Çözüm doğrulaması başlatılıyor...");
    const verificationResult = await verifyAiGeneratedSolution({ question: validQuestion, aiSolution: aiSolutionText });
    console.log("Doğrulama sonucu alındı:", verificationResult);

    return {
      id: Date.now(),
      status: 'success',
      question: validQuestion,
      solution: solutionResult.solution,
      isCorrect: verificationResult.isCorrect,
      verificationDetails: verificationResult.verificationDetails,
    };
  } catch (error: any) {
    console.error("getSolution eyleminde bir hata oluştu:", error);
    return {
      id: Date.now(),
      status: 'error',
      question: validQuestion,
      error: error.message || 'Çözüm oluşturulurken bilinmeyen bir hata oluştu. Lütfen tekrar deneyin.',
    };
  }
}
