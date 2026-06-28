import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type FeedbackRole = "INSTITUTE" | "EVALUATOR";

interface FeedbackFormProps {
  role: FeedbackRole;
  title: string;
  subtitle: string;
  accent?: "blue" | "amber" | "emerald";
  helperText?: string;
}

interface FeedbackFormState {
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  subject: string;
  message: string;
  rating: string;
}

const initialState: FeedbackFormState = {
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  subject: "",
  message: "",
  rating: "",
};

const accentMap: Record<NonNullable<FeedbackFormProps["accent"]>, string> = {
  blue: "from-blue-500/10 via-blue-500/5 to-transparent",
  amber: "from-amber-500/10 via-amber-500/5 to-transparent",
  emerald: "from-emerald-500/10 via-emerald-500/5 to-transparent",
};

export function FeedbackForm({ role, title, subtitle, helperText, accent = "blue" }: FeedbackFormProps) {
  const [formState, setFormState] = useState<FeedbackFormState>(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleChange = (field: keyof FeedbackFormState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await api.post("/api/feedback", {
        role,
        ...formState,
        rating: formState.rating ? Number(formState.rating) : undefined,
      });

      setFormState(initialState);
      toast({
        title: "Feedback submitted",
        description: "Thanks for helping us improve the portal experience.",
      });
    } catch (error: any) {
      toast({
        title: "Submission failed",
        description: error?.response?.data?.message || "Please try again after some time.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="shadow-lg border-primary/10">
      <CardHeader className="space-y-3">
        <Badge variant="outline" className="w-fit text-xs font-semibold tracking-wide">
          {role === "INSTITUTE" ? "Institute Portal" : "Evaluator Portal"}
        </Badge>
        <div>
          <CardTitle className="text-2xl font-semibold">{title}</CardTitle>
          <CardDescription className="text-base">{subtitle}</CardDescription>
        </div>
        {helperText && (
          <p className="text-sm text-muted-foreground bg-muted/40 rounded-md p-3">
            {helperText}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className={cn("rounded-lg border p-6 mb-8 bg-gradient-to-br", accentMap[accent])}>
          <p className="text-sm text-muted-foreground">
            Share clear, actionable feedback. Subject and message should summarise the issue, while contact
            details help the admin team get back to you if anything needs clarification.
          </p>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="contactName">Full Name*</Label>
              <Input
                id="contactName"
                name="contactName"
                placeholder="Enter your name"
                value={formState.contactName}
                onChange={(event) => handleChange("contactName", event.target.value)}
                required
                autoComplete="name"
              />
            </div>
            <div>
              <Label htmlFor="contactEmail">Email*</Label>
              <Input
                id="contactEmail"
                type="email"
                name="contactEmail"
                placeholder="you@example.com"
                value={formState.contactEmail}
                onChange={(event) => handleChange("contactEmail", event.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="contactPhone">Phone (optional)</Label>
              <Input
                id="contactPhone"
                name="contactPhone"
                placeholder="Provide a phone number if you'd like a call"
                value={formState.contactPhone}
                onChange={(event) => handleChange("contactPhone", event.target.value)}
                autoComplete="tel"
              />
            </div>
            <div>
              <Label htmlFor="rating">Portal Experience (1-5)</Label>
              <Input
                id="rating"
                name="rating"
                type="number"
                min={1}
                max={5}
                placeholder="Optional"
                value={formState.rating}
                onChange={(event) => handleChange("rating", event.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="subject">Subject*</Label>
            <Input
              id="subject"
              name="subject"
              placeholder="Summarise the issue or suggestion"
              value={formState.subject}
              onChange={(event) => handleChange("subject", event.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="message">Message*</Label>
            <Textarea
              id="message"
              name="message"
              placeholder="Include relevant context, steps to reproduce, or desired improvements"
              value={formState.message}
              onChange={(event) => handleChange("message", event.target.value)}
              className="min-h-[160px]"
              required
            />
          </div>
          <div className="flex items-center justify-end gap-3">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Send Feedback"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
