"use client";

import { Clock, FileText, CalendarDays } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { ContentStatus } from "@/types/content";

interface ContentViewerProps {
  title: string;
  content: string;
  wordCount: number;
  readTimeMinutes: number;
  status: ContentStatus;
  createdAt: Date;
  version?: number;
}

const statusConfig: Record<
  ContentStatus,
  { label: string; variant: "default" | "secondary" | "outline" }
> = {
  draft: { label: "Draft", variant: "secondary" },
  final: { label: "Final", variant: "default" },
  published: { label: "Published", variant: "outline" },
};

export function ContentViewer({
  title,
  content,
  wordCount,
  readTimeMinutes,
  status,
  createdAt,
  version,
}: ContentViewerProps) {
  const statusInfo = statusConfig[status];
  const formattedDate = new Date(createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Card className="border-0 shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0">
        {/* Title */}
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          {title}
        </h1>

        {/* Meta info */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-4">
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            <span>{readTimeMinutes} min read</span>
          </div>
          <div className="flex items-center gap-1.5">
            <FileText className="h-4 w-4" />
            <span>{wordCount.toLocaleString()} words</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4" />
            <span>{formattedDate}</span>
          </div>
          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
          {version && version > 1 && (
            <Badge variant="outline" className="text-xs">
              v{version}
            </Badge>
          )}
        </div>

        <Separator className="mt-4" />
      </CardHeader>

      <CardContent className="px-0 pb-0">
        <article className="prose prose-neutral dark:prose-invert max-w-none">
          <ReactMarkdown
            components={{
              // Custom heading styles
              h1: ({ children }) => (
                <h1 className="text-2xl font-bold mt-8 mb-4 first:mt-0">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-xl font-semibold mt-8 mb-3 border-b pb-2">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-lg font-medium mt-6 mb-2">{children}</h3>
              ),
              // Paragraph styling
              p: ({ children }) => (
                <p className="leading-7 mb-4 text-foreground/90">{children}</p>
              ),
              // Blockquote styling for emphasized content
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-primary/50 pl-4 italic my-6 text-foreground/80 bg-muted/30 py-2 rounded-r">
                  {children}
                </blockquote>
              ),
              // List styling
              ul: ({ children }) => (
                <ul className="list-disc pl-6 mb-4 space-y-1">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal pl-6 mb-4 space-y-1">{children}</ol>
              ),
              li: ({ children }) => (
                <li className="leading-7">{children}</li>
              ),
              // Strong text
              strong: ({ children }) => (
                <strong className="font-semibold text-foreground">
                  {children}
                </strong>
              ),
              // Emphasis
              em: ({ children }) => (
                <em className="italic">{children}</em>
              ),
              // Code blocks
              code: ({ className, children }) => {
                const isInline = !className;
                if (isInline) {
                  return (
                    <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">
                      {children}
                    </code>
                  );
                }
                return (
                  <code className="block bg-muted p-4 rounded-lg overflow-x-auto text-sm font-mono">
                    {children}
                  </code>
                );
              },
              // Horizontal rule
              hr: () => <Separator className="my-8" />,
            }}
          >
            {content}
          </ReactMarkdown>
        </article>
      </CardContent>
    </Card>
  );
}
