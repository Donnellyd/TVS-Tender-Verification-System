import { HelpCircle, Book, Lightbulb, MessageCircleQuestion, Rocket } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { helpContent } from "@/lib/helpContent";

interface HelpManualProps {
  moduleId: string;
  trigger?: React.ReactNode;
}

export function HelpManual({ moduleId, trigger }: HelpManualProps) {
  const content = helpContent[moduleId] || helpContent.dashboard;

  return (
    <Sheet>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" data-testid="button-help">
            <HelpCircle className="h-4 w-4 mr-2" />
            Help
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Book className="h-5 w-5 text-primary" />
            {content.title}
          </SheetTitle>
          <p className="text-sm text-muted-foreground">{content.description}</p>
        </SheetHeader>
        
        <Tabs defaultValue="guide" className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="guide" data-testid="tab-guide">
              <Book className="h-4 w-4 mr-1" />
              Guide
            </TabsTrigger>
            <TabsTrigger value="quickstart" data-testid="tab-quickstart">
              <Rocket className="h-4 w-4 mr-1" />
              Quick Start
            </TabsTrigger>
            <TabsTrigger value="faq" data-testid="tab-faq">
              <MessageCircleQuestion className="h-4 w-4 mr-1" />
              FAQ
            </TabsTrigger>
            <TabsTrigger value="tips" data-testid="tab-tips">
              <Lightbulb className="h-4 w-4 mr-1" />
              Tips
            </TabsTrigger>
          </TabsList>
          
          <ScrollArea className="h-[calc(100vh-220px)] mt-4 pr-4">
            <TabsContent value="guide" className="mt-0">
              <div className="space-y-4">
                {content.sections.map((section, index) => (
                  <div key={index} className="space-y-2">
                    <h3 className="font-semibold text-sm">{section.title}</h3>
                    <p className="text-sm text-muted-foreground">{section.content}</p>
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="quickstart" className="mt-0">
              <div className="space-y-3">
                {content.quickStart.map((step) => (
                  <div key={step.step} className="flex gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="flex-shrink-0 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                      {step.step}
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">{step.title}</h4>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="faq" className="mt-0">
              <Accordion type="single" collapsible className="w-full">
                {content.faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`faq-${index}`}>
                    <AccordionTrigger className="text-left text-sm">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </TabsContent>
            
            <TabsContent value="tips" className="mt-0">
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">Best Practices</h3>
                <ul className="space-y-2">
                  {content.bestPractices.map((tip, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <Lightbulb className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{tip}</span>
                    </li>
                  ))}
                </ul>
                
                {content.relatedModules && content.relatedModules.length > 0 && (
                  <div className="mt-6 pt-4 border-t">
                    <h3 className="font-semibold text-sm mb-2">Related Modules</h3>
                    <div className="flex flex-wrap gap-2">
                      {content.relatedModules.map((module) => (
                        <Badge key={module} variant="secondary" className="capitalize">
                          {module.replace("-", " ")}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
