'use client';

import { useActionState, useEffect, useRef, useState, useMemo } from 'react';
import { useFormStatus } from 'react-dom';
import { getSolution, type SolutionState } from '@/app/actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Typewriter } from '@/components/typewriter';
import { CheckCircle2, XCircle, AlertTriangle, Send, Paperclip } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import 'katex/dist/katex.min.css';

type Message = {
  id: number;
  type: 'user' | 'ai' | 'verification';
  content: string | React.ReactNode;
};

const initialState: SolutionState = {
  id: 0,
  status: 'success',
  question: '',
};

const briefings = [
  'AI çekirdekleri etkinleştiriliyor...',
  'Matematiksel matris taranıyor...',
  'Sinir ağları sorgulanıyor...',
  'Olasılıklar hesaplanıyor...',
  'Çözüm yolları analiz ediliyor...',
  'Doğrulama protokolleri başlatılıyor...',
  'Kuantum tünelleme yoluyla veri alınıyor...',
  'Siber uzayda çözüm aranıyor...',
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
        <div className="font-code text-sm text-primary blinking-cursor">
            {briefings[currentBriefingIndex]}
        </div>
    );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="icon" disabled={pending} className="bg-accent hover:bg-accent/80 text-accent-foreground">
      {pending ? (
        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        <Send className="h-4 w-4" />
      )}
    </Button>
  );
}

function AiSolution({ solutionSteps }: { solutionSteps: SolutionState['solution'] }) {
    const [completedSteps, setCompletedSteps] = useState<number[]>([]);

    if (!solutionSteps) return null;

    return (
        <div className="flex flex-col gap-4">
            {solutionSteps.map((step, index) => (
                <div key={index} className="border border-primary/30 rounded-md p-4 bg-card/50">
                    <Typewriter
                        text={`Adım ${step.stepNumber}: ${step.explanation}`}
                        speed={10}
                        onComplete={() => {
                            setCompletedSteps(prev => [...prev, step.stepNumber]);
                        }}
                    />
                    {completedSteps.includes(step.stepNumber) && (
                         <div className="font-code text-accent mt-2 p-2 bg-black/20 rounded-md">
                            <Latex formula={step.formula} />
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

function Latex({ formula }: { formula: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const renderLatex = async () => {
      try {
        const katex = (await import('katex')).default;
        if (ref.current) {
          katex.render(formula, ref.current, {
            throwOnError: false,
            displayMode: true,
          });
        }
      } catch (error) {
        console.error("KaTeX yüklenirken veya işlenirken hata:", error);
        if (ref.current) {
          ref.current.textContent = formula;
        }
      }
    };
    renderLatex();
  }, [formula]);

  return <div ref={ref} />;
}


function FormContent() {
  const [state, formAction] = useActionState(getSolution, initialState);
  const [messages, setMessages] = useState<Message[]>([]);
  const formRef = useRef<HTMLFormElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const { pending } = useFormStatus();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [fileData, setFileData] = useState<string | null>(null);

  const [isAiTyping, setIsAiTyping] = useState(false);
  const [typingComplete, setTypingComplete] = useState(false);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const processFile = async (file: File) => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setFileData(e.target?.result as string);
                toast({
                    title: "Dosya hazır",
                    description: `"${file.name}" analiz edilmeye hazır. Bir soru ekleyin ve gönder'e basın.`,
                });
            };
            reader.readAsDataURL(file);
        } else if (file.type === 'application/pdf') {
            try {
                const pdfjs = await import('pdfjs-dist');
                const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.min.mjs');
                pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

                const reader = new FileReader();
                reader.onload = async (e) => {
                    const arrayBuffer = e.target?.result as ArrayBuffer;
                    if (arrayBuffer) {
                        try {
                            const pdf: PDFDocumentProxy = await pdfjs.getDocument(new Uint8Array(arrayBuffer)).promise;
                            let fullText = '';
                            for (let i = 1; i <= pdf.numPages; i++) {
                                const page = await pdf.getPage(i);
                                const textContent = await page.getTextContent();
                                fullText += textContent.items.map((item: any) => item.str).join(' ') + '\n';
                            }
                            
                            const textAsDataUri = `data:text/plain;base64,${btoa(unescape(encodeURIComponent(fullText)))}`;

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
                    }
                };
                reader.readAsArrayBuffer(file);
            } catch (error) {
                console.error("pdfjs-dist yüklenirken hata oluştu:", error);
                toast({
                    variant: 'destructive',
                    title: 'PDF Yükleyici Hatası',
                    description: 'PDF işleyici yüklenemedi. Lütfen tekrar deneyin.',
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
    
    await processFile(file);

    if(event.target) {
      event.target.value = '';
    }
  };
  
  useEffect(() => {
    if (state.id === 0) return;

    // Use a more robust way to prevent duplicate message processing
    const lastMessageId = messages.length > 0 ? messages[messages.length - 1].id : 0;
    if (lastMessageId >= state.id + 2) return;

    const userMsg: Message = { id: state.id, type: 'user', content: `> ${state.question}` };

    if (state.status === 'success' && state.question && state.solution) {
      setIsAiTyping(true);
      setTypingComplete(false);
      
      const aiMsg: Message = {
        id: state.id + 1,
        type: 'ai',
        content: <AiSolution solutionSteps={state.solution} />,
      };
      
      // Check if user message already exists
      const userMsgExists = messages.some(msg => msg.id === userMsg.id);
      
      setMessages(prev => userMsgExists ? [...prev, aiMsg] : [...prev, userMsg, aiMsg]);

      // Delay verification message until after solution is fully displayed
      const totalTypingTime = (state.solution.reduce((acc, s) => acc + s.explanation.length, 0)) * 10 + state.solution.length * 500;
      setTimeout(() => {
          setIsAiTyping(false);
          setTypingComplete(true);
      }, totalTypingTime);
      
      formRef.current?.reset();
      setFileData(null);

    } else if (state.status === 'error' && state.error) {
       const userMsgExists = messages.some(msg => msg.id === userMsg.id);
       const errorMsg: Message = {
        id: state.id + 1,
        type: 'verification',
        content: (
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle />
            <span>Hata: {state.error}</span>
          </div>
        )
      };
      setMessages(prev => userMsgExists ? [...prev, errorMsg] : [...prev, userMsg, errorMsg]);
      formRef.current?.reset();
      setFileData(null);
      setIsAiTyping(false);
    }
  }, [state]);

  useEffect(() => {
    if (typingComplete && state.status === 'success' && state.isCorrect !== undefined) {
        const lastMessage = messages[messages.length - 1];
        // Ensure verification message is not already present
        if (lastMessage?.type !== 'verification') {
            const verificationMsg: Message = {
                id: state.id + 2,
                type: 'verification',
                content: (
                    <div className="flex items-center gap-2">
                        {state.isCorrect ? <CheckCircle2 className="text-green-500" /> : <XCircle className="text-red-500" />}
                        <span>{state.verificationDetails}</span>
                    </div>
                )
            };
            setMessages(prev => [...prev, verificationMsg]);
        }
        setTypingComplete(false); // Reset for next submission
    }
  }, [typingComplete, state, messages]);

  useEffect(() => {
    viewportRef.current?.scrollTo({ top: viewportRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isAiTyping, pending]);

  return (
    <>
      <ScrollArea className="flex-1 pr-4 -mr-4" viewportRef={viewportRef}>
        <div className="flex flex-col gap-4">
          {messages.map((msg) => (
            <div key={msg.id} className={cn(
              'font-code text-sm',
              msg.type === 'user' && 'text-accent',
              msg.type === 'ai' && 'text-foreground',
              msg.type === 'verification' && 'text-muted-foreground'
            )}>
              {msg.content}
            </div>
          ))}
           {pending && <BriefingDisplay />}
        </div>
      </ScrollArea>
      <form ref={formRef} action={formAction} className="relative mt-4">
        <input type="hidden" name="fileData" value={fileData || ''} />
        <div className="relative flex w-full items-center">
          <Input
            name="question"
            placeholder="> Bir matematik sorusu sorun... örn., 'x için çöz: 2x + 5 = 15'"
            className="bg-background/50 border-accent/50 focus-visible:ring-accent focus-visible:border-accent text-base pr-24 font-code"
            autoComplete="off"
            disabled={pending}
          />
          <div className="absolute right-1 top-1/2 flex -translate-y-1/2 items-center gap-1">
             <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*,application/pdf"
            />
            <Button type="button" size="icon" variant="ghost" onClick={handleUploadClick} disabled={pending} className="h-8 w-8 text-accent hover:text-accent/80">
              <Paperclip className="h-4 w-4" />
            </Button>
            <SubmitButton />
          </div>
        </div>
         {fileData && (
          <div className="mt-2 text-xs text-muted-foreground">
            Bir dosya eklendi. Kaldırmak için alanı temizleyin veya yeni bir dosya seçin.
          </div>
        )}
      </form>
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
