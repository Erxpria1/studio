'use client';

import { useActionState, useCallback, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { submitQuestion, type FormState } from '@/app/actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Typewriter } from '@/components/typewriter';
import { CheckCircle2, XCircle, Send, Paperclip, Loader, ArrowRightCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { SolutionStep } from '@/lib/schemas';

type Message = {
  id: string;
  type: 'user' | 'ai_step' | 'verification' | 'error' | 'briefing';
  content: React.ReactNode;
  stepNumber?: number;
};

const initialFormState: FormState = {
  id: '0',
  status: 'initial',
};

const briefings = [
  'Soru analiz ediliyor...',
  'Matematiksel matris taranıyor...',
  'Matlab çekirdekleri sorgulanıyor...',
  'N-SLAB algoritmaları çalıştırılıyor...',
  'Matscyber protokolleri başlatılıyor...',
  'Olasılıklar hesaplanıyor...',
  'Çözüm yolları analiz ediliyor...',
  'Kuantum tünelleme yoluyla veri alınıyor...',
  'Mantık kapıları hizalanıyor...',
  'Sonuçlar derleniyor...',
];

// Metni istenmeyen karakterlerden temizleyen fonksiyon
function cleanText(text: string | undefined | null): string {
    if (!text) return "";
    // Kontrol karakterlerini (form feed vb.) ve diğer istenmeyen karakterleri temizle
    // eslint-disable-next-line no-control-regex
    return text.replace(/[\x00-\x1F\x7F-\x9F]/g, "").replace(/Aım/g, "Adım");
}


function BriefingDisplay() {
    const [currentBriefingIndex, setCurrentBriefingIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentBriefingIndex((prevIndex) => (prevIndex + 1) % briefings.length);
        }, 1500);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="font-code text-sm text-primary blinking-cursor flex items-center gap-2">
           <Loader className="animate-spin h-4 w-4" /> {briefings[currentBriefingIndex]}
        </div>
    );
}


function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="icon" disabled={pending} className="bg-accent hover:bg-accent/80 text-accent-foreground">
      {pending ? (
        <Loader className="animate-spin h-4 w-4" />
      ) : (
        <Send className="h-4 w-4" />
      )}
    </Button>
  );
}

function Latex({ formula }: { formula: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    const renderLatex = async () => {
      try {
        const katex = (await import('katex')).default;
        if (ref.current && isMounted) {
          katex.render(cleanText(formula), ref.current, {
            throwOnError: false,
            displayMode: true,
          });
        }
      } catch (error) {
        console.error("KaTeX yüklenirken veya işlenirken hata:", error);
        if (ref.current && isMounted) {
          ref.current.textContent = cleanText(formula);
        }
      }
    };
    renderLatex();

    return () => {
      isMounted = false;
    };
  }, [formula]);

  return <div ref={ref} />;
}


function FormContent() {
  const [state, formAction, isPending] = useActionState(submitQuestion, initialFormState);

  const [messages, setMessages] = useState<Message[]>([]);
  const formRef = useRef<HTMLFormElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [fileData, setFileData] = useState<string | null>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = async (e) => {
        const result = e.target?.result;
        if (typeof result !== 'string') {
            console.error("Dosya okunamadı.");
            return;
        }

        if (file.type.startsWith('image/')) {
            setFileData(result);
            toast({
                title: "Dosya hazır",
                description: `"${file.name}" analiz edilmeye hazır. Bir soru ekleyin ve gönder'e basın.`,
            });
        } else if (file.type === 'application/pdf') {
            try {
                const {default: pdfjs} = await import('pdfjs-dist');
                const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.min.mjs');
                pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

                const pdf: PDFDocumentProxy = await pdfjs.getDocument(result).promise;
                let fullText = '';
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    fullText += (textContent.items as any[]).map((item: any) => item.str).join(' ') + '\n';
                }
                
                 // Use a more robust method to convert to base64 to avoid character encoding issues
                const binary = new Uint8Array(fullText.split('').map(c => c.charCodeAt(0)));
                const base64 = btoa(String.fromCharCode(...Array.from(binary)));
                const textAsDataUri = `data:text/plain;base64,${base64}`;

                setFileData(textAsDataUri);
                toast({
                    title: "PDF dosyası okundu",
                    description: `"${file.name}" içeriği analiz edilmeye hazır.`,
                });
            } catch (error) {
                console.error("PDF okunurken hata oluştu:", error);
                toast({
                    variant: 'destructive',
                    title: 'PDF Okuma Hatası',
                    description: 'PDF dosyası işlenirken bir sorun oluştu.',
                });
            }
        } else {
            toast({
                variant: 'destructive',
                title: 'Desteklenmeyen Dosya Türü',
                description: 'Lütfen bir resim (JPEG, PNG) veya PDF dosyası seçin.',
            });
        }
    };
    
    reader.readAsDataURL(file);

    if(event.target) {
      event.target.value = '';
    }
  };

  const isProcessing = isPending;

  const handleNextStep = useCallback((stepData: {
    question: string;
    currentStepIndex: number;
    totalSteps: number;
    fullSolution: SolutionStep[];
  }) => {
    if (isProcessing) return;

    setMessages(prev => [...prev, {
      id: Date.now().toString() + '-briefing',
      type: 'briefing',
      content: <BriefingDisplay />
    }]);

    const formData = new FormData();
    formData.append('next_step', 'true');
    formData.append('question', stepData.question);
    formData.append('current_step_index', stepData.currentStepIndex.toString());
    formData.append('total_steps', stepData.totalSteps.toString());
    formData.append('full_solution_json', JSON.stringify(stepData.fullSolution));

    formAction(formData);
  }, [isProcessing, formAction]);

  useEffect(() => {
    if (state.id === '0') return;

    setMessages(prevMessages => {
      const lastMessage = prevMessages[prevMessages.length - 1];
      const isBriefingActive = lastMessage?.type === 'briefing';

      if (state.status === 'error') {
        const newMessages = isBriefingActive ? prevMessages.slice(0, -1) : prevMessages;
        formRef.current?.reset();
        setFileData(null);
        return [
            ...newMessages,
            { id: state.id + '-error', type: 'error', content: `Hata: ${state.error}` }
        ];
      } else if (state.status === 'step_by_step' && state.currentStep) {
          const { currentStep, currentStepIndex, totalSteps, fullSolution } = state;

          // Always start with user message if it's the first step
          let newMessages: Message[] = [];
          if (currentStepIndex === 0 && state.question) {
               newMessages.push({ id: state.id + '-user', type: 'user', content: `> ${state.question}` });
          } else {
              newMessages = isBriefingActive ? prevMessages.slice(0, -1) : prevMessages;
          }

          const showNextBtn = currentStepIndex !== undefined && totalSteps !== undefined && currentStepIndex < totalSteps - 1;

          const newStepMessage: Message = {
              id: `${state.id}-step-${currentStepIndex}`,
              type: 'ai_step',
              content: (
                  <div className="border border-primary/30 rounded-md p-4 bg-black/20 relative pb-14 md:pb-12">
                      <Typewriter
                          text={cleanText(`Adım ${currentStep.stepNumber}: ${currentStep.explanation}`)}
                          speed={10}
                      />
                      <div className="font-code text-accent mt-2 p-2 bg-black/20 rounded-md">
                          <Latex formula={currentStep.formula} />
                      </div>
                      {showNextBtn && state.question && (
                          <Button
                              type="button"
                              disabled={isProcessing}
                              size="icon"
                              variant="ghost"
                              onClick={() => handleNextStep({
                                  question: state.question!,
                                  currentStepIndex: currentStepIndex,
                                  totalSteps: totalSteps,
                                  fullSolution: fullSolution as SolutionStep[]
                              })}
                              className="absolute bottom-2 right-2 text-yellow-500 hover:text-yellow-400 min-h-[48px] min-w-[48px] md:h-10 md:w-10"
                              aria-label="Sonraki adıma geç"
                          >
                              <ArrowRightCircle className="h-6 w-6" />
                          </Button>
                      )}
                  </div>
              ),
              stepNumber: currentStep.stepNumber
          };

          // If this step is already in messages, replace it. Otherwise, add it.
          const existingStepIndex = newMessages.findIndex(m => m.type === 'ai_step' && m.stepNumber === currentStep.stepNumber);
          if (existingStepIndex > -1) {
              newMessages[existingStepIndex] = newStepMessage;
          } else {
              newMessages.push(newStepMessage);
          }

          if (state.currentStepIndex === 0) {
              formRef.current?.reset();
              setFileData(null);
          }

          return newMessages;
      } else if (state.status === 'complete') {
          const newMessages = isBriefingActive ? prevMessages.slice(0, -1) : prevMessages;
          const verificationMsg: Message = {
              id: state.id + '-verification',
              type: 'verification',
              content: (
                  <div className="flex items-start gap-2 p-4 border border-primary/20 rounded-md bg-black/20">
                      {state.isCorrect ? <CheckCircle2 className="text-green-500 mt-1 h-5 w-5 flex-shrink-0" /> : <XCircle className="text-red-500 mt-1 h-5 w-5 flex-shrink-0" />}
                      <Typewriter text={cleanText(state.verificationDetails)} speed={10} />
                  </div>
              )
          };
          return [...newMessages, verificationMsg];
      } else if(state.status === 'initial' || state.status === 'error') {
           formRef.current?.reset();
           setFileData(null);
      }

      return prevMessages;
    });
  }, [state, isProcessing, handleNextStep]);
  
  useEffect(() => {
    viewportRef.current?.scrollTo({ top: viewportRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, state.status]);

  const handleFormSubmit = (formData: FormData) => {
    const question = formData.get('question');

    if (isProcessing) return;

    if (question) {
        setMessages([
            { id: Date.now().toString() + '-user', type: 'user', content: `> ${question}` },
            { id: Date.now().toString() + '-briefing', type: 'briefing', content: <BriefingDisplay />}
        ]);
    }

    formAction(formData);
  };

  const isTerminalOccupied = state.status !== 'initial' && state.status !== 'complete' && state.status !== 'error';

  return (
    <>
      <ScrollArea className="flex-1 pr-4 -mr-4" viewportRef={viewportRef}>
        <div className="flex flex-col gap-4">
          {messages.map((msg) => (
            <div key={msg.id} className={cn(
              'font-code text-sm',
              msg.type === 'user' && 'text-primary',
              msg.type === 'ai_step' && 'text-foreground',
              msg.type === 'verification' && 'text-muted-foreground',
              msg.type === 'error' && 'text-destructive',
              msg.type === 'briefing' && 'text-primary'
            )}>
              {msg.content}
            </div>
          ))}
        </div>
      </ScrollArea>
      <div className="mt-4">
        <form
            ref={formRef}
            action={handleFormSubmit}
            className="relative"
        >
          <input type="hidden" name="fileData" value={fileData || ''} />
          <div className="relative flex w-full items-center">
            <Input
              name="question"
              placeholder="> Bir matematik sorusu sorun... örn., 'x için çöz: 2x + 5 = 15'"
              className="bg-background/50 border-primary/50 focus-visible:ring-accent focus-visible:border-accent text-base pr-20 md:pr-24 font-code"
              autoComplete="off"
              disabled={isProcessing || isTerminalOccupied}
            />
            <div className="absolute right-1 top-1/2 flex -translate-y-1/2 items-center gap-1">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*,application/pdf"
              />
              <Button type="button" size="icon" variant="ghost" onClick={handleUploadClick} disabled={isProcessing || isTerminalOccupied} className="h-8 w-8 text-accent hover:text-accent/80">
                <Paperclip className="h-4 w-4" />
              </Button>
              <SubmitButton />
            </div>
          </div>
          {fileData && !isTerminalOccupied && (
            <div className="mt-2 text-xs text-muted-foreground">
              Bir dosya eklendi. Kaldırmak için alanı temizleyin veya yeni bir dosya seçin.
            </div>
          )}
        </form>
      </div>
    </>
  )
}


export function MathTerminal() {
  return (
    <Card className="w-full max-w-full md:max-w-3xl h-[85vh] md:h-[80vh] flex flex-col bg-card/80 backdrop-blur-sm border-primary/20 shadow-lg shadow-primary/10">
      <CardHeader className="pb-3 md:pb-6">
        <CardTitle className="font-headline text-primary flex items-center gap-2 text-sm md:text-base">
          <span className="truncate">// MATEMATİK_SİBER_TERMINAL v1.0</span>
          <span className="h-3 w-3 md:h-4 md:w-4 bg-primary animate-pulse rounded-full flex-shrink-0" />
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden px-3 md:px-6">
        <FormContent />
      </CardContent>
    </Card>
  );
}
