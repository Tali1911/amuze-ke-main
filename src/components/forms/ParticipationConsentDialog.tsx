import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield, CheckCircle } from "lucide-react";
import { useClientAuth } from "@/hooks/useClientAuth";
import { clientProfileService } from "@/services/clientProfileService";

export type ParticipationVariant = "adult" | "child";

interface ParticipationConsentDialogProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  error?: string;
  variant?: ParticipationVariant;
  eventName?: string;
}

const AdultContent = () => (
  <div className="space-y-4 text-sm">
    <div>
      <p className="font-semibold text-lg">AMUSE KENYA – PARTICIPATION FORM</p>
      <p className="text-muted-foreground mt-1">For Adults</p>
      <p className="text-muted-foreground">Activities: Horse riding, rope course, biking & other outdoor activities</p>
    </div>

    <div>
      <h4 className="font-semibold text-base">We care about your safety.</h4>
      <p className="leading-relaxed mt-2">
        At Amuse Kenya, your well-being is our first concern. Before you take part in any activity, here's what we do for you:
      </p>
      <ul className="list-disc pl-6 space-y-1 mt-2">
        <li>We give you safety gear like helmets and body protection, and we show you how to use them properly.</li>
        <li>We have first aid kits ready at all times, and our staff are trained to help if something goes wrong.</li>
        <li>We regularly check our activity areas – whether it's the horse riding trail, the rope course, or the bike paths – to make sure everything is in good shape.</li>
        <li>Our team watches out for risks (like uneven ground, heat, or tiredness) and steps in to prevent accidents before they happen.</li>
        <li>We always start with a friendly, clear safety briefing so you know what to expect.</li>
      </ul>
    </div>

    <div>
      <h4 className="font-semibold text-base">Your part in staying safe.</h4>
      <p className="leading-relaxed mt-2">
        Outdoor activities are fun and healthy, but they come with natural physical challenges. Sometimes things don't go as planned – you might get a small scrape, a bruise, a bump, or in rare cases, something more significant like a sprain or a fall that needs medical attention. We want you to know the full picture without worry.
      </p>
      <p className="leading-relaxed mt-2">By joining us, you agree to:</p>
      <ul className="list-disc pl-6 space-y-1 mt-2">
        <li>Follow the instructions our staff give you.</li>
        <li>Wear all safety gear provided, for the whole activity.</li>
        <li>Tell a staff member right away if something feels unsafe or if you feel unwell.</li>
        <li>Take responsibility for your own choices – for example, not pushing beyond what feels comfortable for you.</li>
      </ul>
    </div>

    <div>
      <h4 className="font-semibold text-base">What we mean by "incidents" (big or small).</h4>
      <p className="leading-relaxed mt-2">
        We use the word "incident" to describe anything unplanned that causes harm – from a tiny scratch that needs a bandage, to a sprain, cut, bruise, or in very rare cases a fracture or head impact. No matter what happens, we promise to:
      </p>
      <ul className="list-disc pl-6 space-y-1 mt-2">
        <li>Stay calm and help you immediately.</li>
        <li>Provide first aid for every single incident, no matter how small.</li>
        <li>Call for emergency help if needed, and stay with you until you're safe.</li>
      </ul>
      <p className="leading-relaxed mt-2">
        We don't hide the fact that larger incidents are possible – but they are not common, especially when we work together. Most people leave with nothing more than happy memories and maybe a little dust on their clothes.
      </p>
    </div>

    <div className="border-t pt-4">
      <h4 className="font-semibold text-base">Your acknowledgment.</h4>
      <p className="leading-relaxed mt-2">
        I am joining these activities freely. I understand that Amuse Kenya takes good care of participants. I also understand that outdoor fun comes with a range of possible incidents – from small scratches to rare major injuries. I accept this reality without fear, knowing the team will do their best for me. I will not hold Amuse Kenya responsible for accidents that happen despite proper care.
      </p>
    </div>
  </div>
);

const ChildContent = () => (
  <div className="space-y-4 text-sm">
    <div>
      <p className="font-semibold text-lg">AMUSE KENYA – PARENT/GUARDIAN PERMISSION FORM</p>
      <p className="text-muted-foreground mt-1">For Children</p>
      <p className="text-muted-foreground">Activities: Horse riding, rope course, biking & other outdoor activities</p>
    </div>

    <div>
      <h4 className="font-semibold text-base">We care about your child's safety.</h4>
      <p className="leading-relaxed mt-2">
        At Amuse Kenya, we treat every child like our own. Before your child joins any activity, here's what we do:
      </p>
      <ul className="list-disc pl-6 space-y-1 mt-2">
        <li>We fit each child with safety gear – helmets, body protection – and make sure it's comfortable and worn correctly.</li>
        <li>We have first aid kits on site and staff trained to help gently and quickly.</li>
        <li>We check all activity areas regularly – horse zones, rope course, bike trails – so they stay safe and fun.</li>
        <li>Our team watches for risks like hot surfaces, rough ground, or tiredness, and we step in early to prevent trouble.</li>
        <li>Every child gets a simple, friendly safety talk before starting, in words they can understand.</li>
      </ul>
    </div>

    <div>
      <h4 className="font-semibold text-base">Your part as a parent.</h4>
      <p className="leading-relaxed mt-2">
        Kids are naturally adventurous. While playing outdoors, children can sometimes get small scratches, bruises, or bumps – that's part of active growing up. In very rare cases, a child might experience something more significant like a sprain, a deeper cut, or a fall that needs a doctor. We want you to know this honestly, without alarm.
      </p>
      <p className="leading-relaxed mt-2">We promise you: for every single incident, big or small:</p>
      <ul className="list-disc pl-6 space-y-1 mt-2">
        <li>We will comfort your child first.</li>
        <li>We will give first aid on the spot.</li>
        <li>We will call you immediately.</li>
        <li>If needed, we will take your child to medical care and stay until you arrive.</li>
      </ul>
      <p className="leading-relaxed mt-2">
        Most children leave with huge smiles, tired legs, and no injuries beyond a bit of dust.
      </p>
    </div>

    <div className="border-t pt-4">
      <h4 className="font-semibold text-base">Your permission.</h4>
      <p className="leading-relaxed mt-2">By consenting below, you agree that:</p>
      <ul className="list-disc pl-6 space-y-1 mt-2">
        <li>Your child will follow staff instructions.</li>
        <li>Your child will wear safety gear we provide.</li>
        <li>You understand we take every reasonable care, but small incidents (scratches, bumps) are normal in active play, and very rarely a larger incident (like a sprain or fracture) could occur.</li>
        <li>You trust us to handle any incident with kindness and speed.</li>
        <li>You will not hold Amuse Kenya responsible for accidents that happen despite our best care.</li>
      </ul>
      <p className="leading-relaxed mt-3 font-medium">
        I permit my child to take part. I trust Amuse Kenya to take good, careful, and kind care of my child.
      </p>
    </div>
  </div>
);

export const ParticipationConsentDialog = ({
  checked,
  onCheckedChange,
  error,
  variant = "child",
  eventName,
}: ParticipationConsentDialogProps) => {
  const [open, setOpen] = useState(false);
  const [hasRead, setHasRead] = useState(false);
  const { isSignedIn, profile, refreshProfile } = useClientAuth();

  // If signed-in user already gave consent, auto-check and mark as read
  useEffect(() => {
    if (isSignedIn && profile && (profile as any).participation_consent_given) {
      setHasRead(true);
      if (!checked) {
        onCheckedChange(true);
      }
    }
  }, [isSignedIn, profile]);

  const handleCheckChange = async (value: boolean) => {
    onCheckedChange(value);

    // Persist consent for signed-in users
    if (value && isSignedIn && profile) {
      try {
        await clientProfileService.updateProfile(profile.auth_user_id, {
          participation_consent_given: true,
          participation_consent_date: new Date().toISOString(),
        } as any);
        refreshProfile();
      } catch (err) {
        console.error('Failed to persist participation consent:', err);
      }
    }
  };

  const alreadyConsented = isSignedIn && profile && (profile as any).participation_consent_given;

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-primary mt-0.5 shrink-0" />
          <div className="flex-1 space-y-3">
            <div>
              <p className="text-sm font-semibold text-foreground">
                {variant === "adult"
                  ? "Participation Consent (Required)"
                  : "Parent/Guardian Permission (Required)"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {variant === "adult"
                  ? "Please read and accept the participation form before proceeding."
                  : "Please read and accept the parent/guardian permission form before proceeding."}
              </p>
            </div>

            {alreadyConsented ? (
              <div className="flex items-center gap-2 text-sm text-primary">
                <CheckCircle className="w-4 h-4" />
                <span className="font-medium">You've already consented — no need to re-read.</span>
              </div>
            ) : (
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-primary border-primary/30 hover:bg-primary/10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Read {variant === "adult" ? "Participation Form" : "Permission Form"}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh]">
                  <DialogHeader>
                    <DialogTitle>
                      {variant === "adult"
                        ? "Participation Consent Form"
                        : "Parent/Guardian Permission Form"}
                    </DialogTitle>
                    <DialogDescription>
                      {eventName
                        ? `Please read carefully before registering for ${eventName}`
                        : "Please read carefully before proceeding with registration"}
                    </DialogDescription>
                  </DialogHeader>
                  <ScrollArea className="h-[55vh] pr-4">
                    {variant === "adult" ? <AdultContent /> : <ChildContent />}
                  </ScrollArea>
                  <div className="flex justify-end pt-2">
                    <Button
                      onClick={() => {
                        setHasRead(true);
                        setOpen(false);
                      }}
                    >
                      I Have Read This Form
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}

            <div className="flex items-start space-x-3">
              <Checkbox
                id="participationConsent"
                checked={checked}
                onCheckedChange={(v) => handleCheckChange(v === true)}
                disabled={!hasRead && !alreadyConsented}
              />
              <label
                htmlFor="participationConsent"
                className={`text-sm leading-relaxed ${
                  !hasRead && !alreadyConsented
                    ? "text-muted-foreground/60 cursor-not-allowed"
                    : "text-foreground cursor-pointer"
                }`}
              >
                {variant === "adult"
                  ? "I have read and accept the participation consent form. I understand the nature of outdoor activities and accept the associated risks. *"
                  : "I have read and accept the parent/guardian permission form. I permit my child to take part and trust Amuse Kenya to provide proper care. *"}
              </label>
            </div>
          </div>
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
};
