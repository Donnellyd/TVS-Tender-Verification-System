import { useEffect, useState } from "react";
import { X, ChevronRight, ChevronLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface TourStep {
  id: string;
  title: string;
  description: string;
  target?: string;
}

const tourSteps: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to VeritasAI!",
    description: "Let's take a quick tour of the platform to help you get started with AI-powered bid evaluation.",
  },
  {
    id: "dashboard",
    title: "Your Dashboard",
    description: "This is your command center. Monitor pending evaluations, compliance alerts, and key metrics at a glance.",
    target: "[data-testid='nav-dashboard']",
  },
  {
    id: "vendors",
    title: "Vendor Management",
    description: "Add and manage vendors, upload their compliance documents, and track their status automatically.",
    target: "[data-testid='nav-vendors']",
  },
  {
    id: "tenders",
    title: "Tender Management",
    description: "Create tenders, upload requirements, and let AI evaluate bid submissions against your compliance rules.",
    target: "[data-testid='nav-tenders']",
  },
  {
    id: "documents",
    title: "AI Document Processing",
    description: "Upload documents and our AI will automatically extract information, verify validity, and detect potential fraud.",
    target: "[data-testid='nav-documents']",
  },
  {
    id: "help",
    title: "Get Help Anytime",
    description: "Click the Help button on any page or press Ctrl+K to search for help. We're here to support you!",
    target: "[data-testid='button-help']",
  },
];

const TOUR_STORAGE_KEY = "veritasai-tour-completed";

export function GuidedTour() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const tourCompleted = localStorage.getItem(TOUR_STORAGE_KEY);
    if (!tourCompleted) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleComplete = () => {
    localStorage.setItem(TOUR_STORAGE_KEY, "true");
    setIsVisible(false);
  };

  const handleSkip = () => {
    localStorage.setItem(TOUR_STORAGE_KEY, "true");
    setIsVisible(false);
  };

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleRestart = () => {
    localStorage.removeItem(TOUR_STORAGE_KEY);
    setCurrentStep(0);
    setIsVisible(true);
  };

  if (!isVisible) {
    return null;
  }

  const step = tourSteps[currentStep];

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={handleSkip} />
      <Card className="fixed bottom-4 right-4 w-80 z-50 shadow-xl animate-in slide-in-from-bottom-5">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">{step.title}</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleSkip}
              data-testid="button-tour-skip"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pb-3">
          <p className="text-sm text-muted-foreground">{step.description}</p>
          <div className="flex items-center gap-1 mt-3">
            {tourSteps.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 rounded-full transition-all ${
                  index === currentStep
                    ? "w-4 bg-primary"
                    : index < currentStep
                    ? "w-1.5 bg-primary/50"
                    : "w-1.5 bg-muted"
                }`}
              />
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between pt-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrevious}
            disabled={currentStep === 0}
            data-testid="button-tour-previous"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <div className="text-xs text-muted-foreground">
            {currentStep + 1} of {tourSteps.length}
          </div>
          <Button
            size="sm"
            onClick={handleNext}
            data-testid="button-tour-next"
          >
            {currentStep === tourSteps.length - 1 ? "Finish" : "Next"}
            {currentStep < tourSteps.length - 1 && <ChevronRight className="h-4 w-4 ml-1" />}
          </Button>
        </CardFooter>
      </Card>
    </>
  );
}

export function RestartTourButton() {
  const handleRestart = () => {
    localStorage.removeItem(TOUR_STORAGE_KEY);
    window.location.reload();
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRestart}
      data-testid="button-restart-tour"
    >
      <Sparkles className="h-4 w-4 mr-2" />
      Restart Tour
    </Button>
  );
}
