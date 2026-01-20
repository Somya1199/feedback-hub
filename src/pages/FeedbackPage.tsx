import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Loader2, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { fetchSurveyQuestions, fetchManagementMapping, submitFeedback } from '@/services/sheetsApi';

interface Question {
  question_id: string;
  question_text: string;
  question_type: string;
  options: string[];
  category: string;
  required: boolean;
}

interface FeedbackTarget {
  email: string;
  name: string;
  process: string;
  role: string;
}

interface FeedbackTargets {
  [key: string]: FeedbackTarget[];
}

type FeedbackStep = 'loading' | 'select-target' | 'questions' | 'success';

const FeedbackPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState<FeedbackStep>('loading');
  const [targets, setTargets] = useState<FeedbackTargets>({});
  const [questions, setQuestions] = useState<Question[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [selectedRole, setSelectedRole] = useState('');
  const [selectedTarget, setSelectedTarget] = useState<FeedbackTarget | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadFeedbackData();
  }, []);
  const getCategoryForQuestion = (questionText: string): string => {
    const text = questionText.toLowerCase();

    if (text.includes('support') || text.includes('guidance') || text.includes('well-being') || text.includes('work-life')) {
      return 'Support & Approachability';
    } else if (text.includes('workload') || text.includes('task') || text.includes('deadline') || text.includes('capacity')) {
      return 'Workload & Task Management';
    } else if (text.includes('leadership') || text.includes('direction') || text.includes('decision') || text.includes('motivation')) {
      return 'Leadership & Direction';
    } else if (text.includes('feedback') || text.includes('performance') || text.includes('recognition') || text.includes('goal')) {
      return 'Feedback & Performance Management';
    } else if (text.includes('fair') || text.includes('respect') || text.includes('favoritism') || text.includes('inclusion')) {
      return 'Fairness & Respect';
    } else if (text.includes('team') || text.includes('culture') || text.includes('collaboration') || text.includes('trust')) {
      return 'Team Culture & Environment';
    } else if (text.includes('problem') || text.includes('roadblock') || text.includes('issue') || text.includes('analytical')) {
      return 'Problem-Solving & Decision Support';
    } else if (text.includes('accountability') || text.includes('responsibility') || text.includes('commitment') || text.includes('ownership')) {
      return 'Accountability';
    } else if (text.includes('overall') || text.includes('experience') || text.includes('satisfaction')) {
      return 'Overall Experience';
    }

    return 'General';
  };
  const transformQuestionsData = (data: any[]): Question[] => {
    if (!data || data.length === 0) {
      console.log('No data received from Google Sheets');
      return [];
    }

    console.log('📊 Processing questions from Google Sheets...');
    console.log('Total rows received:', data.length);

    // Debug: Show first 15 rows
    console.log('\nFirst 15 rows from API:');
    data.slice(0, 15).forEach((row, i) => {
      const value = row['Topic: Support & Approachability'] || row[Object.keys(row)[0]] || '';
      console.log(`Row ${i}: "${value}"`);
    });

    const questionsList: Question[] = [];
    let currentCategory = 'General';
    let questionCount = 0;

    // The key for the column (might vary)
    const columnKey = Object.keys(data[0] || {})[0] || 'Topic: Support & Approachability';
    console.log(`Using column key: "${columnKey}"`);

    // Process each row
    data.forEach((row, rowIndex) => {
      const cellValue = row[columnKey] || '';
      if (typeof cellValue !== 'string') return;

      const text = cellValue.trim();
      if (!text) return;

      // DEBUG: Log every row
      console.log(`[${rowIndex}] "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);

      // Check if this is a topic header
      if (text.toLowerCase().startsWith('topic:')) {
        currentCategory = text.replace('Topic:', '').trim();
        console.log(`  → Category set to: ${currentCategory}`);
        return;
      }

      // Skip rating options (they should be in separate columns, not rows)
      // But just in case they appear in your data
      if (text === 'Strongly disagree' ||
        text === 'disagree' ||
        text === 'neutral' ||
        text === 'agree' ||
        text === 'Strongly agree' ||
        text.toLowerCase().includes('strongly disagree') ||
        text.toLowerCase().includes('strongly agree')) {
        console.log(`  → Skipping rating option: ${text}`);
        return;
      }

      // Skip section headers and demographics
      if (text.toLowerCase().includes('about you') ||
        text.toLowerCase().includes('your role') ||
        text.toLowerCase().includes('overall rating') ||
        text.toLowerCase().includes('gender') ||
        text.toLowerCase().includes('tenure') ||
        text.toLowerCase().includes('designation') ||
        text.toLowerCase().includes('level') ||
        text.toLowerCase().includes('age') ||
        text.length < 5) {
        console.log(`  → Skipping header/demographic: ${text}`);
        return;
      }
      if (text.length >= 10 && !text.toLowerCase().startsWith('topic:')) {
        questionCount++;
        console.log(`  ✅ Question ${questionCount}: "${text}"`);
        console.log(`     Category: ${currentCategory}`);

        questionsList.push({
          question_id: `q${questionCount}`,
          question_text: text,
          question_type: 'rating',
          options: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'],
          category: currentCategory,
          required: true
        });
      }
    });

    console.log(`\n✅ Successfully extracted ${questionsList.length} questions`);

    // Show summary by category
    const categorySummary: Record<string, number> = {};
    questionsList.forEach(q => {
      categorySummary[q.category] = (categorySummary[q.category] || 0) + 1;
    });

    console.log('\n📋 Questions by category:');
    Object.entries(categorySummary).forEach(([category, count]) => {
      console.log(`  ${category}: ${count} questions`);
    });

    // Show first few questions
    console.log('\n📝 Sample questions:');
    questionsList.slice(0, 5).forEach((q, i) => {
      console.log(`${i + 1}. [${q.category}] ${q.question_text}`);
    });

    return questionsList;
  };
  const transformMappingData = (data: any[]): FeedbackTargets => {
    const targetsData: FeedbackTargets = {
      'POC': [],
      'Manager': [],
      'Account Manager': []
    };

    data.forEach((item) => {
      // For POC
      if (item.POC && item.POC.includes('@')) {
        targetsData['POC'].push({
          email: item.POC, // This should be the POC's email
          name: item.POC.split('@')[0]
            .replace('.', ' ')
            .replace(/\b\w/g, l => l.toUpperCase()),
          process: item.Process || 'General',
          role: 'POC'
        });
      }

      // For Manager
      if (item.Manager && item.Manager.includes('@')) {
        targetsData['Manager'].push({
          email: item.Manager, // This should be the Manager's email
          name: item.Manager.split('@')[0]
            .replace('.', ' ')
            .replace(/\b\w/g, l => l.toUpperCase()),
          process: item.Process || 'General',
          role: 'Manager'
        });
      }

      // For Account Manager
      if (item['Account manager'] && item['Account manager'].includes('@')) {
        targetsData['Account Manager'].push({
          email: item['Account manager'], // This should be the Account Manager's email
          name: item['Account manager'].split('@')[0]
            .replace('.', ' ')
            .replace(/\b\w/g, l => l.toUpperCase()),
          process: item.Process || 'General',
          role: 'Account Manager'
        });
      }
    });

    console.log('Transformed targets:', {
      POC: targetsData['POC'].map(t => ({ name: t.name, email: t.email })),
      Manager: targetsData['Manager'].map(t => ({ name: t.name, email: t.email })),
      AccountManager: targetsData['Account Manager'].map(t => ({ name: t.name, email: t.email }))
    });

    return targetsData;
  };

  const loadFeedbackData = async () => {
    setStep('loading');
    try {
      console.log('Starting data load...');

      // Test backend connection first
      const backendTest = await fetch('http://localhost:5000/api/health');
      if (!backendTest.ok) {
        throw new Error(`Backend not responding (status: ${backendTest.status})`);
      }
      console.log('Backend health check passed');

      const questionsResult = await fetchSurveyQuestions();
      console.log('Questions API result:', questionsResult);
      console.log('RAW QUESTIONS DATA FROM API:', {
        success: questionsResult.success,
        data: questionsResult.data,
        dataType: typeof questionsResult.data,
        dataLength: questionsResult.data?.length,
        firstFewRows: questionsResult.data?.slice(0, 5)
      });

      if (questionsResult.success && questionsResult.data) {
        const transformedQuestions = transformQuestionsData(questionsResult.data);
        console.log('Transformed questions:', transformedQuestions.length);
        console.log('Sample questions:', transformedQuestions.slice(0, 3));
        setQuestions(transformedQuestions);
      } else {
        console.error('Questions API error:', questionsResult.error);
        throw new Error(questionsResult.error || 'Failed to load questions');
      }

      // Load management data from Google Sheets
      const mappingResult = await fetchManagementMapping();
      console.log('Mapping result:', mappingResult);

      if (mappingResult.success && mappingResult.data) {
        const targetsData = transformMappingData(mappingResult.data);
        console.log('Transformed targets:', Object.keys(targetsData).map(k => `${k}: ${targetsData[k].length}`));
        setTargets(targetsData);
        setStep('select-target');
      } else {
        throw new Error(mappingResult.error || 'Failed to load management data');
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load feedback data');
      toast({
        title: 'Data Load Error',
        description: `Error: ${err instanceof Error ? err.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    }
  };

  const selectTarget = (role: string, target: FeedbackTarget) => {
    setSelectedRole(role);
    setSelectedTarget(target);
    setStep('questions');
  };

  const handleAnswer = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const getProgress = () => {
    if (questions.length === 0) return 0;
    return Math.round((Object.keys(answers).length / questions.length) * 100);
  };

  const canSubmit = () => {
    // Check if all questions are answered
    return questions.every(q =>
      answers[q.question_id] !== undefined && answers[q.question_id] !== ''
    ) && selectedTarget !== null;
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
      const feedbackData: Record<string, any> = {
        'Timestamp': new Date().toISOString(),
        'Encrypted Submitter ID': `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        'Role Reviewed': selectedRole,
        'Process': selectedTarget?.process || '',
        'Management Email ID': selectedTarget?.email || '', // This is the POC/Manager/Account Manager email
        'Additional Comments': comments
      };

      console.log('Submitting feedback with these details:', {
        managementEmail: selectedTarget?.email,
        managementName: selectedTarget?.name,
        role: selectedRole
      });

      // Add all question answers
      questions.forEach((q) => {
        const columnName = q.question_text;
        const answerValue = answers[q.question_id];
        const ratingValue = answerValue ? parseInt(answerValue) : '';
        feedbackData[columnName] = ratingValue;
      });

      console.log('Full submission data:', feedbackData);

      // Submit to Google Sheets
      const result = await submitFeedback(feedbackData);

      if (result.success) {
        setStep('success');
        toast({
          title: 'Success!',
          description: `Your feedback for ${selectedTarget?.name} has been submitted.`,
        });
      } else {
        throw new Error(result.error || 'Submission failed');
      }
    } catch (err) {
      console.error('Submission error:', err);
      toast({
        title: 'Submission Failed',
        description: err instanceof Error ? err.message : 'Please try again later.',
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
  const groupedQuestions = questions.reduce((acc: Record<string, Question[]>, q: Question) => {
    const category = q.category || 'General';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(q);
    return acc;
  }, {});

  console.log('📊 Grouped questions:', Object.keys(groupedQuestions).map(k => `${k}: ${groupedQuestions[k].length}`));

  // Loading state
  if (step === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-muted to-background flex items-center justify-center p-4">
        <div className="vox-card max-w-lg w-full p-12 text-center animate-fade-in">
          <Loader2 className="w-12 h-12 text-secondary animate-spin mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Loading Feedback Form</h2>
          {/* <p className="text-muted-foreground">Fetching questions from Google Sheets...</p> */}
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
          <div className="flex gap-4 justify-center">
            <Button onClick={loadFeedbackData} variant="default">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Button onClick={() => navigate('/')} variant="outline">
              Return Home
            </Button>
          </div>
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
            Your feedback has been saved to Google Sheets. Thank you for your valuable input.
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
            <p className="text-muted-foreground mb-8">
              Select a leader to provide feedback for
            </p>

            {Object.entries(targets).map(([role, roleTargets]) => (
              roleTargets.length > 0 && (
                <div key={role} className="mb-8">
                  <h3 className="text-lg font-semibold text-secondary mb-4 flex items-center gap-2">
                    {role === 'POC' ? '👤 Point of Contact' :
                      role === 'Manager' ? '👔 Manager' : '📊 Account Manager'}
                  </h3>

                  {roleTargets.map((target, index) => (
                    <div
                      key={`${target.email}-${index}`}
                      className="vox-target-card"
                    >
                      <div>
                        <h4 className="font-semibold text-foreground">
                          {target.name}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {target.process} • {target.email}
                        </p>
                      </div>

                      <Button
                        onClick={() => selectTarget(role, target)}
                        className="vox-btn-primary"
                      >
                        Select
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  ))}
                </div>
              )
            ))}

            {Object.values(targets).flat().length === 0 && (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No management data found in Google Sheets.</p>
                <Button onClick={loadFeedbackData} variant="outline" className="mt-4">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reload Data
                </Button>
              </div>
            )}
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
              Feedback for {selectedTarget?.name}
            </h2>
            <p className="text-muted-foreground">
              {selectedRole} • {selectedTarget?.process}
            </p>
            <p className="text-sm text-muted-foreground mt-1">{selectedTarget?.email}</p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>Progress</span>
              <span>{getProgress()}% Complete</span>
            </div>
            <Progress value={getProgress()} className="h-3" />
          </div>

          {/* Questions by Category */}
          {questions.length > 0 ? (
            Object.entries(groupedQuestions).map(([category, categoryQuestions]) => (
              <div key={category} className="mb-8">
                <h3 className="text-lg font-semibold text-secondary mb-4 pb-2 border-b border-border">
                  {category}
                </h3>

                {categoryQuestions.map((question, idx) => (
                  <div key={question.question_id} className="mb-6 p-4 bg-card rounded-lg border">
                    <p className="font-medium text-foreground mb-4">
                      {idx + 1}. {question.question_text}
                      <span className="text-red-500 ml-1">*</span>
                    </p>

                    <div className="flex gap-2 flex-wrap">
                      {question.options.map((option, optIdx) => (
                        <button
                          key={optIdx}
                          type="button"
                          onClick={() => handleAnswer(question.question_id, (optIdx + 1).toString())}
                          className={`px-4 py-2 rounded border ${answers[question.question_id] === (optIdx + 1).toString()
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background border-input hover:bg-accent'
                            }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No feedback questions loaded.</p>
              <Button onClick={loadFeedbackData} variant="outline" className="mt-4">
                <RefreshCw className="w-4 h-4 mr-2" />
                Reload Questions
              </Button>
            </div>
          )}

          {/* Comments Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-secondary mb-4">Additional Comments (Optional)</h3>
            <Textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Share any additional feedback or context..."
              className="w-full"
              rows={4}
            />
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
                  Submitting to Google Sheets...
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