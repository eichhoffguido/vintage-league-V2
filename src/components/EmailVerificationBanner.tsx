import { useState, useEffect } from "react";
import { X, Mail, AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const EmailVerificationBanner = () => {
  const { session, loading } = useAuth();
  const location = useLocation();
  const { toast } = useToast();
  const [dismissed, setDismissed] = useState(false);
  const [sending, setSending] = useState(false);

  const shouldShow =
    !loading &&
    session &&
    !session.user.email_confirmed_at &&
    location.pathname !== "/auth" &&
    location.pathname !== "/onboarding" &&
    !dismissed;

  useEffect(() => {
    setDismissed(false);
  }, [session?.user?.id]);

  const handleResendEmail = async () => {
    if (!session?.user?.email) return;
    setSending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: session.user.email,
      });
      if (error) {
        toast({
          variant: "destructive",
          title: "Fehler",
          description: "Die E-Mail konnte nicht erneut gesendet werden.",
        });
      } else {
        toast({
          title: "E-Mail gesendet",
          description: "Eine neue Bestätigungs-E-Mail wurde an deine Adresse gesendet.",
        });
      }
    } finally {
      setSending(false);
    }
  };

  if (!shouldShow) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-3">
      <div className="container mx-auto flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
        <p className="text-sm flex-1">
          Bitte bestätige deine E-Mail-Adresse. Wir haben dir eine E-Mail an{" "}
          <span className="font-semibold">{session?.user?.email}</span> geschickt.
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleResendEmail}
            disabled={sending}
            className="text-sm font-medium text-amber-800 hover:text-amber-950 flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <Mail className="h-4 w-4" />
            {sending ? "Senden..." : "E-Mail erneut senden"}
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="text-amber-600 hover:text-amber-800 transition-colors"
            aria-label="Banner schließen"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationBanner;
