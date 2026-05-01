import { useState } from "react";
import { AlertCircle, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const EmailVerificationBanner = () => {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Don't show banner if user is not logged in, email is verified, or banner is dismissed
  if (!user || user.email_confirmed_at || dismissed) {
    return null;
  }

  const handleResendEmail = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: user.email!,
      });

      if (error) throw error;
      toast.success("Verifizierungs-E-Mail erneut gesendet! Bitte überprüfen Sie Ihren Posteingang.");
    } catch (error: any) {
      toast.error(error.message || "Fehler beim Erneut senden der E-Mail");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-background border-b border-border">
      <div className="container mx-auto px-4 py-3">
        <Alert variant="default" className="border-amber-200/50 bg-amber-50/50 dark:border-amber-900/30 dark:bg-amber-950/20">
          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
          <div className="flex items-center justify-between gap-4 ml-3">
            <AlertDescription className="text-sm text-amber-800 dark:text-amber-200">
              Bitte bestätigen Sie Ihre E-Mail-Adresse, um Ihr Konto vollständig zu aktivieren.
            </AlertDescription>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleResendEmail}
                disabled={isLoading}
                className="text-amber-700 hover:text-amber-900 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-900/40"
              >
                {isLoading ? "Wird gesendet..." : "Erneut senden"}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setDismissed(true)}
                className="h-6 w-6 text-amber-700 hover:text-amber-900 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-900/40"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Alert>
      </div>
    </div>
  );
};

export default EmailVerificationBanner;
