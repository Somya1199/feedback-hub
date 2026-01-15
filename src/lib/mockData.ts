import { FeedbackData, AdminStats, LeaderDetails } from '@/types/feedback';

export const ADMIN_EMAILS = [
  'somy@google.com',
  'srath@google.com',
  'jeelanishaiq@google.com',
  'admin@example.com' // For testing
];

export const mockFeedbackData: FeedbackData = {
  targets: {
    POC: [
      { email: 'john.doe@company.com', status: 'ALLOWED', process: 'Sales' },
      { email: 'jane.smith@company.com', status: 'BLOCKED', process: 'Marketing' },
    ],
    Manager: [
      { email: 'mike.wilson@company.com', status: 'ALLOWED', process: 'Engineering' },
    ],
    'Account manager': [
      { email: 'sarah.jones@company.com', status: 'ALLOWED', process: 'Support' },
    ],
  },
  questions: [
    {
      id: 'q-0',
      text: 'My leader communicates goals and expectations clearly.',
      topic: 'Topic: Communication',
      options: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'],
    },
    {
      id: 'q-1',
      text: 'My leader provides constructive feedback regularly.',
      topic: 'Topic: Communication',
      options: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'],
    },
    {
      id: 'q-2',
      text: 'My leader empowers team members to make decisions.',
      topic: 'Topic: Empowerment',
      options: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'],
    },
    {
      id: 'q-3',
      text: 'My leader recognizes and appreciates good work.',
      topic: 'Topic: Recognition',
      options: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'],
    },
    {
      id: 'q-4',
      text: 'My leader handles conflicts fairly and professionally.',
      topic: 'Topic: Conflict Resolution',
      options: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'],
    },
    {
      id: 'q-5',
      text: 'My leader supports my professional development.',
      topic: 'Topic: Growth',
      options: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'],
    },
  ],
  demographics: {
    Gender: 'Male',
    Tenure: 3,
    'Designation/Level': 'Senior',
    Age: '30-40',
    Rating: '4',
    'Gender of the user': 'Male',
  },
};

export const mockAdminStats: AdminStats = {
  totalResponses: 156,
  totalEmployees: 245,
  uniqueSubmitters: 89,
  recentLogs: [
    {
      date: '2024-01-15 10:30:00',
      role: 'Manager',
      process: 'Engineering',
      target: 'mike.wilson@company.com',
      details: [
        { question: 'Communication', response: 'Agree' },
        { question: 'Empowerment', response: 'Strongly Agree' },
      ],
      comments: 'Great leader overall.',
    },
    {
      date: '2024-01-14 14:22:00',
      role: 'POC',
      process: 'Sales',
      target: 'john.doe@company.com',
      details: [
        { question: 'Communication', response: 'Neutral' },
        { question: 'Recognition', response: 'Disagree' },
      ],
      comments: '',
    },
  ],
  monthlyData: {
    counts: {
      '2024-01': 45,
      '2024-02': 32,
      '2024-03': 28,
      '2024-04': 51,
    },
    max: 51,
  },
  quarterlyData: { Q1: 105, Q2: 35, Q3: 12, Q4: 4 },
  leaderAnalytics: [
    { name: 'mike.wilson@company.com', saCount: 45, sdCount: 5 },
    { name: 'john.doe@company.com', saCount: 32, sdCount: 12 },
    { name: 'sarah.jones@company.com', saCount: 28, sdCount: 8 },
  ],
  genderAnalysis: {
    Male: { SA: 120, A: 85, N: 40, D: 25, SD: 10, total: 280 },
    Female: { SA: 95, A: 70, N: 35, D: 20, SD: 8, total: 228 },
    Unknown: { SA: 15, A: 10, N: 5, D: 3, SD: 2, total: 35 },
  },
  tenureAnalysis: {
    '0-1 Year': { SA: 30, A: 25, N: 15, D: 10, SD: 5, total: 85 },
    '1-3 Years': { SA: 65, A: 50, N: 25, D: 15, SD: 8, total: 163 },
    '3-5 Years': { SA: 85, A: 55, N: 20, D: 12, SD: 4, total: 176 },
    '5+ Years': { SA: 50, A: 35, N: 20, D: 11, SD: 3, total: 119 },
  },
  levelAnalysis: {
    Junior: { SA: 45, A: 35, N: 20, D: 12, SD: 5, total: 117 },
    Senior: { SA: 85, A: 60, N: 25, D: 15, SD: 6, total: 191 },
    Lead: { SA: 65, A: 45, N: 18, D: 10, SD: 4, total: 142 },
    Manager: { SA: 35, A: 25, N: 17, D: 11, SD: 5, total: 93 },
  },
  commentAnalysis: {
    '1': { withComment: 8, total: 10 },
    '2': { withComment: 15, total: 25 },
    '3': { withComment: 20, total: 45 },
    '4': { withComment: 25, total: 50 },
    '5': { withComment: 12, total: 26 },
  },
  questionMetrics: [
    { question: 'Communication clarity', meanScore: 78, stdDev: 12.5, count: 156 },
    { question: 'Feedback quality', meanScore: 72, stdDev: 15.2, count: 156 },
    { question: 'Empowerment', meanScore: 81, stdDev: 10.8, count: 156 },
    { question: 'Recognition', meanScore: 69, stdDev: 18.3, count: 156 },
  ],
  leaderMeanScores: [
    { name: 'mike.wilson@company.com', meanScore: 82, totalAnswers: 280 },
    { name: 'sarah.jones@company.com', meanScore: 76, totalAnswers: 195 },
    { name: 'john.doe@company.com', meanScore: 68, totalAnswers: 240 },
  ],
  attritionIndicators: {
    globalRiskScore: 42,
    riskBuckets: { low: 50, medium: 30, high: 20 },
    leaders: [
      { name: 'john.doe@company.com', sdCount: 12, saCount: 32, riskScore: 28, bucket: 'Medium' },
      { name: 'problem.leader@company.com', sdCount: 25, saCount: 8, riskScore: 117, bucket: 'High' },
      { name: 'mike.wilson@company.com', sdCount: 5, saCount: 45, riskScore: -20, bucket: 'Low' },
    ],
  },
};

export const mockLeaderDetails: LeaderDetails = {
  responsesByQuestion: {
    'Communication clarity': { 'Strongly Disagree': 2, 'Disagree': 5, 'Neutral': 12, 'Agree': 25, 'Strongly Agree': 18, total: 62 },
    'Feedback quality': { 'Strongly Disagree': 3, 'Disagree': 8, 'Neutral': 15, 'Agree': 22, 'Strongly Agree': 14, total: 62 },
  },
  totalResponses: 62,
  derivedInsights: {
    leadershipIndex: 74,
    topStrengths: [
      { topic: 'Empowerment', averageScore: 4.2, responseCount: 62 },
      { topic: 'Recognition', averageScore: 3.9, responseCount: 62 },
    ],
    topImprovements: [
      { topic: 'Conflict Resolution', averageScore: 3.1, responseCount: 62 },
      { topic: 'Communication', averageScore: 3.4, responseCount: 62 },
    ],
    topicBreakdown: [
      { topic: 'Communication', averageScore: 3.4, responseCount: 62 },
      { topic: 'Empowerment', averageScore: 4.2, responseCount: 62 },
      { topic: 'Recognition', averageScore: 3.9, responseCount: 62 },
      { topic: 'Conflict Resolution', averageScore: 3.1, responseCount: 62 },
      { topic: 'Growth', averageScore: 3.7, responseCount: 62 },
    ],
    sentiment: {
      Communication: 3.4,
      Empowerment: 4.2,
      Recognition: 3.9,
      'Conflict Resolution': 3.1,
      Growth: 3.7,
    },
    themes: { Delegation: 8, Proactivity: 15, Feedback: 10, Vision: 5 },
    commentSentiment: { positive: 55, negative: 20, neutral: 25 },
  },
};
