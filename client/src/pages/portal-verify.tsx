import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { setPortalToken } from "@/lib/portalApi";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import logoImage from "@/assets/logo.png";

function maskPhone(phone: string): string {
  if (phone.length < 6) return phone;
  const start = phone.slice(0, 3);
  const end = phone.slice(-4);
  const middle = phone.slice(3, -4).replace(/./g, "*");
  return `${start} ${middle.match(/.{1,3}/g)?.join(" ") || middle} ${end}`;
}

export default function PortalVerify() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [otpCode, setOtpCode] = useState("");
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const params = new URLSearchParams(window.location.search);
  const phone = params.get("phone") || "";

  useEffect(() => {
    if (!phone) {
      setLocation("/portal");
    }
  }, [phone, setLocation]);

  useEffect(() => {
    if (resendTimer > 0) {
      const interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [resendTimer]);

  const verifyMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/portal/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ whatsappPhone: phone, otpCode }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Verification failed");
      }
      return res.json();
    },
    onSuccess: (data) => {
      setPortalToken(data.portalToken);
      toast({ title: "Verified", description: "Welcome to the Vendor Portal!" });
      setLocation("/portal/dashboard");
    },
    onError: (error: Error) => {
      toast({ title: "Verification Failed", description: error.message, variant: "destructive" });
    },
  });

  const resendMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/portal/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ whatsappPhone: phone }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to resend OTP");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "OTP Resent", description: "Check your WhatsApp for the new code." });
      setResendTimer(60);
      setCanResend(false);
    },
    onError: (error: Error) => {
      toast({ title: "Resend Failed", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) {
      toast({ title: "Invalid Code", description: "Please enter the 6-digit code.", variant: "destructive" });
      return;
    }
    verifyMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img src={logoImage} alt="VeritasAI" className="h-12 w-12 rounded-lg" />
            <span className="text-2xl font-bold text-foreground">VeritasAI</span>
          </div>
        </div>

        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Verification Code Sent</CardTitle>
            <CardDescription>
              We've sent a 6-digit code to your WhatsApp
            </CardDescription>
            <p className="text-sm font-mono text-foreground mt-2" data-testid="text-masked-phone">
              {maskPhone(phone)}
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">Verification Code</Label>
                <Input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="text-center text-2xl tracking-[0.5em] font-mono"
                  data-testid="input-otp"
                  autoFocus
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={verifyMutation.isPending || otpCode.length !== 6}
                data-testid="button-verify"
              >
                {verifyMutation.isPending ? "Verifying..." : "Verify"}
              </Button>

              <div className="text-center space-y-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={!canResend || resendMutation.isPending}
                  onClick={() => resendMutation.mutate()}
                  data-testid="button-resend"
                >
                  {canResend
                    ? resendMutation.isPending
                      ? "Resending..."
                      : "Resend Code"
                    : `Resend in ${resendTimer}s`}
                </Button>

                <div>
                  <Link href="/portal">
                    <Button variant="link" size="sm" className="gap-1" data-testid="link-back-register">
                      <ArrowLeft className="h-3 w-3" />
                      Back to Registration
                    </Button>
                  </Link>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
