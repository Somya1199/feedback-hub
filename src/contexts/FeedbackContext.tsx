import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Question, FeedbackTarget, Demographics, FeedbackSubmission } from '@/types/feedback';

interface FeedbackState {
  // Current step in the feedback flow
  currentStep: 'landing' | 'select-target' | 'questions' | 'success';
  
  // Selected target info
  selectedRole: string;
  selectedTarget: FeedbackTarget | null;
  
  // Questions and answers
  questions: Question[];
  answers: Record<string, string>;
  comments: string;
  
  // User demographics
  demographics: Demographics;
  
  // Loading states
  isLoading: boolean;
  error: string | null;
}

interface FeedbackContextType extends FeedbackState {
  setCurrentStep: (step: FeedbackState['currentStep']) => void;
  setSelectedRole: (role: string) => void;
  setSelectedTarget: (target: FeedbackTarget | null) => void;
  setQuestions: (questions: Question[]) => void;
  setAnswer: (questionText: string, answer: string) => void;
  setComments: (comments: string) => void;
  setDemographics: (demographics: Demographics) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  resetFeedback: () => void;
  getProgress: () => number;
  canSubmit: () => boolean;
}

const initialState: FeedbackState = {
  currentStep: 'landing',
  selectedRole: '',
  selectedTarget: null,
  questions: [],
  answers: {},
  comments: '',
  demographics: {},
  isLoading: false,
  error: null,
};

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined);

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<FeedbackState>(initialState);

  const setCurrentStep = (step: FeedbackState['currentStep']) => {
    setState(prev => ({ ...prev, currentStep: step }));
  };

  const setSelectedRole = (role: string) => {
    setState(prev => ({ ...prev, selectedRole: role }));
  };

  const setSelectedTarget = (target: FeedbackTarget | null) => {
    setState(prev => ({ ...prev, selectedTarget: target }));
  };

  const setQuestions = (questions: Question[]) => {
    setState(prev => ({ ...prev, questions }));
  };

  const setAnswer = (questionText: string, answer: string) => {
    setState(prev => ({
      ...prev,
      answers: { ...prev.answers, [questionText]: answer },
    }));
  };

  const setComments = (comments: string) => {
    setState(prev => ({ ...prev, comments }));
  };

  const setDemographics = (demographics: Demographics) => {
    setState(prev => ({ ...prev, demographics }));
  };

  const setIsLoading = (isLoading: boolean) => {
    setState(prev => ({ ...prev, isLoading }));
  };

  const setError = (error: string | null) => {
    setState(prev => ({ ...prev, error }));
  };

  const resetFeedback = () => {
    setState({
      ...initialState,
      questions: state.questions,
      demographics: state.demographics,
    });
  };

  const getProgress = () => {
    if (state.questions.length === 0) return 0;
    const answeredCount = Object.keys(state.answers).length;
    return Math.round((answeredCount / state.questions.length) * 100);
  };

  const canSubmit = () => {
    return Object.keys(state.answers).length === state.questions.length;
  };

  return (
    <FeedbackContext.Provider
      value={{
        ...state,
        setCurrentStep,
        setSelectedRole,
        setSelectedTarget,
        setQuestions,
        setAnswer,
        setComments,
        setDemographics,
        setIsLoading,
        setError,
        resetFeedback,
        getProgress,
        canSubmit,
      }}
    >
      {children}
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const context = useContext(FeedbackContext);
  if (context === undefined) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }
  return context;
}
