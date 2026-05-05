import { ShieldCheck, Gem } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { formatEuros } from "@/utils/currency";

interface JerseyDetailSheetProps {
  jersey: {
    id?: string;
    name: string;
    team: string;
    league: string;
    year: string;
    price_cents: number;
    lowestAsk?: number;
    highestBid?: number;
    imageUrl: string;
    verified?: boolean;
    condition: 1 | 2 | 3 | 4 | 5;
    size: string;
    estimatedValue?: number;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const conditionLabels: Record<number, string> = {
  5: "Neuwertig",
  4: "Sehr gut",
  3: "Gut erhalten",
  2: "Gebraucht",
  1: "Sammlerstück",
};

const getVintageBonus = (year: string): number => {
  if (!year || year.trim() === "") return 1.0;
  const yearNum = parseInt(year, 10);
  if (Number.isNaN(yearNum)) return 1.0;
  const age = new Date().getFullYear() - yearNum;
  if (age >= 25) return 1.8;
  if (age >= 15) return 1.4;
  if (age >= 5) return 1.1;
  return 1.0;
};

const JerseyDetailSheet = ({ jersey, open, onOpenChange }: JerseyDetailSheetProps) => {
  if (!jersey && !open) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg md:max-w-2xl lg:max-w-3xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-display text-xl">Trikot Details</SheetTitle>
        </SheetHeader>

        {!jersey ? (
          <div className="mt-6 text-center text-muted-foreground">Kein Trikot ausgewählt</div>
        ) : (
          <JerseyDetails jersey={jersey} onClose={() => onOpenChange(false)} />
        )}
      </SheetContent>
    </Sheet>
  );
};

const JerseyDetails = ({ jersey, onClose }: { jersey: NonNullable<JerseyDetailSheetProps['jersey']>; onClose: () => void }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const vintageBonus = getVintageBonus(jersey.year);

  const handleTauschVorschlagen = () => {
    if (!user) {
      navigate("/auth");
    } else {
      const params = new URLSearchParams();
      if (jersey.id) {
        params.append("jersey", jersey.id);
      }
      navigate(`/trade${params.toString() ? `?${params.toString()}` : ""}`);
    }
  };

  const handleViewFullPage = () => {
    if (jersey.id) {
      navigate(`/jersey/${jersey.id}`);
      onClose();
    }
  };

  return (
    <div className="mt-6 space-y-6">
      {/* Image */}
      <div className="relative aspect-square overflow-hidden rounded-sm bg-secondary">
        <img
          src={jersey.imageUrl}
          alt={`${jersey.team} ${jersey.name}`}
          className="h-full w-full object-cover"
        />
        {jersey.verified && (
          <div className="absolute left-3 top-3 flex items-center gap-1 rounded-sm bg-primary px-2 py-1">
            <ShieldCheck className="h-3 w-3 text-primary-foreground" />
            <span className="font-display text-[10px] font-bold uppercase tracking-wider text-primary-foreground">Zertifiziert</span>
          </div>
        )}
        <Badge variant="secondary" className="absolute right-3 top-3 rounded-sm font-display text-[10px] uppercase tracking-wider">
          {jersey.size}
        </Badge>
        {vintageBonus > 1.0 && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-sm bg-background/90 border border-primary/30 px-2 py-1 backdrop-blur-sm">
            <Gem className="h-3 w-3 text-primary" />
            <span className="font-display text-[10px] font-bold uppercase tracking-wider text-primary">
              {vintageBonus >= 1.8 ? "Klassiker" : vintageBonus >= 1.4 ? "Retro" : "Vintage"}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div>
        <p className="text-xs font-medium text-muted-foreground">{jersey.league} · {jersey.year}</p>
        <h2 className="mt-1 font-display text-2xl font-semibold">{jersey.team}</h2>
        <p className="text-base text-muted-foreground">{jersey.name}</p>
      </div>

      {/* Price */}
      <div className="rounded-sm border border-border bg-secondary/50 p-4">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Preis</p>
            <p className="font-display text-3xl font-bold text-foreground">{jersey.price_cents != null ? formatEuros(jersey.price_cents) : '–'}</p>
          </div>
          <Badge variant="outline" className="text-xs font-bold w-fit">
            {conditionLabels[jersey.condition]}
          </Badge>
        </div>

        {(jersey.lowestAsk !== undefined || jersey.highestBid !== undefined) && (
          <div className="mt-4 grid grid-cols-2 gap-4 border-t border-border pt-4">
            {jersey.lowestAsk !== undefined && (
              <div>
                <p className="text-xs text-muted-foreground">Niedrigstes Angebot</p>
                <p className="text-sm font-semibold">{jersey.lowestAsk !== null ? formatEuros(jersey.lowestAsk) : '–'}</p>
              </div>
            )}
            {jersey.highestBid !== undefined && (
              <div>
                <p className="text-xs text-muted-foreground">Höchstes Gebot</p>
                <p className="text-sm font-semibold text-primary">{jersey.highestBid !== null ? formatEuros(jersey.highestBid) : '–'}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Details */}
      <div className="space-y-3 rounded-sm border border-border p-4">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wider">Details</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground">Zustand</p>
            <p className="font-medium">{conditionLabels[jersey.condition]} ({jersey.condition}/5)</p>
          </div>
          <div>
            <p className="text-muted-foreground">Größe</p>
            <p className="font-medium">{jersey.size}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Jahr</p>
            <p className="font-medium">{jersey.year}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Liga</p>
            <p className="font-medium">{jersey.league}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Alter</p>
            <p className="font-medium">{(() => {
              const yearNum = parseInt(jersey.year, 10);
              return Number.isNaN(yearNum) ? '—' : new Date().getFullYear() - yearNum;
            })()} Jahre</p>
          </div>
          <div>
            <p className="text-muted-foreground">Vintage Faktor</p>
            <p className="font-medium">{vintageBonus}x</p>
          </div>
        </div>
      </div>

      {/* Verification Status */}
      <div className="rounded-sm border border-border p-4">
        <div className="flex items-center gap-2">
          {jersey.verified ? (
            <>
              <ShieldCheck className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-semibold">Verifiziert</p>
                <p className="text-xs text-muted-foreground">Dieses Trikot wurde von unserem Team geprüft</p>
              </div>
            </>
          ) : (
            <>
              <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
              <div>
                <p className="text-sm font-semibold">Nicht verifiziert</p>
                <p className="text-xs text-muted-foreground">Dieses Trikot wurde noch nicht geprüft</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Full Page View Button */}
      {jersey.id && (
        <Button
          variant="outline"
          className="w-full"
          onClick={handleViewFullPage}
        >
          Vollständige Ansicht
        </Button>
      )}

      {/* Tausch vorschlagen Button */}
      <Button
        variant="default"
        className="w-full"
        onClick={handleTauschVorschlagen}
      >
        Tausch vorschlagen
      </Button>
    </div>
  );
};

export default JerseyDetailSheet;
