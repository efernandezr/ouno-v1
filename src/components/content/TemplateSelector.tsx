"use client";

import { FileText, ListOrdered, BookOpen, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ContentTemplate } from "@/types/content";

const TEMPLATES: Array<{
  id: ContentTemplate;
  name: string;
  description: string;
  icon: React.ReactNode;
}> = [
  {
    id: "blog_post",
    name: "Standard Article",
    description: "Traditional blog format with sections and flow",
    icon: <FileText className="h-5 w-5" />,
  },
  {
    id: "listicle",
    name: "Key Points",
    description: "Numbered list of takeaways and insights",
    icon: <ListOrdered className="h-5 w-5" />,
  },
  {
    id: "narrative",
    name: "Personal Story",
    description: "First-person narrative without rigid structure",
    icon: <BookOpen className="h-5 w-5" />,
  },
];

interface TemplateSelectorProps {
  value: ContentTemplate;
  onChange: (template: ContentTemplate) => void;
  disabled?: boolean;
}

export function TemplateSelector({
  value,
  onChange,
  disabled = false,
}: TemplateSelectorProps) {
  return (
    <div className="grid gap-3">
      {TEMPLATES.map((template) => {
        const isSelected = value === template.id;
        return (
          <Card
            key={template.id}
            className={cn(
              "cursor-pointer transition-all",
              isSelected
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "hover:border-muted-foreground/50",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            onClick={() => !disabled && onChange(template.id)}
          >
            <CardContent className="flex items-start gap-4 p-4">
              <div
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border mt-0.5",
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted-foreground/30"
                )}
              >
                {isSelected && <Check className="h-3 w-3" />}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "transition-colors",
                      isSelected ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    {template.icon}
                  </span>
                  <span
                    className={cn(
                      "font-medium",
                      isSelected && "text-primary"
                    )}
                  >
                    {template.name}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {template.description}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
