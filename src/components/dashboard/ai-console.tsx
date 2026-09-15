import { BrainCircuit, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useScope } from "@/hooks/use-scope";
import { supabase } from "@/integrations/supabase/client";
import { can } from "@/lib/rbac";
import { cn } from "@/lib/utils";

type ChatMessage = { role: "user" | "assistant"; content: string };

const SUGGESTIONS_OWNER = [
  "Which restaurant is bleeding the most money this month and why?",
  "Explain the critical theft anomaly and what I should do in the next hour.",
  "Give me a CFO-grade read on COGS and labour against budget.",
];

const SUGGESTIONS_ROLE = [
  "What is my revenue versus budget right now?",
  "Which audits are about to breach their SLA?",
  "What should my kitchen prep for tomorrow?",
];

export function AiConsole({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const scope = useScope();
  const godMode = can(scope.role, "god_mode");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  async function send(text: string) {
    const question = text.trim();
    if (!question || busy) return;
    const next = [...messages, { role: "user" as const, content: question }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ messages: next.slice(-12) }),
      });
      const payload = (await res.json().catch(() => ({}))) as {
        text?: string;
        error?: string;
      };
      if (!res.ok) {
        const message =
          res.status === 402
            ? "AI credits are exhausted. Add credits, or add a Google AI Studio key to bill your own quota."
            : res.status === 429
              ? "Too many requests right now — try again in a moment."
              : (payload.error ?? "The assistant could not answer that.");
        toast.error(message);
        setMessages([...next, { role: "assistant", content: message }]);
        return;
      }
      setMessages([
        ...next,
        { role: "assistant", content: payload.text ?? "No answer returned." },
      ]);
    } catch {
      toast.error("Network error reaching the assistant.");
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  }

  const suggestions = godMode ? SUGGESTIONS_OWNER : SUGGESTIONS_ROLE;

  return (
    <>
      {open ? (
        <button
          aria-label="Close assistant"
          className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm"
          onClick={() => onOpenChange(false)}
        />
      ) : null}
      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-border bg-card transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full",
        )}
        aria-hidden={!open}
      >
        <header className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-primary/15 text-primary">
              <BrainCircuit className="size-4" />
            </span>
            <div>
              <p className="font-display text-sm font-semibold">
                {godMode ? "God-Mode Console" : "Operations Assistant"}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {godMode
                  ? "Unrestricted access to every restaurant and ledger"
                  : `Scoped to ${scope.role}${scope.home ? ` · ${scope.home.code}` : ""}`}
              </p>
            </div>
          </div>
          <button type="button" onClick={() => onOpenChange(false)} aria-label="Close">
            <X className="size-5 text-muted-foreground" />
          </button>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
          {messages.length === 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Ask about revenue, variance, audits, staffing or theft risk. Answers are built
                from live data inside your authority.
              </p>
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="w-full rounded-lg border border-border px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-accent"
                >
                  {s}
                </button>
              ))}
            </div>
          ) : null}

          {messages.map((m, i) => (
            <div
              key={i}
              className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[85%] whitespace-pre-wrap rounded-xl px-3 py-2 text-sm leading-relaxed",
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground",
                )}
              >
                {m.content}
              </div>
            </div>
          ))}

          {busy ? (
            <p className="animate-pulse text-sm text-muted-foreground">Thinking…</p>
          ) : null}
          <div ref={endRef} />
        </div>

        <form
          className="border-t border-border p-3"
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              placeholder="Ask the command console…"
              className="min-h-[52px] flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <Button type="submit" size="icon" disabled={busy || !input.trim()}>
              <Send className="size-4" />
            </Button>
          </div>
        </form>
      </aside>
    </>
  );
}
