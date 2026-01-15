import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Question, FeedbackTarget, FeedbackTargets, Demographics } from '@/types/feedback';
import { mockFeedbackData } from '@/lib/mockData';

type FeedbackStep = 'loading' | 'select-target' | 'questions' | 'success';

const FeedbackPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [step, setStep] = useState<FeedbackStep>('loading');
  const [targets, setTargets] = useState<FeedbackTargets | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [demographics, setDemographics] = useState<Demographics>({});
  const [error, setError] = useState<string | null>(null);
  
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedTarget, setSelectedTarget] = useState<FeedbackTarget | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadFeedbackData();
  }, []);

  const loadFeedbackData = async () => {
    setStep('loading');
    try {
      // In production, this would call the edge function
      // For now, use mock data
      await new Promise(resolve => setTimeout(resolve, 800));
      
      if (mockFeedbackData.error) {
        setError(mockFeedbackData.error);
      } else {
        setTargets(mockFeedbackData.targets);
        setQuestions(mockFeedbackData.questions);
        setDemographics(mockFeedbackData.demographics);
        setStep('select-target');
      }
    } catch (err) {
      setError('Failed to load feedback data. Please try again.');
    }
  };

  const selectTarget = (role: string, target: FeedbackTarget) => {
    setSelectedRole(role);
    setSelectedTarget(target);
    setStep('questions');
  };

  const handleAnswer = (questionText: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionText]: value }));
  };

  const getProgress = () => {
    if (questions.length === 0) return 0;
    return Math.round((Object.keys(answers).length / questions.length) * 100);
  };

  const canSubmit = () => {
    return Object.keys(answers).length === questions.length;
  };

  const handleSubmit = async () => {
    if (!canSubmit() || !selectedTarget) {
      toast({
        title: 'Incomplete Form',
        description: 'Please answer all questions before submitting.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // In production, this would call the edge function
      await new Promise(resolve => setTimeout(resolve, 1500));
      setStep('success');
      toast({
        title: 'Success!',
        description: 'Your feedback has been submitted anonymously.',
      });
    } catch (err) {
      toast({
        title: 'Submission Failed',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetAndGiveMore = () => {
    setAnswers({});
    setComments('');
    setSelectedRole('');
    setSelectedTarget(null);
    setStep('select-target');
  };

  // Group questions by topic
  const groupedQuestions = questions.reduce((acc, q) => {
    const topic = q.topic.replace('Topic:', '').trim();
    if (!acc[topic]) acc[topic] = [];
    acc[topic].push(q);
    return acc;
  }, {} as Record<string, Question[]>);

  if (step === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-muted to-background flex items-center justify-center p-4">
        <div className="vox-card max-w-lg w-full p-12 text-center animate-fade-in">
          <Loader2 className="w-12 h-12 text-secondary animate-spin mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Loading Your Team</h2>
          <p className="text-muted-foreground">Please wait while we fetch your leadership targets...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-muted to-background flex items-center justify-center p-4">
        <div className="vox-card max-w-lg w-full p-12 text-center animate-fade-in">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Error Loading Data</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={() => navigate('/')} variant="outline">
            Return Home
          </Button>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-muted to-background flex items-center justify-center p-4">
        <div className="vox-card max-w-lg w-full p-12 text-center animate-fade-in">
          <div className="w-24 h-24 mx-auto mb-6 bg-success/10 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-12 h-12 text-success" />
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-4">Feedback Submitted!</h2>
          <p className="text-muted-foreground mb-8">
            Thank you for your valuable input. Your anonymous feedback helps improve our leadership.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={resetAndGiveMore} className="vox-btn-primary">
              Give More Feedback
            </Button>
            <Button onClick={() => navigate('/')} variant="outline">
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'select-target') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-muted to-background py-8 px-4">
        <div className="vox-card max-w-3xl mx-auto animate-fade-in">
          <div className="p-8 md:p-12">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="mb-6 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>

            <h2 className="text-3xl font-bold text-foreground mb-2">Leadership Feedback</h2>
            <p className="text-muted-foreground mb-8">Select a leader to provide feedback for</p>

            {targets && Object.entries(targets).map(([role, roleTargets]) => (
              roleTargets.length > 0 && (
                <div key={role} className="mb-8">
                  <h3 className="text-lg font-semibold text-secondary mb-4 flex items-center gap-2">
                    {role === 'POC' ? '👤 Point of Contact' : 
                     role === 'Manager' ? '👔 Manager' : '📊 Account Manager'}
                  </h3>
                  
                  {roleTargets.map((target) => (
                    <div
                      key={target.email}
                      className="vox-target-card"
                    >
                      <div>
                        <h4 className="font-semibold text-foreground">
                          {target.email.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </h4>
                        <p className="text-sm text-muted-foreground">{target.process}</p>
                      </div>
                      
                      {target.status === 'BLOCKED' ? (
                        <span className="px-4 py-2 bg-muted text-muted-foreground rounded-lg text-sm font-medium border border-dashed">
                          Already Reviewed
                        </span>
                      ) : (
                        <Button
                          onClick={() => selectTarget(role, target)}
                          className="vox-btn-primary"
                        >
                          Select
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted to-background py-8 px-4">
      <div className="vox-card max-w-3xl mx-auto animate-fade-in">
        <div className="p-8 md:p-12">
          <Button
            variant="ghost"
            onClick={() => setStep('select-target')}
            className="mb-6 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Change Selection
          </Button>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">
              Feedback for {selectedTarget?.email.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </h2>
            <p className="text-muted-foreground">
              {selectedRole} • {selectedTarget?.process}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>Progress</span>
              <span>{getProgress()}% Complete</span>
            </div>
            <Progress value={getProgress()} className="h-3" />
          </div>

          {/* Questions by Topic */}
          {Object.entries(groupedQuestions).map(([topic, topicQuestions]) => (
            <div key={topic} className="mb-8">
              <h3 className="text-lg font-semibold text-secondary mb-4 pb-2 border-b border-border">
                {topic}
              </h3>
              
              {topicQuestions.map((question, idx) => (
                <div key={question.id} className="vox-question">
                  <p className="font-medium text-foreground mb-4">
                    {idx + 1}. {question.text}
                  </p>
                  
                  <div className="vox-rating-group">
                    {question.options.map((option, optIdx) => (
                      <label key={option} className="vox-rating-option">
                        <input
                          type="radio"
                          name={question.id}
                          value={String(optIdx + 1)}
                          checked={answers[question.text] === String(optIdx + 1)}
                          onChange={() => handleAnswer(question.text, String(optIdx + 1))}
                          className="vox-rating-input sr-only"
                        />
                        <span className={`vox-rating-label ${
                          answers[question.text] === String(optIdx + 1) 
                            ? 'border-secondary bg-secondary text-white' 
                            : optIdx === 0 
                              ? 'border-destructive/50 text-destructive' 
                              : optIdx === question.options.length - 1 
                                ? 'border-success/50 text-success'
                                : 'border-muted text-muted-foreground'
                        }`}>
                          {option.length > 12 ? option.substring(0, 10) + '...' : option}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}

          {/* Comments Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-secondary mb-4 pb-2 border-b border-border">
              Additional Comments (Optional)
            </h3>
            <Textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Share any additional feedback or context..."
              className="vox-textarea"
              rows={4}
            />
            <p className="text-sm text-muted-foreground mt-2">
              Your comments will be processed by AI to ensure anonymity.
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit() || isSubmitting}
              className="vox-btn-primary flex-1"
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Feedback'
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setStep('select-target')}
              className="flex-1"
              size="lg"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackPage;
