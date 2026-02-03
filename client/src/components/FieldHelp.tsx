import { HelpCircle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { fieldHelp } from "@/lib/helpContent";

interface FieldHelpProps {
  fieldId: string;
  content?: {
    title: string;
    description: string;
    example?: string;
  };
}

export function FieldHelp({ fieldId, content }: FieldHelpProps) {
  const helpData = content || fieldHelp[fieldId];
  
  if (!helpData) {
    return null;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center justify-center h-4 w-4 text-muted-foreground hover:text-foreground transition-colors"
          data-testid={`field-help-${fieldId}`}
        >
          <HelpCircle className="h-3.5 w-3.5" />
          <span className="sr-only">Help for {helpData.title}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-2">
          <h4 className="font-medium text-sm">{helpData.title}</h4>
          <p className="text-sm text-muted-foreground">{helpData.description}</p>
          {helpData.example && (
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                <span className="font-medium">Example: </span>
                {helpData.example}
              </p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
