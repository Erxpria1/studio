'use server';

import { generateStepByStepSolution } from '@/ai/flows/generate-step-by-step-solution';
import { verifyAiGeneratedSolution } from '@/ai/flows/verify-ai-generated-solution';
import { z } from 'zod';
import { SolutionStepSchema, type SolutionStep } from '@/lib/schemas';

const MathQuestionSchema = z.object({
  question: z.string().min(3, "Soru en az 3 karakter uzunluğunda olmalıdır."),
  fileData: z.string().optional(),
});

export type FormState = {
  id: string;
  status: 'initial' | 'step_by_step' | 'complete' | 'error';
  question?: string;
  error?: string;
  currentStep?: SolutionStep;
  currentStepIndex?: number;
  totalSteps?: number;
  isCorrect?: boolean;
  verificationDetails?: string;
  fullSolution?: SolutionStep[]; // Pass the full solution to the client
};

// This is a unified server action that handles both submitting a new question
// and getting the next step.
export async function submitQuestion(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const submissionId = prevState.id === '0' ? Date.now().toString() : prevState.id;
  const isNextStepRequest = formData.get('next_step') === 'true';

  if (isNextStepRequest) {
    return getNextStep(formData);
  }

  return submitNewQuestion(submissionId, formData);
}

async function submitNewQuestion(submissionId: string, formData: FormData): Promise<FormState> {
    const validatedFields = MathQuestionSchema.safeParse({
      question: formData.get('question'),
      fileData: formData.get('fileData'),
    });

    if (!validatedFields.success) {
      const errorMessage = validatedFields.error.flatten().fieldErrors.question?.join(', ');
      return {
        id: submissionId,
        status: 'error',
        question: formData.get('question') as string,
        error: errorMessage,
      };
    }
    const { question, fileData } = validatedFields.data;

    try {
      const fullSolutionResult = await generateStepByStepSolution({ question, fileData });

      if (!fullSolutionResult.solution || fullSolutionResult.solution.length === 0) {
        throw new Error("Yapay zeka bir çözüm üretemedi.");
      }
      
      const fullSolution = fullSolutionResult.solution;

      return {
        id: submissionId,
        status: 'step_by_step',
        question: question,
        currentStep: fullSolution[0],
        currentStepIndex: 0,
        totalSteps: fullSolution.length,
        fullSolution: fullSolution,
      };

    } catch (error: any) {
      console.error("submitNewQuestion eyleminde bir hata oluştu:", error);
      return {
        id: submissionId,
        status: 'error',
        question: question,
        error: error.message || 'Çözüm oluşturulurken bilinmeyen bir hata oluştu. Lütfen tekrar deneyin.',
      };
    }
}

async function getNextStep(formData: FormData): Promise<FormState> {
    const submissionId = Date.now().toString(); // Use a new id to avoid issues
    try {
        const question = formData.get('question') as string;
        const currentStepIndexStr = formData.get('current_step_index') as string;
        const totalStepsStr = formData.get('total_steps') as string;
        const fullSolutionJson = formData.get('full_solution_json') as string;
        
        if (!question || !currentStepIndexStr || !totalStepsStr || !fullSolutionJson) {
             throw new Error('Eksik veri. Lütfen baştan başlayın.');
        }

        const currentStepIndex = parseInt(currentStepIndexStr, 10);
        const totalSteps = parseInt(totalStepsStr, 10);
        const fullSolution: SolutionStep[] = JSON.parse(fullSolutionJson);

        const nextStepIndex = currentStepIndex + 1;
        
        if (nextStepIndex < totalSteps) {
            // Return the next step
            return {
                id: submissionId,
                status: 'step_by_step',
                question,
                currentStep: fullSolution[nextStepIndex],
                currentStepIndex: nextStepIndex,
                totalSteps,
                fullSolution,
            };
        } else {
            // All steps are done, now run verification
            const aiSolutionText = fullSolution.map(step => `${step.explanation} ${step.formula}`).join('\n');
            const verificationResult = await verifyAiGeneratedSolution({ question, aiSolution: aiSolutionText });
            
            return {
                id: submissionId,
                status: 'complete',
                question,
                isCorrect: verificationResult.isCorrect,
                verificationDetails: verificationResult.verificationDetails,
                totalSteps,
                currentStepIndex,
                fullSolution
            };
        }
    } catch (error: any) {
        console.error("getNextStep eyleminde bir hata oluştu:", error);
        return {
            id: submissionId,
            status: 'error',
            question: formData.get('question') as string,
            error: error.message || 'Doğrulama sırasında bilinmeyen bir hata oluştu.',
        };
    }
}
    