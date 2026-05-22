import React, { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Send, MessageSquare, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

type Msg = { role: 'user' | 'assistant'; content: string };

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  metaStudyId: string;
  title: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-meta-study`;

const MetaStudyChatDialog: React.FC<Props> = ({ open, onOpenChange, metaStudyId, title }) => {
  const { t, i18n } = useTranslation();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const suggestions = i18n.language?.startsWith('en')
    ? [
        'What is the core architectural contribution of this paper?',
        'Which of our Core Rules does it most strongly support?',
        'What is the main limitation for canine geroprotector application?',
      ]
    : [
        'Qual a contribuição arquitetural central deste paper?',
        'Quais Core Rules nossas ele apoia com mais força?',
        'Qual a maior limitação para aplicação em geroprotetores caninos?',
      ];

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Msg = { role: 'user', content: text.trim() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput('');
    setLoading(true);
    const controller = new AbortController();
    abortRef.current = controller;
    let acc = '';
    try {
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ meta_study_id: metaStudyId, messages: next }),
        signal: controller.signal,
      });
      if (!resp.ok || !resp.body) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${resp.status}`);
      }
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      let done = false;
      while (!done) {
        const { done: d, value } = await reader.read();
        if (d) break;
        buf += decoder.decode(value, { stream: true });
        let idx;
        while ((idx = buf.indexOf('\n')) !== -1) {
          let line = buf.slice(0, idx);
          buf = buf.slice(idx + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') { done = true; break; }
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              acc += delta;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === 'assistant') {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: acc } : m);
                }
                return [...prev, { role: 'assistant', content: acc }];
              });
            }
          } catch {
            buf = line + '\n' + buf;
            break;
          }
        }
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        toast.error(e.message || t('fundamentos.chat.error', 'Falha no chat'));
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) abortRef.current?.abort(); onOpenChange(o); }}>
      <DialogContent className="max-w-2xl h-[70vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="h-4 w-4 text-primary" />
            {t('fundamentos.chat.title', 'Conversar sobre este paper')}
          </DialogTitle>
          <DialogDescription className="text-xs line-clamp-1">{title}</DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1 pr-3">
          <div className="space-y-3">
            {messages.length === 0 && (
              <div className="text-xs text-muted-foreground space-y-2 pt-4">
                <div className="font-medium flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-amber-500" />
                  {t('fundamentos.chat.suggestions', 'Sugestões')}:
                </div>
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    className="block text-left text-xs px-2 py-1.5 rounded border bg-secondary/20 hover:bg-secondary/40 w-full"
                    onClick={() => send(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                  m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary/40'
                }`}>
                  {m.content || <Loader2 className="h-3 w-3 animate-spin inline" />}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="flex gap-2 pt-2 border-t">
          <Input
            placeholder={t('fundamentos.chat.placeholder', 'Pergunte sobre o paper…')}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !loading) send(input); }}
            disabled={loading}
          />
          <Button onClick={() => send(input)} disabled={loading || !input.trim()} size="icon">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MetaStudyChatDialog;