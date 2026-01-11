'use server';

import { generateStepByStepSolution } from '@/ai/flows/generate-step-by-step-solution';
import { verifyAiGeneratedSolution } from '@/ai/flows/verify-ai-generated-solution';
import { z } from 'zod';

const MathQuestionSchema = z.object({
  question: z.string().min(3, "Question must be at least 3 characters long."),
});

export type SolutionState = {
  id: number;
  status: 'success' | 'error';
  question: string;
  solution?: string;
  isCorrect?: boolean;
  verificationDetails?: string;
  error?: string;
};

export async function getSolution(
  prevState: SolutionState,
  formData: FormData
): Promise<SolutionState> {
  const validatedFields = MathQuestionSchema.safeParse({
    question: formData.get('question'),
  });

  const question = formData.get('question') as string;

  if (!validatedFields.success) {
    return {
      id: Date.now(),
      status: 'error',
      question: question,
      error: validatedFields.error.flatten().fieldErrors.question?.join(', '),
    };
  }
  
  const validQuestion = validatedFields.data.question;

  try {
    const solutionResult = await generateStepByStepSolution({ question: validQuestion });
    const aiSolution = solutionResult.solution;
    
    const verificationResult = await verifyAiGeneratedSolution({ question: validQuestion, aiSolution });

    return {
      id: Date.now(),
      status: 'success',
      question: validQuestion,
      solution: aiSolution,
      isCorrect: verificationResult.isCorrect,
      verificationDetails: verificationResult.verificationDetails,
    };
  } catch (error) {
    console.error(error);
    return {
      id: Date.now(),
      status: 'error',
      question: validQuestion,
      error: 'An error occurred while generating the solution. Please try again.',
    };
  }
}
