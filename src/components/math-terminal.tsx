'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useEffect, useRef, useState } from 'react';
import { getSolution, type SolutionState } from '@/app/actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Typewriter } from '@/components/typewriter';
import { CheckCircle2, XCircle, AlertTriangle, Send, Paperclip } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

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

export function MathTerminal() {
  const [state, formAction] = useFormState(getSolution, initialState);
  const [messages, setMessages] = useState<Message[]>([]);
  const formRef = useRef<HTMLFormElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [typingComplete, setTypingComplete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      toast({
        title: "File ready",
        description: `"${file.name}" is ready to be analyzed. Add a question and hit send.`,
      });
    }
  };

  useEffect(() => {
    if (state.id === 0) return; // Initial state, do nothing

    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.id > state.id) return;

    if (state.status === 'success' && state.question && state.solution) {
      setTypingComplete(false);
      const userMsg: Message = { id: state.id, type: 'user', content: `> ${state.question}` };
      
      setIsAiTyping(true);
      const aiMsg: Message = {
        id: state.id + 1,
        type: 'ai',
        content: <Typewriter text={state.solution} onComplete={() => {
          setIsAiTyping(false);
          setTypingComplete(true);
        }} />,
      };
      setMessages(prev => [...prev, userMsg, aiMsg]);
      formRef.current?.reset();
    } else if (state.status === 'error' && state.error) {
      const userMsg: Message = { id: state.id, type: 'user', content: `> ${state.question}` };
      const errorMsg: Message = {
        id: state.id + 1,
        type: 'verification',
        content: (
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle />
            <span>Error: {state.error}</span>
          </div>
        )
      };
      setMessages(prev => [...prev, userMsg, errorMsg]);
      formRef.current?.reset();
    }
  }, [state]);

  useEffect(() => {
    if (typingComplete && state.status === 'success' && messages[messages.length - 1]?.type !== 'verification') {
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
        setTypingComplete(false);
    }
  }, [typingComplete, state, messages]);

  useEffect(() => {
    viewportRef.current?.scrollTo({ top: viewportRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isAiTyping]);

  return (
    <Card className="w-full max-w-3xl h-[80vh] flex flex-col bg-card/80 backdrop-blur-sm border-primary/20 shadow-lg shadow-primary/10">
      <CardHeader>
        <CardTitle className="font-headline text-primary flex items-center gap-2">
          <span>// MATH_CYBER_TERMINAL v1.0</span>
          <span className="h-4 w-4 bg-primary animate-pulse rounded-full" />
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
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
             {isAiTyping && <div className="text-foreground font-code text-sm blinking-cursor"></div>}
          </div>
        </ScrollArea>
        <form ref={formRef} action={formAction} className="relative mt-4">
          <div className="relative flex w-full items-center">
            <Input
              name="question"
              placeholder="> Ask a math question... e.g., 'Solve for x: 2x + 5 = 15'"
              className="bg-background/50 border-accent/50 focus-visible:ring-accent focus-visible:border-accent text-base pr-24 font-code"
              autoComplete="off"
              disabled={useFormStatus().pending}
            />
            <div className="absolute right-1 top-1/2 flex -translate-y-1/2 items-center gap-1">
               <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*"
              />
              <Button type="button" size="icon" variant="ghost" onClick={handleUploadClick} disabled={useFormStatus().pending} className="h-8 w-8 text-accent hover:text-accent/80">
                <Paperclip className="h-4 w-4" />
              </Button>
              <SubmitButton />
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
