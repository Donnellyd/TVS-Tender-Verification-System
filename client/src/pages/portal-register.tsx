import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Shield, Building2, Phone } from "lucide-react";
import logoImage from "@/assets/logo.png";

const registerSchema = z.object({
  companyName: z.string().min(2, "Company name must be at least 2 characters"),
  registrationNumber: z.string().min(1, "Registration number is required"),
  contactPerson: z.string().min(2, "Contact person name is required"),
  contactEmail: z.string().email("Invalid email address"),
  contactPhone: z.string().min(10, "Phone number must be at least 10 digits"),
  whatsappPhone: z.string().min(10, "WhatsApp number is required"),
  countryCode: z.string().default("+27"),
  country: z.string().default("ZA"),
});

const loginSchema = z.object({
  whatsappPhone: z.string().min(10, "WhatsApp number is required"),
  countryCode: z.string().default("+27"),
});

type RegisterFormData = z.infer<typeof registerSchema>;
type LoginFormData = z.infer<typeof loginSchema>;

const countryCodes = [
  { code: "+27", label: "South Africa (+27)" },
  { code: "+234", label: "Nigeria (+234)" },
  { code: "+254", label: "Kenya (+254)" },
  { code: "+233", label: "Ghana (+233)" },
  { code: "+255", label: "Tanzania (+255)" },
  { code: "+256", label: "Uganda (+256)" },
  { code: "+263", label: "Zimbabwe (+263)" },
  { code: "+267", label: "Botswana (+267)" },
  { code: "+260", label: "Zambia (+260)" },
  { code: "+258", label: "Mozambique (+258)" },
  { code: "+20", label: "Egypt (+20)" },
  { code: "+212", label: "Morocco (+212)" },
  { code: "+971", label: "UAE (+971)" },
  { code: "+966", label: "Saudi Arabia (+966)" },
  { code: "+1", label: "USA (+1)" },
  { code: "+44", label: "UK (+44)" },
];

const countries = [
  { code: "ZA", label: "South Africa" },
  { code: "NG", label: "Nigeria" },
  { code: "KE", label: "Kenya" },
  { code: "GH", label: "Ghana" },
  { code: "TZ", label: "Tanzania" },
  { code: "UG", label: "Uganda" },
  { code: "ZW", label: "Zimbabwe" },
  { code: "BW", label: "Botswana" },
  { code: "ZM", label: "Zambia" },
  { code: "MZ", label: "Mozambique" },
  { code: "EG", label: "Egypt" },
  { code: "MA", label: "Morocco" },
  { code: "AE", label: "UAE" },
  { code: "SA", label: "Saudi Arabia" },
];

export default function PortalRegister() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("register");

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      companyName: "",
      registrationNumber: "",
      contactPerson: "",
      contactEmail: "",
      contactPhone: "",
      whatsappPhone: "",
      countryCode: "+27",
      country: "ZA",
    },
  });

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      whatsappPhone: "",
      countryCode: "+27",
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormData) => {
      const fullPhone = data.countryCode + data.whatsappPhone.replace(/^0+/, "");
      const res = await fetch("/api/portal/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          whatsappPhone: fullPhone,
          contactPhone: data.countryCode + data.contactPhone.replace(/^0+/, ""),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Registration failed");
      }
      return { ...(await res.json()), fullPhone };
    },
    onSuccess: async (data) => {
      toast({ title: "Registration Successful", description: "Sending verification code..." });
      try {
        await fetch("/api/portal/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ whatsappPhone: data.fullPhone }),
        });
      } catch {}
      setLocation(`/portal/verify?phone=${encodeURIComponent(data.fullPhone)}`);
    },
    onError: (error: Error) => {
      toast({ title: "Registration Failed", description: error.message, variant: "destructive" });
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      const fullPhone = data.countryCode + data.whatsappPhone.replace(/^0+/, "");
      const res = await fetch("/api/portal/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ whatsappPhone: fullPhone }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to send OTP");
      }
      return { fullPhone };
    },
    onSuccess: (data) => {
      toast({ title: "OTP Sent", description: "Check your WhatsApp for the verification code." });
      setLocation(`/portal/verify?phone=${encodeURIComponent(data.fullPhone)}`);
    },
    onError: (error: Error) => {
      toast({ title: "Login Failed", description: error.message, variant: "destructive" });
    },
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <img src={logoImage} alt="VeritasAI" className="h-12 w-12 rounded-lg" />
              <span className="text-2xl font-bold text-foreground">VeritasAI</span>
            </div>
            <div className="flex items-center justify-center gap-2 mb-3">
              <Shield className="h-5 w-5 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">Vendor Portal</h1>
            </div>
            <p className="text-muted-foreground">
              Submit quotes and tenders online. Track your submissions in real-time.
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="register" data-testid="tab-register">
                    <Building2 className="h-4 w-4 mr-2" />
                    Register
                  </TabsTrigger>
                  <TabsTrigger value="login" data-testid="tab-login">
                    <Phone className="h-4 w-4 mr-2" />
                    Login
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="register">
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit((data) => registerMutation.mutate(data))} className="space-y-4">
                      <FormField
                        control={registerForm.control}
                        name="companyName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Acme Pty Ltd" {...field} data-testid="input-company-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="registrationNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Registration Number</FormLabel>
                            <FormControl>
                              <Input placeholder="2024/123456/07" {...field} data-testid="input-registration-number" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="contactPerson"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contact Person</FormLabel>
                            <FormControl>
                              <Input placeholder="John Doe" {...field} data-testid="input-contact-person" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="contactEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="john@acme.co.za" {...field} data-testid="input-email" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="contactPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input placeholder="821234567" {...field} data-testid="input-phone" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-[120px_1fr] gap-2">
                        <FormField
                          control={registerForm.control}
                          name="countryCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Code</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-country-code">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {countryCodes.map((cc) => (
                                    <SelectItem key={cc.code} value={cc.code}>{cc.code}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={registerForm.control}
                          name="whatsappPhone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>WhatsApp Number</FormLabel>
                              <FormControl>
                                <Input placeholder="821234567" {...field} data-testid="input-whatsapp" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={registerForm.control}
                        name="country"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Country</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-country">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {countries.map((c) => (
                                  <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        className="w-full"
                        disabled={registerMutation.isPending}
                        data-testid="button-register"
                      >
                        {registerMutation.isPending ? "Registering..." : "Register & Verify"}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>

                <TabsContent value="login">
                  <CardHeader className="px-0 pt-0">
                    <CardTitle className="text-lg">Welcome Back</CardTitle>
                    <CardDescription>
                      Enter your WhatsApp number to receive a login code.
                    </CardDescription>
                  </CardHeader>
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit((data) => loginMutation.mutate(data))} className="space-y-4">
                      <div className="grid grid-cols-[120px_1fr] gap-2">
                        <FormField
                          control={loginForm.control}
                          name="countryCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Code</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="login-select-country-code">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {countryCodes.map((cc) => (
                                    <SelectItem key={cc.code} value={cc.code}>{cc.code}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={loginForm.control}
                          name="whatsappPhone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>WhatsApp Number</FormLabel>
                              <FormControl>
                                <Input placeholder="821234567" {...field} data-testid="login-input-whatsapp" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <Button
                        type="submit"
                        className="w-full"
                        disabled={loginMutation.isPending}
                        data-testid="button-send-otp"
                      >
                        {loginMutation.isPending ? "Sending OTP..." : "Send OTP"}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Powered by VeritasAI | Support: support@zd-solutions.com
          </p>
        </div>
      </div>
    </div>
  );
}
