import { ArrowLeft, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FeedbackForm } from "@/components/feedback/FeedbackForm";

const EvaluatorFeedbackPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex flex-col gap-4">
          <Button
            variant="ghost"
            className="w-fit px-0 text-muted-foreground"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to dashboard
          </Button>
          <div className="bg-white border shadow-sm rounded-xl p-6 space-y-3">
            <div className="inline-flex items-center gap-2 text-primary">
              <MessageCircle className="w-5 h-5" />
              <span className="uppercase tracking-widest text-xs font-semibold">Evaluator feedback</span>
            </div>
            <h1 className="text-3xl font-semibold">Log product gaps while reviewing documents</h1>
            <p className="text-muted-foreground">
              Capture UX issues, missing tools, or smart enhancements you need inside the evaluator workspace. The
              admin group triages these submissions alongside institute feedback to plan releases.
            </p>
          </div>
        </div>
        <FeedbackForm
          role="EVALUATOR"
          title="Evaluator Workspace Feedback"
          subtitle="Help us shape reviewer tooling so you can clear document queues faster."
          helperText="Subject, message, and contact details are mandatory. Phone and rating remain optional but give the admin context on urgency."
          accent="emerald"
        />
      </div>
    </div>
  );
};

export default EvaluatorFeedbackPage;
