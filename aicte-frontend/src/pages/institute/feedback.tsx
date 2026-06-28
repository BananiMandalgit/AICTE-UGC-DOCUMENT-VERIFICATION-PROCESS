import { FeedbackForm } from "@/components/feedback/FeedbackForm";
import { Separator } from "@/components/ui/separator";

const InstituteFeedbackPage = () => {
  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <p className="text-sm uppercase tracking-widest text-primary/70">Feedback Loop</p>
        <h1 className="text-3xl font-semibold">Tell us how we can improve the institute workspace</h1>
        <p className="text-muted-foreground max-w-3xl">
          Share blockers, enhancement ideas, or glitches you notice while submitting applications. The AICTE
          admin team sees every entry inside their dashboard, so please provide enough context to help them act
          on it quickly.
        </p>
      </section>
      <Separator />
      <FeedbackForm
        role="INSTITUTE"
        title="Institute Portal Feedback"
        subtitle="This form takes less than two minutes and goes directly to the AICTE admin reviewers."
        helperText="Minimum required fields are marked with *. Adding a phone number and rating helps the support team prioritise follow ups."
        accent="blue"
      />
    </div>
  );
};

export default InstituteFeedbackPage;
