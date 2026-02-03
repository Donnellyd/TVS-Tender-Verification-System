import { useEffect, useState, useMemo } from "react";
import { Search, Book, MessageCircleQuestion } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { helpContent } from "@/lib/helpContent";
import { useLocation } from "wouter";

interface SearchResult {
  type: "module" | "faq" | "section";
  moduleId: string;
  title: string;
  content: string;
  question?: string;
}

export function GlobalHelpSearch() {
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const allResults: SearchResult[] = useMemo(() => {
    const results: SearchResult[] = [];
    
    Object.entries(helpContent).forEach(([moduleId, content]) => {
      results.push({
        type: "module",
        moduleId,
        title: content.title,
        content: content.description,
      });
      
      content.sections.forEach((section) => {
        results.push({
          type: "section",
          moduleId,
          title: section.title,
          content: section.content,
        });
      });
      
      content.faqs.forEach((faq) => {
        results.push({
          type: "faq",
          moduleId,
          title: content.title,
          content: faq.answer,
          question: faq.question,
        });
      });
    });
    
    return results;
  }, []);

  const handleSelect = (result: SearchResult) => {
    setOpen(false);
    const moduleRoutes: Record<string, string> = {
      dashboard: "/",
      vendors: "/vendors",
      tenders: "/tenders",
      documents: "/documents",
      compliance: "/compliance",
      analytics: "/analytics",
      billing: "/billing",
      "api-settings": "/api-settings",
      "email-templates": "/email-templates",
      "country-launch": "/country-launch",
      pricing: "/pricing",
      help: "/help",
    };
    const route = moduleRoutes[result.moduleId];
    if (route) {
      setLocation(route);
    }
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search help topics, FAQs, and guides..." data-testid="input-help-search" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Modules">
          {allResults
            .filter((r) => r.type === "module")
            .map((result) => (
              <CommandItem
                key={`module-${result.moduleId}`}
                value={`${result.title} ${result.content}`}
                onSelect={() => handleSelect(result)}
                data-testid={`search-result-${result.moduleId}`}
              >
                <Book className="mr-2 h-4 w-4" />
                <div className="flex flex-col">
                  <span>{result.title}</span>
                  <span className="text-xs text-muted-foreground line-clamp-1">
                    {result.content}
                  </span>
                </div>
              </CommandItem>
            ))}
        </CommandGroup>
        <CommandGroup heading="FAQs">
          {allResults
            .filter((r) => r.type === "faq")
            .slice(0, 10)
            .map((result, index) => (
              <CommandItem
                key={`faq-${result.moduleId}-${index}`}
                value={`${result.question} ${result.content}`}
                onSelect={() => handleSelect(result)}
              >
                <MessageCircleQuestion className="mr-2 h-4 w-4" />
                <div className="flex flex-col">
                  <span className="line-clamp-1">{result.question}</span>
                  <span className="text-xs text-muted-foreground">
                    {result.title}
                  </span>
                </div>
              </CommandItem>
            ))}
        </CommandGroup>
      </CommandList>
      <div className="border-t p-2 text-xs text-muted-foreground text-center">
        Press <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs">Esc</kbd> to close
      </div>
    </CommandDialog>
  );
}

export function HelpSearchTrigger() {
  return (
    <button
      onClick={() => {
        const event = new KeyboardEvent("keydown", {
          key: "k",
          ctrlKey: true,
          bubbles: true,
        });
        document.dispatchEvent(event);
      }}
      className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground rounded-md border bg-background hover-elevate"
      data-testid="button-help-search"
    >
      <Search className="h-4 w-4" />
      <span>Search help...</span>
      <kbd className="hidden sm:inline-flex ml-auto px-1.5 py-0.5 rounded bg-muted font-mono text-xs">
        Ctrl+K
      </kbd>
    </button>
  );
}
