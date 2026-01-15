export interface Question {
  id: string;
  text: string;
  topic: string;
  options: string[];
}

export interface FeedbackTarget {
  email: string;
  status: 'ALLOWED' | 'BLOCKED';
  process: string;
}

export interface FeedbackTargets {
  POC: FeedbackTarget[];
  Manager: FeedbackTarget[];
  'Account manager': FeedbackTarget[];
}

export interface Demographics {
  Gender?: string;
  Tenure?: number | string;
  'Designation/Level'?: string;
  Age?: string;
  Rating?: string;
  'Gender of the user'?: string;
}

export interface FeedbackData {
  targets: FeedbackTargets | null;
  questions: Question[];
  demographics: Demographics;
  error?: string;
}

export interface FeedbackSubmission {
  role: string;
  target: string;
  process: string;
  targetGender: string;
  submitterGender: string;
  submitterTenure: string;
  submitterDesignation: string;
  submitterAge: string;
  submitterRating: string;
  answers: Record<string, string>;
  comments: string;
}

export interface AdminStats {
  totalResponses: number;
  totalEmployees: number;
  uniqueSubmitters: number;
  recentLogs: FeedbackLog[];
  monthlyData: { counts: Record<string, number>; max: number };
  quarterlyData: { Q1: number; Q2: number; Q3: number; Q4: number };
  leaderAnalytics: LeaderAnalytic[];
  genderAnalysis: Record<string, DemographicBreakdown>;
  tenureAnalysis: Record<string, DemographicBreakdown>;
  levelAnalysis: Record<string, DemographicBreakdown>;
  commentAnalysis: Record<string, { withComment: number; total: number }>;
  questionMetrics: QuestionMetric[];
  leaderMeanScores: LeaderMeanScore[];
  attritionIndicators: AttritionData;
}

export interface FeedbackLog {
  date: string;
  role: string;
  process: string;
  target: string;
  details: { question: string; response: string }[];
  comments: string;
}

export interface LeaderAnalytic {
  name: string;
  saCount: number;
  sdCount: number;
}

export interface DemographicBreakdown {
  SA: number;
  A: number;
  N: number;
  D: number;
  SD: number;
  total: number;
}

export interface QuestionMetric {
  question: string;
  meanScore: number;
  stdDev: number;
  count: number;
}

export interface LeaderMeanScore {
  name: string;
  meanScore: number;
  totalAnswers: number;
}

export interface AttritionData {
  globalRiskScore: number;
  riskBuckets: { low: number; medium: number; high: number };
  leaders: AttritionLeader[];
}

export interface AttritionLeader {
  name: string;
  sdCount: number;
  saCount: number;
  riskScore: number;
  bucket: 'Low' | 'Medium' | 'High';
}

export interface LeaderDetails {
  responsesByQuestion: Record<string, Record<string, number>>;
  totalResponses: number;
  derivedInsights: {
    leadershipIndex: number;
    topStrengths: TopicScore[];
    topImprovements: TopicScore[];
    topicBreakdown: TopicScore[];
    sentiment: Record<string, number>;
    themes: Record<string, number>;
    commentSentiment: { positive: number; negative: number; neutral: number };
  };
}

export interface TopicScore {
  topic: string;
  averageScore: number;
  responseCount: number;
}
