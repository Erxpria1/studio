'use client';

import { useActionState, useEffect, useRef, useState, useMemo } from 'react';
import { useFormStatus } from 'react-dom';
import { submitQuestion, getNextStep, type FormState } from '@/app/actions';
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
          katex.render(formula, ref.current, {
            throwOnError: false,
            displayMode: true,
          });
        }
      } catch (error) {
        console.error("KaTeX yüklenirken veya işlenirken hata:", error);
        if (ref.current && isMounted) {
          ref.current.textContent = formula;
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
                
                const textEncoder = new TextEncoder();
                const utf8Bytes = textEncoder.encode(fullText);
                let binary = '';
                utf8Bytes.forEach(byte => {
                    binary += String.fromCharCode(byte);
                });
                const textAsDataUri = `data:text/plain;base64,${btoa(binary)}`;

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

  
  useEffect(() => {
    if (state.id === '0') return;

    const lastMessage = messages[messages.length - 1];
    const isBriefingActive = lastMessage?.type === 'briefing';

    if (state.status === 'error') {
      const newMessages = isBriefingActive ? messages.slice(0, -1) : messages;
      setMessages([
          ...newMessages,
          { id: state.id + '-error', type: 'error', content: `Hata: ${state.error}` }
      ]);
      formRef.current?.reset();
      setFileData(null);
    } else if (state.status === 'step_by_step' && state.currentStep) {
        const { currentStep, currentStepIndex, totalSteps, fullSolution } = state;
        
        let newMessages = [...messages];
        if (isBriefingActive) {
            newMessages.pop(); // Remove briefing message
        }

        const userMsgExists = newMessages.some(msg => msg.type === 'user');
        if (!userMsgExists && state.question) {
            newMessages.unshift({ id: state.id + '-user', type: 'user', content: `> ${state.question}` });
        }
        
        const showNextBtn = currentStepIndex !== undefined && totalSteps !== undefined && currentStepIndex < totalSteps - 1;

        const newStepMessage: Message = {
            id: `${state.id}-step-${currentStep.stepNumber}`,
            type: 'ai_step',
            content: (
                <div className="border border-primary/30 rounded-md p-4 bg-black/20 relative pb-12">
                    <Typewriter
                        text={`Adım ${currentStep.stepNumber}: ${currentStep.explanation}`}
                        speed={10}
                    />
                    <div className="font-code text-accent mt-2 p-2 bg-black/20 rounded-md">
                        <Latex formula={currentStep.formula} />
                    </div>
                    {showNextBtn && (
                       <form action={formAction}>
                            <input type="hidden" name="next_step" value="true" />
                            <input type="hidden" name="question" value={state.question} />
                            <input type="hidden" name="current_step_index" value={currentStepIndex} />
                            <input type="hidden" name="total_steps" value={totalSteps} />
                            <input type="hidden" name="full_solution_json" value={JSON.stringify(fullSolution)} />
                            <Button type="submit" disabled={isProcessing} size="icon" variant="ghost" className="absolute bottom-2 right-2 text-yellow-500 hover:text-yellow-400 h-8 w-8">
                               <ArrowRightCircle className="h-6 w-6" />
                            </Button>
                        </form>
                    )}
                </div>
            ),
            stepNumber: currentStep.stepNumber
        };
        
        const existingStepIndex = newMessages.findIndex(m => m.id === newStepMessage.id);
        if (existingStepIndex > -1) {
            newMessages[existingStepIndex] = newStepMessage;
        } else {
            newMessages.push(newStepMessage);
        }

        setMessages(newMessages);
        
        if (state.currentStepIndex === 0) {
            formRef.current?.reset();
            setFileData(null);
        }
    } else if (state.status === 'complete') {
        const newMessages = isBriefingActive ? messages.slice(0, -1) : messages;
        const verificationMsg: Message = {
            id: state.id + '-verification',
            type: 'verification',
            content: (
                <div className="flex items-start gap-2 p-4 border border-primary/20 rounded-md bg-black/20">
                    {state.isCorrect ? <CheckCircle2 className="text-green-500 mt-1 h-5 w-5 flex-shrink-0" /> : <XCircle className="text-red-500 mt-1 h-5 w-5 flex-shrink-0" />}
                    <Typewriter text={state.verificationDetails || ''} speed={10} />
                </div>
            )
        };
        setMessages([...newMessages, verificationMsg]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const handleSubmit = (formData: FormData) => {
    const question = formData.get('question');
    if (!question || isProcessing) return;

    // Clear previous messages except the new user question
    setMessages([
        { id: Date.now().toString() + '-user', type: 'user', content: `> ${question}` },
        { id: Date.now().toString() + '-briefing', type: 'briefing', content: <BriefingDisplay />}
    ]);
    
    // This will be handled by the form's action prop now
    // formAction(formData);
  };
  
  useEffect(() => {
    viewportRef.current?.scrollTo({ top: viewportRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, state.status]);

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
            action={(formData) => {
                const question = formData.get('question') as string;
                if (question && !isProcessing) {
                     setMessages([
                        { id: Date.now().toString() + '-user', type: 'user', content: `> ${question}` },
                        { id: Date.now().toString() + '-briefing', type: 'briefing', content: <BriefingDisplay />}
                    ]);
                    formAction(formData);
                }
            }} 
            className="relative"
        >
          <input type="hidden" name="fileData" value={fileData || ''} />
          <div className="relative flex w-full items-center">
            <Input
              name="question"
              placeholder="> Bir matematik sorusu sorun... örn., 'x için çöz: 2x + 5 = 15'"
              className="bg-background/50 border-primary/50 focus-visible:ring-accent focus-visible:border-accent text-base pr-24 font-code"
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
    <Card className="w-full max-w-3xl h-[80vh] flex flex-col bg-card/80 backdrop-blur-sm border-primary/20 shadow-lg shadow-primary/10">
      <CardHeader>
        <CardTitle className="font-headline text-primary flex items-center gap-2">
          <span>// MATEMATİK_SİBER_TERMINAL v1.0</span>
          <span className="h-4 w-4 bg-primary animate-pulse rounded-full" />
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
        <FormContent />
      </CardContent>
    </Card>
  );
}

    