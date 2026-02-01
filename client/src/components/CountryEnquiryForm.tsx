import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Mail, Building2, User, Phone, Users, CheckCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const enquirySchema = z.object({
  companyName: z.string().min(2, "Company name is required"),
  contactName: z.string().min(2, "Contact name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  organizationType: z.string().optional(),
  expectedUsers: z.coerce.number().optional(),
  interestedTier: z.string().optional(),
  message: z.string().optional(),
});

type EnquiryFormData = z.infer<typeof enquirySchema>;

interface CountryEnquiryFormProps {
  countryCode: string;
  countryName: string;
  onSuccess?: () => void;
}

export function CountryEnquiryForm({ countryCode, countryName, onSuccess }: CountryEnquiryFormProps) {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<EnquiryFormData>({
    resolver: zodResolver(enquirySchema),
    defaultValues: {
      companyName: "",
      contactName: "",
      email: "",
      phone: "",
      organizationType: "",
      interestedTier: "",
      message: "",
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: EnquiryFormData) => {
      return await apiRequest("/api/country-enquiries", {
        method: "POST",
        body: JSON.stringify({
          ...data,
          countryCode,
        }),
      });
    },
    onSuccess: () => {
      setSubmitted(true);
      toast({ title: "Enquiry submitted successfully! We'll be in touch soon." });
      onSuccess?.();
    },
    onError: () => {
      toast({ title: "Failed to submit enquiry. Please try again.", variant: "destructive" });
    },
  });

  const onSubmit = (data: EnquiryFormData) => {
    submitMutation.mutate(data);
  };

  if (submitted) {
    return (
      <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold">Thank You for Your Interest!</h3>
              <p className="text-muted-foreground mt-2">
                We've received your enquiry and will contact you shortly to discuss VeritasAI for {countryName}.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Request Pricing for {countryName}
        </CardTitle>
        <CardDescription>
          VeritasAI is coming soon to {countryName}. Submit your details and we'll contact you when we launch in your region.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Company Name *
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Your company name" {...field} data-testid="input-company-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contactName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Contact Name *
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Your name" {...field} data-testid="input-contact-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email Address *
                    </FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="your@email.com" {...field} data-testid="input-email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Phone Number
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="+27 123 456 7890" {...field} data-testid="input-phone" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="organizationType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-org-type">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="government">Government / Public Sector</SelectItem>
                        <SelectItem value="enterprise">Enterprise / Large Corporate</SelectItem>
                        <SelectItem value="sme">SME / Medium Business</SelectItem>
                        <SelectItem value="startup">Startup</SelectItem>
                        <SelectItem value="ngo">NGO / Non-Profit</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="expectedUsers"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Expected Users
                    </FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g. 10" {...field} data-testid="input-expected-users" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="interestedTier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Interested Tier</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-tier">
                        <SelectValue placeholder="Select a tier" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="starter">Starter</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                      <SelectItem value="government">Government / Custom</SelectItem>
                      <SelectItem value="not_sure">Not Sure Yet</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell us about your procurement needs..."
                      className="min-h-[100px]"
                      {...field}
                      data-testid="textarea-message"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full"
              disabled={submitMutation.isPending}
              data-testid="button-submit-enquiry"
            >
              {submitMutation.isPending ? "Submitting..." : "Submit Enquiry"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
