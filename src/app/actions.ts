'use server';

import { generateStepByStepSolution, type GenerateStepByStepSolutionOutput, type SolutionStep } from '@/ai/flows/generate-step-by-step-solution';
import { verifyAiGeneratedSolution } from '@/ai/flows/verify-ai-generated-solution';
import { z } from 'zod';
import { unstable_cache as cache, revalidateTag } from 'next/cache';

const MathQuestionSchema = z.object({
  question: z.string().min(3, "Soru en az 3 karakter uzunluğunda olmalıdır."),
  fileData: z.string().optional(),
});

type SolutionCache = {
  question: string;
  fileData?: string;
  fullSolution: SolutionStep[];
  isCorrect?: boolean;
  verificationDetails?: string;
};

// unstable_cache'i kullanarak state'i sunucu tarafında yönetiyoruz.
const getSolutionCache = (id: string) => cache(
  async () => null, // Başlangıçta boş
  [id],
  { tags: [id] }
);

export type FormState = {
  id: string;
  status: 'initial' | 'analyzing' | 'step_by_step' | 'verifying' | 'complete' | 'error';
  question?: string;
  error?: string;
  currentStep?: SolutionStep;
  currentStepIndex?: number;
  totalSteps?: number;
  isCorrect?: boolean;
  verificationDetails?: string;
};

export async function submitQuestion(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const submissionId = Date.now().toString();
  const validatedFields = MathQuestionSchema.safeParse({
    question: formData.get('question'),
    fileData: formData.get('fileData'),
  });

  const question = formData.get('question') as string;

  if (!validatedFields.success) {
    const errorMessage = validatedFields.error.flatten().fieldErrors.question?.join(', ');
    return {
      id: submissionId,
      status: 'error',
      question,
      error: errorMessage,
    };
  }

  const { question: validQuestion, fileData } = validatedFields.data;

  try {
    // Generate the full solution but only return the first step
    const fullSolutionResult = await generateStepByStepSolution({ question: validQuestion, fileData });

    if (!fullSolutionResult.solution || fullSolutionResult.solution.length === 0) {
      throw new Error("Yapay zeka bir çözüm üretemedi.");
    }
    
    // Cache the full solution
    const solutionCache: SolutionCache = {
        question: validQuestion,
        fileData,
        fullSolution: fullSolutionResult.solution,
    };
    
    // Revalidate (clear) the cache for this ID and set the new value
    revalidateTag(submissionId);
    const setCache = await getSolutionCache(submissionId);
    await setCache(solutionCache as any, {tags: [submissionId]});


    // Return only the first step
    return {
      id: submissionId,
      status: 'step_by_step',
      question: validQuestion,
      currentStep: fullSolutionResult.solution[0],
      currentStepIndex: 0,
      totalSteps: fullSolutionResult.solution.length,
    };

  } catch (error: any) {
    console.error("submitQuestion eyleminde bir hata oluştu:", error);
    return {
      id: submissionId,
      status: 'error',
      question: validQuestion,
      error: error.message || 'Çözüm oluşturulurken bilinmeyen bir hata oluştu. Lütfen tekrar deneyin.',
    };
  }
}

export async function getNextStep(prevState: FormState): Promise<FormState> {
    if (!prevState.id || prevState.status !== 'step_by_step' || prevState.currentStepIndex === undefined || prevState.totalSteps === undefined) {
        return { ...prevState, status: 'error', error: 'Geçersiz durum. Lütfen baştan başlayın.' };
    }

    const nextStepIndex = prevState.currentStepIndex + 1;
    
    const getCachedSolution = await getSolutionCache(prevState.id);
    const cachedData = await getCachedSolution() as SolutionCache | null;

    if (!cachedData) {
        return { ...prevState, status: 'error', error: 'Çözüm bulunamadı veya süresi doldu. Lütfen tekrar sorun.' };
    }

    const { fullSolution, question } = cachedData;
    
    if (nextStepIndex < prevState.totalSteps) {
        // Return the next step
        return {
            ...prevState,
            status: 'step_by_step',
            currentStep: fullSolution[nextStepIndex],
            currentStepIndex: nextStepIndex,
        };
    } else {
        // All steps are done, now run verification
         try {
            const aiSolutionText = fullSolution.map(step => `${step.explanation} ${step.formula}`).join('\n');
            
            const verificationResult = await verifyAiGeneratedSolution({ question, aiSolution: aiSolutionText });

            // Update cache with verification
            const updatedCache: SolutionCache = {
                ...cachedData,
                isCorrect: verificationResult.isCorrect,
                verificationDetails: verificationResult.verificationDetails,
            };
            revalidateTag(prevState.id);
            const setCache = await getSolutionCache(prevState.id);
            await setCache(updatedCache as any, {tags: [prevState.id]});


            return {
                ...prevState,
                status: 'complete',
                isCorrect: verificationResult.isCorrect,
                verificationDetails: verificationResult.verificationDetails,
            };
        } catch (error: any) {
            console.error("getNextStep (verification) eyleminde bir hata oluştu:", error);
            return {
                id: prevState.id,
                status: 'error',
                question: question,
                error: error.message || 'Doğrulama sırasında bilinmeyen bir hata oluştu.',
            };
        }
    }
}
