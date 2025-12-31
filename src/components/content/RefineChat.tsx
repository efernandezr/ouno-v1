"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Send, Loader2, MessageSquare, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  changes?: string[];
}

interface RefineChatProps {
  contentId: string;
  onRefineComplete: (result: {
    contentId: string;
    content: string;
    changes: string[];
  }) => void;
}

export function RefineChat({ contentId, onRefineComplete }: RefineChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isRefining, setIsRefining] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const instruction = input.trim();
      if (!instruction || isRefining) return;

      // Add user message
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: instruction,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setIsRefining(true);

      try {
        const response = await fetch(`/api/content/${contentId}/refine`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            refinementType: "text",
            instruction,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to refine content");
        }

        const result = await response.json();

        // Add assistant message with changes
        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: formatChangesMessage(result.changes),
          timestamp: new Date(),
          changes: result.changes,
        };
        setMessages((prev) => [...prev, assistantMessage]);

        onRefineComplete({
          contentId: result.contentId,
          content: result.content,
          changes: result.changes,
        });
      } catch (error) {
        console.error("Refine error:", error);
        // Add error message
        const errorMessage: ChatMessage = {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: `Sorry, I couldn't apply that change: ${error instanceof Error ? error.message : "Unknown error"}`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsRefining(false);
      }
    },
    [input, contentId, isRefining, onRefineComplete]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageSquare className="h-5 w-5" />
          Refine with Text
        </CardTitle>
        <CardDescription>
          Describe changes you&apos;d like to make
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-6 space-y-4 min-h-[200px] max-h-[400px]">
          {messages.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Wand2 className="h-8 w-8 mx-auto mb-3 opacity-50" />
              <p className="text-sm">
                Type your refinement instructions below
              </p>
              <p className="text-xs mt-2">
                Examples: &quot;Make it shorter&quot;, &quot;Add a call to action&quot;,
                &quot;Change the tone to be more casual&quot;
              </p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))}

          {isRefining && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg px-4 py-2">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Refining...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <form onSubmit={handleSubmit} className="border-t p-4">
          <div className="flex gap-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe changes you'd like..."
              className="min-h-[40px] max-h-[120px] resize-none"
              disabled={isRefining}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || isRefining}
            >
              {isRefining ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

function formatChangesMessage(changes: string[]): string {
  if (!changes || changes.length === 0) {
    return "Content has been refined.";
  }

  return `✓ Changes applied:\n${changes.map((c) => `• ${c}`).join("\n")}`;
}
