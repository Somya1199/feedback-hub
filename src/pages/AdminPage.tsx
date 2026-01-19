import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, BarChart3, FileText, Mail, LogOut, Users, TrendingUp, AlertTriangle, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { fetchFeedbackResponses, type FeedbackResponse } from '@/services/sheetsApi';
import SheetsDataTable from '@/components/SheetsDataTable';

type AdminTab = 'home' | 'analytics' | 'logs' | 'reminders' | 'sheets';

const AdminPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<AdminTab>('sheets');
  const [responses, setResponses] = useState<FeedbackResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    uniqueSubmitters: 0,
    totalResponses: 0,
    totalEmployees: 100,
    leaderMeanScores: [] as Array<{ name: string; meanScore: number; totalAnswers: number }>,
    recentLogs: [] as Array<{ date: string; role: string; process: string; target: string }>,
    quarterlyData: {
      'Q1': 0,
      'Q2': 0,
      'Q3': 0,
      'Q4': 0
    }
  });

  // Analytics state
  const [selectedLeader, setSelectedLeader] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    if (activeTab === 'sheets' || activeTab === 'analytics') {
      loadResponsesData();
    }
  }, [activeTab]);

  // Reset to page 1 when items per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const loadResponsesData = async () => {
    setLoading(true);
    try {
      const result = await fetchFeedbackResponses();
      if (result.success && result.data) {
        setResponses(result.data);
        calculateStats(result.data);
        toast({
          title: 'Data Loaded',
          description: `Fetched ${result.data.length} responses from Google Sheets`,
        });
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to load data',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error loading responses:', error);
      toast({
        title: 'Error',
        description: 'Failed to connect to backend',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const emailToName = (email: string) => {
    if (!email || !email.includes('@')) return email;
    
    const namePart = email.split('@')[0];
    return namePart
      .split(/[._]/)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  };

  const calculateStats = (data: FeedbackResponse[]) => {
    if (!data || data.length === 0) return;

    // Calculate unique submitters
    const uniqueEmails = new Set(
      data.filter(r => r['Encrypted Submitter ID']).map(r => r['Encrypted Submitter ID'] as string)
    );

    // Calculate leader scores
    const leaderScores = new Map<string, { total: number; count: number }>();
    
    data.forEach(response => {
      const managerEmail = response['Management Email ID'];
      const rating = parseFloat(response['Rating'] as string);
      
      if (managerEmail && !isNaN(rating)) {
        if (!leaderScores.has(managerEmail)) {
          leaderScores.set(managerEmail, { total: 0, count: 0 });
        }
        const current = leaderScores.get(managerEmail)!;
        leaderScores.set(managerEmail, {
          total: current.total + rating,
          count: current.count + 1
        });
      }
    });

    const leaderMeanScores = Array.from(leaderScores.entries())
      .map(([email, score]) => ({
        name: email,
        meanScore: Math.round((score.total / score.count) * 10) / 10,
        totalAnswers: score.count
      }))
      .sort((a, b) => b.meanScore - a.meanScore)
      .slice(0, 10);

    // Calculate quarterly data
    const quarterlyData = calculateQuarterlyData(data);

    // Get recent logs (last 10 responses)
    const recentLogs = data.slice(0, 10).map(response => ({
      date: response.Timestamp ? new Date(response.Timestamp as string).toLocaleDateString() : 'Unknown',
      role: response['Role Reviewed'] as string || 'Unknown',
      process: response.Process as string || 'Unknown',
      target: (response['Management Email ID'] as string)?.split('@')[0] || 'Unknown'
    }));

    setStats({
      uniqueSubmitters: uniqueEmails.size,
      totalResponses: data.length,
      totalEmployees: 150,
      leaderMeanScores,
      recentLogs,
      quarterlyData
    });
  };

  const calculateQuarterlyData = (responses: any[]) => {
    const quarterlyData = {
      Q1: 0,
      Q2: 0,
      Q3: 0,
      Q4: 0,
      Unknown: 0
    };
    
    responses.forEach(response => {
      const quarter = getQuarterFromDate(response.Timestamp || response.Date || '');
      if (quarterlyData.hasOwnProperty(quarter)) {
        quarterlyData[quarter as keyof typeof quarterlyData]++;
      } else {
        quarterlyData.Unknown++;
      }
    });
    
    return quarterlyData;
  };

  const getQuarterFromDate = (dateString: string): string => {
    if (!dateString || dateString.trim() === '') {
      return 'Unknown';
    }
    
    try {
      let date: Date;
      
      if (dateString.includes('/')) {
        const datePart = dateString.split(' ')[0];
        const [month, day, year] = datePart.split('/').map(part => parseInt(part, 10));
        
        if (isNaN(month) || isNaN(day) || isNaN(year)) {
          return 'Unknown';
        }
        
        date = new Date(year, month - 1, day);
      } else {
        date = new Date(dateString);
      }
      
      if (isNaN(date.getTime())) {
        return 'Unknown';
      }
      
      const month = date.getMonth() + 1;
      
      if (month >= 1 && month <= 3) return 'Q1';
      if (month >= 4 && month <= 6) return 'Q2';
      if (month >= 7 && month <= 9) return 'Q3';
      if (month >= 10 && month <= 12) return 'Q4';
      
      return 'Unknown';
    } catch (error) {
      console.error('Error parsing date for quarter:', dateString, error);
      return 'Unknown';
    }
  };

  const participationRate = stats.totalEmployees > 0 
    ? Math.round((stats.uniqueSubmitters / stats.totalEmployees) * 100) 
    : 0;

  const refreshAnalytics = () => {
    loadResponsesData();
    toast({
      title: 'Analytics Refreshed',
      description: 'Analytics data has been updated',
    });
  };

  // Analytics calculation functions
  const getUniqueLeaders = () => {
    const leaderAnalytics = calculateLeaderAnalyticsByPerson();
    return leaderAnalytics.map(leader => ({
      email: leader.email,
      name: leader.name,
      feedbackCount: leader.feedbackCount
    }));
  };

  const calculateLeaderAnalyticsByPerson = () => {
    const leaderMap = new Map<string, {
      email: string,
      name: string,
      feedbacks: any[],
      uniqueRespondents: Set<string>
    }>();
    
    responses.forEach(response => {
      const managerEmail = response['Management Email ID'];
      
      if (managerEmail && typeof managerEmail === 'string' && managerEmail.includes('@')) {
        const email = managerEmail.trim().toLowerCase();
        const name = emailToName(email);
        const submitterHash = response['Encrypted Submitter ID'];
        
        if (!leaderMap.has(email)) {
          leaderMap.set(email, {
            email,
            name,
            feedbacks: [],
            uniqueRespondents: new Set()
          });
        }
        
        const leader = leaderMap.get(email)!;
        leader.feedbacks.push(response);
        
        if (submitterHash && typeof submitterHash === 'string') {
          leader.uniqueRespondents.add(submitterHash);
        }
      }
    });
    
    return Array.from(leaderMap.values()).map(leader => {
      let totalRating = 0;
      let ratingCount = 0;
      
      let sdCount = 0, dCount = 0, nCount = 0, aCount = 0, saCount = 0;
      let totalQuestionResponses = 0;
      
      leader.feedbacks.forEach(feedback => {
        const rating = parseFloat(feedback['Rating'] as string);
        if (!isNaN(rating)) {
          totalRating += rating;
          ratingCount++;
        }
        
        let feedbackSd = 0, feedbackD = 0, feedbackN = 0, feedbackA = 0, feedbackSa = 0;
        let feedbackQuestionCount = 0;
        
        Object.values(feedback).forEach(val => {
          if (typeof val === 'string') {
            switch(val) {
              case 'Strongly Disagree': 
                feedbackSd++;
                feedbackQuestionCount++;
                break;
              case 'Disagree': 
                feedbackD++;
                feedbackQuestionCount++;
                break;
              case 'Neutral': 
                feedbackN++;
                feedbackQuestionCount++;
                break;
              case 'Agree': 
                feedbackA++;
                feedbackQuestionCount++;
                break;
              case 'Strongly Agree': 
                feedbackSa++;
                feedbackQuestionCount++;
                break;
            }
          }
        });
        
        sdCount += feedbackSd;
        dCount += feedbackD;
        nCount += feedbackN;
        aCount += feedbackA;
        saCount += feedbackSa;
        totalQuestionResponses += feedbackQuestionCount;
      });
      
      const avgScore = ratingCount > 0 ? totalRating / ratingCount : 0;
      const totalResponses = sdCount + dCount + nCount + aCount + saCount;
      
      const saPercent = totalResponses > 0 ? (saCount / totalResponses) * 100 : 0;
      const aPercent = totalResponses > 0 ? (aCount / totalResponses) * 100 : 0;
      const nPercent = totalResponses > 0 ? (nCount / totalResponses) * 100 : 0;
      const dPercent = totalResponses > 0 ? (dCount / totalResponses) * 100 : 0;
      const sdPercent = totalResponses > 0 ? (sdCount / totalResponses) * 100 : 0;
      
      const riskScore = Math.max(0, sdCount * 3 - saCount);
      let riskLevel = 'Low';
      if (sdPercent > 30 || sdCount > 10) riskLevel = 'High';
      else if (sdPercent > 15 || sdCount > 5) riskLevel = 'Medium';
      
      return {
        email: leader.email,
        name: leader.name,
        feedbackCount: leader.feedbacks.length,
        uniqueRespondents: leader.uniqueRespondents.size,
        avgScore: parseFloat(avgScore.toFixed(2)),
        saCount,
        aCount,
        nCount,
        dCount,
        sdCount,
        totalQuestionResponses,
        saPercent: parseFloat(saPercent.toFixed(1)),
        aPercent: parseFloat(aPercent.toFixed(1)),
        nPercent: parseFloat(nPercent.toFixed(1)),
        dPercent: parseFloat(dPercent.toFixed(1)),
        sdPercent: parseFloat(sdPercent.toFixed(1)),
        riskScore,
        riskLevel
      };
    }).sort((a, b) => b.feedbackCount - a.feedbackCount);
  };

  const calculateQuestionMetrics = () => {
    const questionMap = new Map();
    
    responses.forEach(response => {
      Object.entries(response).forEach(([key, value]) => {
        if (typeof value === 'string' && 
            ['Strongly Agree', 'Agree', 'Neutral', 'Disagree', 'Strongly Disagree'].includes(value)) {
          if (!questionMap.has(key)) {
            questionMap.set(key, {
              question: key,
              scores: [],
              sum: 0,
              sumSq: 0,
              count: 0
            });
          }
          
          const question = questionMap.get(key);
          const score = convertResponseToScore(value);
          question.scores.push(score);
          question.sum += score;
          question.sumSq += score * score;
          question.count++;
        }
      });
    });
    
    return Array.from(questionMap.values()).map(q => {
      const mean = q.count > 0 ? q.sum / q.count : 0;
      const variance = q.count > 0 ? (q.sumSq / q.count) - (mean * mean) : 0;
      const stdDev = Math.sqrt(Math.max(0, variance));
      
      return {
        question: q.question,
        meanScore: parseFloat(mean.toFixed(2)),
        stdDev: parseFloat(stdDev.toFixed(2)),
        count: q.count
      };
    }).sort((a, b) => b.meanScore - a.meanScore);
  };

  const convertResponseToScore = (response: string): number => {
    switch(response) {
      case 'Strongly Disagree': return 1;
      case 'Disagree': return 2;
      case 'Neutral': return 3;
      case 'Agree': return 4;
      case 'Strongly Agree': return 5;
      default: return 3;
    }
  };

  const calculateGenderAnalysisByPerson = () => {
    const genderMap = new Map<string, {
      peopleCount: number,
      totalQuestions: number,
      totalScore: number,
      sdCount: number,
      dCount: number,
      nCount: number,
      aCount: number,
      saCount: number
    }>();
    
    responses.forEach(response => {
      const gender = (response['Gender'] as string)?.trim() || 'Unknown';
      let genderKey = gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase();
      
      if (!['Male', 'Female', 'Other', 'Prefer not to say'].includes(genderKey)) {
        if (genderKey === 'Unknown' || !genderKey) {
          genderKey = 'Unknown';
        } else {
          if (genderKey.toLowerCase().includes('female')) genderKey = 'Female';
          else if (genderKey.toLowerCase().includes('male')) genderKey = 'Male';
          else genderKey = 'Unknown';
        }
      }
      
      if (!genderMap.has(genderKey)) {
        genderMap.set(genderKey, {
          peopleCount: 0,
          totalQuestions: 0,
          totalScore: 0,
          sdCount: 0,
          dCount: 0,
          nCount: 0,
          aCount: 0,
          saCount: 0
        });
      }
      
      const stats = genderMap.get(genderKey)!;
      stats.peopleCount++;
      
      let personSd = 0, personD = 0, personN = 0, personA = 0, personSa = 0;
      let personQuestionCount = 0;
      let personTotalScore = 0;
      
      Object.values(response).forEach(val => {
        if (typeof val === 'string') {
          switch(val) {
            case 'Strongly Disagree':
              personSd++;
              personQuestionCount++;
              personTotalScore += 1;
              break;
            case 'Disagree':
              personD++;
              personQuestionCount++;
              personTotalScore += 2;
              break;
            case 'Neutral':
              personN++;
              personQuestionCount++;
              personTotalScore += 3;
              break;
            case 'Agree':
              personA++;
              personQuestionCount++;
              personTotalScore += 4;
              break;
            case 'Strongly Agree':
              personSa++;
              personQuestionCount++;
              personTotalScore += 5;
              break;
          }
        }
      });
      
      stats.totalQuestions += personQuestionCount;
      stats.totalScore += personTotalScore;
      stats.sdCount += personSd;
      stats.dCount += personD;
      stats.nCount += personN;
      stats.aCount += personA;
      stats.saCount += personSa;
    });
    
    const result: Record<string, any> = {};
    
    genderMap.forEach((stats, gender) => {
      const avgQuestionsPerPerson = stats.peopleCount > 0 
        ? stats.totalQuestions / stats.peopleCount 
        : 0;
      
      const avgScore = stats.totalQuestions > 0 
        ? stats.totalScore / stats.totalQuestions 
        : 0;
      
      const avgSdPercent = stats.totalQuestions > 0 
        ? (stats.sdCount / stats.totalQuestions) * 100 
        : 0;
      
      const avgDPercent = stats.totalQuestions > 0 
        ? (stats.dCount / stats.totalQuestions) * 100 
        : 0;
      
      const avgNPercent = stats.totalQuestions > 0 
        ? (stats.nCount / stats.totalQuestions) * 100 
        : 0;
      
      const avgAPercent = stats.totalQuestions > 0 
        ? (stats.aCount / stats.totalQuestions) * 100 
        : 0;
      
      const avgSaPercent = stats.totalQuestions > 0 
        ? (stats.saCount / stats.totalQuestions) * 100 
        : 0;
      
      result[gender] = {
        peopleCount: stats.peopleCount,
        avgQuestionsPerPerson: parseFloat(avgQuestionsPerPerson.toFixed(1)),
        avgScore: parseFloat(avgScore.toFixed(1)),
        avgSdPercent: parseFloat(avgSdPercent.toFixed(1)),
        avgDPercent: parseFloat(avgDPercent.toFixed(1)),
        avgNPercent: parseFloat(avgNPercent.toFixed(1)),
        avgAPercent: parseFloat(avgAPercent.toFixed(1)),
        avgSaPercent: parseFloat(avgSaPercent.toFixed(1))
      };
    });
    
    return result;
  };

  const calculateTenureAnalysisByPerson = () => {
    const tenureMap = new Map<string, {
      peopleCount: number,
      totalQuestions: number,
      totalScore: number,
      sdCount: number,
      dCount: number,
      nCount: number,
      aCount: number,
      saCount: number
    }>();
    
    const tenureBuckets = [
      '0-1 Year',
      '1-3 Years', 
      '3-5 Years',
      '5+ Years',
      'Unknown'
    ];
    
    tenureBuckets.forEach(bucket => {
      tenureMap.set(bucket, {
        peopleCount: 0,
        totalQuestions: 0,
        totalScore: 0,
        sdCount: 0,
        dCount: 0,
        nCount: 0,
        aCount: 0,
        saCount: 0
      });
    });
    
    responses.forEach(response => {
      const tenureValue = response['Tenure'];
      let tenureBucket = 'Unknown';
      
      if (tenureValue !== undefined && tenureValue !== null && tenureValue !== '') {
        try {
          const tenureNum = typeof tenureValue === 'string' 
            ? parseFloat(tenureValue.replace(/[^0-9.]/g, ''))
            : Number(tenureValue);
          
          if (!isNaN(tenureNum)) {
            if (tenureNum < 1) tenureBucket = '0-1 Year';
            else if (tenureNum < 3) tenureBucket = '1-3 Years';
            else if (tenureNum < 5) tenureBucket = '3-5 Years';
            else tenureBucket = '5+ Years';
          }
        } catch (e) {
          tenureBucket = 'Unknown';
        }
      }
      
      const stats = tenureMap.get(tenureBucket)!;
      stats.peopleCount++;
      
      let personSd = 0, personD = 0, personN = 0, personA = 0, personSa = 0;
      let personQuestionCount = 0;
      let personTotalScore = 0;
      
      Object.values(response).forEach(val => {
        if (typeof val === 'string') {
          switch(val) {
            case 'Strongly Disagree':
              personSd++;
              personQuestionCount++;
              personTotalScore += 1;
              break;
            case 'Disagree':
              personD++;
              personQuestionCount++;
              personTotalScore += 2;
              break;
            case 'Neutral':
              personN++;
              personQuestionCount++;
              personTotalScore += 3;
              break;
            case 'Agree':
              personA++;
              personQuestionCount++;
              personTotalScore += 4;
              break;
            case 'Strongly Agree':
              personSa++;
              personQuestionCount++;
              personTotalScore += 5;
              break;
          }
        }
      });
      
      stats.totalQuestions += personQuestionCount;
      stats.totalScore += personTotalScore;
      stats.sdCount += personSd;
      stats.dCount += personD;
      stats.nCount += personN;
      stats.aCount += personA;
      stats.saCount += personSa;
    });
    
    const result: Record<string, any> = {};
    
    tenureMap.forEach((stats, tenure) => {
      if (stats.peopleCount === 0) {
        result[tenure] = {
          peopleCount: 0,
          avgQuestionsPerPerson: 0,
          avgScore: 0,
          avgSdPercent: 0,
          avgDPercent: 0,
          avgNPercent: 0,
          avgAPercent: 0,
          avgSaPercent: 0
        };
        return;
      }
      
      const avgQuestionsPerPerson = stats.peopleCount > 0 
        ? stats.totalQuestions / stats.peopleCount 
        : 0;
      
      const avgScore = stats.totalQuestions > 0 
        ? stats.totalScore / stats.totalQuestions 
        : 0;
      
      const avgSdPercent = stats.totalQuestions > 0 
        ? (stats.sdCount / stats.totalQuestions) * 100 
        : 0;
      
      const avgDPercent = stats.totalQuestions > 0 
        ? (stats.dCount / stats.totalQuestions) * 100 
        : 0;
      
      const avgNPercent = stats.totalQuestions > 0 
        ? (stats.nCount / stats.totalQuestions) * 100 
        : 0;
      
      const avgAPercent = stats.totalQuestions > 0 
        ? (stats.aCount / stats.totalQuestions) * 100 
        : 0;
      
      const avgSaPercent = stats.totalQuestions > 0 
        ? (stats.saCount / stats.totalQuestions) * 100 
        : 0;
      
      result[tenure] = {
        peopleCount: stats.peopleCount,
        avgQuestionsPerPerson: parseFloat(avgQuestionsPerPerson.toFixed(1)),
        avgScore: parseFloat(avgScore.toFixed(1)),
        avgSdPercent: parseFloat(avgSdPercent.toFixed(1)),
        avgDPercent: parseFloat(avgDPercent.toFixed(1)),
        avgNPercent: parseFloat(avgNPercent.toFixed(1)),
        avgAPercent: parseFloat(avgAPercent.toFixed(1)),
        avgSaPercent: parseFloat(avgSaPercent.toFixed(1))
      };
    });
    
    const sortedResult: Record<string, any> = {};
    tenureBuckets.forEach(bucket => {
      if (result[bucket]) {
        sortedResult[bucket] = result[bucket];
      }
    });
    
    return sortedResult;
  };

  const calculateCommentSentiment = () => {
    const comments = responses
      .map(r => r['Additional Comments'] as string)
      .filter(comment => comment && comment.trim().length > 10);
    
    let positive = 0, negative = 0, neutral = 0;
    
    comments.forEach(comment => {
      const lowerComment = comment.toLowerCase();
      const positiveWords = ['good', 'great', 'excellent', 'helpful', 'supportive', 'positive'];
      const negativeWords = ['bad', 'poor', 'issue', 'problem', 'negative', 'difficult'];
      
      const posCount = positiveWords.filter(word => lowerComment.includes(word)).length;
      const negCount = negativeWords.filter(word => lowerComment.includes(word)).length;
      
      if (posCount > negCount) positive++;
      else if (negCount > posCount) negative++;
      else neutral++;
    });
    
    const total = comments.length || 1;
    
    return [
      { type: 'Positive', count: positive, percentage: Math.round((positive / total) * 100) },
      { type: 'Neutral', count: neutral, percentage: Math.round((neutral / total) * 100) },
      { type: 'Negative', count: negative, percentage: Math.round((negative / total) * 100) }
    ];
  };

  const calculateTotalComments = () => {
    return responses.filter(r => r['Additional Comments'] && 
      (r['Additional Comments'] as string).trim().length > 10).length;
  };

  const calculateLeaderAnalytics = () => {
    const leaderMap = new Map<string, {
      name: string,
      totalScore: number,
      count: number,
      sdCount: number,
      dCount: number,
      nCount: number,
      aCount: number,
      saCount: number,
      totalAnswers: number
    }>();
    
    responses.forEach(response => {
      const managerEmail = response['Management Email ID'];
      
      if (managerEmail && typeof managerEmail === 'string' && managerEmail.includes('@')) {
        const email = managerEmail.trim().toLowerCase();
        const name = emailToName(managerEmail);
        
        if (!leaderMap.has(email)) {
          leaderMap.set(email, {
            name: email,
            totalScore: 0,
            count: 0,
            sdCount: 0,
            dCount: 0,
            nCount: 0,
            aCount: 0,
            saCount: 0,
            totalAnswers: 0
          });
        }
        
        const leader = leaderMap.get(email)!;
        leader.count++;
        
        const rating = parseFloat(response['Rating'] as string);
        if (!isNaN(rating)) {
          leader.totalScore += rating;
        }
        
        let questionAnswers = 0;
        Object.values(response).forEach(val => {
          if (typeof val === 'string') {
            switch(val) {
              case 'Strongly Disagree': 
                leader.sdCount++;
                questionAnswers++;
                break;
              case 'Disagree': 
                leader.dCount++;
                questionAnswers++;
                break;
              case 'Neutral': 
                leader.nCount++;
                questionAnswers++;
                break;
              case 'Agree': 
                leader.aCount++;
                questionAnswers++;
                break;
              case 'Strongly Agree': 
                leader.saCount++;
                questionAnswers++;
                break;
            }
          }
        });
        
        leader.totalAnswers += questionAnswers;
      }
    });
    
    return Array.from(leaderMap.values()).map(leader => {
      const meanScore = leader.count > 0 ? leader.totalScore / leader.count : 0;
      const totalResponses = leader.sdCount + leader.dCount + leader.nCount + leader.aCount + leader.saCount;
      
      let riskLevel = 'Low';
      if (leader.sdCount > 10) riskLevel = 'High';
      else if (leader.sdCount > 5) riskLevel = 'Medium';
      
      return {
        name: leader.name,
        meanScore: parseFloat(meanScore.toFixed(2)),
        totalAnswers: leader.totalAnswers,
        sdCount: leader.sdCount,
        dCount: leader.dCount,
        nCount: leader.nCount,
        aCount: leader.aCount,
        saCount: leader.saCount,
        totalResponses: totalResponses,
        feedbackCount: leader.count,
        riskLevel: riskLevel
      };
    }).sort((a, b) => b.meanScore - a.meanScore);
  };

  const calculateGlobalRiskScore = () => {
    const leaderAnalytics = calculateLeaderAnalytics();
    const highRiskCount = leaderAnalytics.filter(l => l.riskLevel === 'High').length;
    return Math.min(100, Math.round((highRiskCount / leaderAnalytics.length) * 100));
  };

  const calculateRiskBuckets = () => {
    const leaderAnalytics = calculateLeaderAnalytics();
    return {
      low: leaderAnalytics.filter(l => l.riskLevel === 'Low').length,
      medium: leaderAnalytics.filter(l => l.riskLevel === 'Medium').length,
      high: leaderAnalytics.filter(l => l.riskLevel === 'High').length
    };
  };

  const calculateHighRiskLeaders = () => {
    return calculateLeaderAnalytics()
      .filter(leader => leader.riskLevel === 'High' || leader.riskLevel === 'Medium')
      .map(leader => ({
        ...leader,
        riskScore: Math.max(0, leader.sdCount * 5 - leader.saCount),
        actionNeeded: leader.sdCount > 10 ? 'High' : leader.sdCount > 5 ? 'Medium' : 'Low'
      }))
      .sort((a, b) => b.riskScore - a.riskScore);
  };

  // Calculate current logs to display
  const currentLogs = responses
    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    .map(response => ({
      Timestamp: response.Timestamp,
      'Role Reviewed': response['Role Reviewed'],
      Process: response.Process,
      'Management Email ID': response['Management Email ID'],
      'Encrypted Submitter ID': response['Encrypted Submitter ID']
    }));

  const totalPages = Math.ceil(responses.length / itemsPerPage);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 bg-primary text-white flex flex-col">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-2xl font-bold text-accent">Vox Admin</h2>
        </div>
        
        <nav className="flex-1 py-4">
          {[
            { id: 'sheets', icon: FileText, label: 'Google Sheets' },
            { id: 'home', icon: Home, label: 'Dashboard' },
            { id: 'analytics', icon: BarChart3, label: 'Analytics' },
            { id: 'logs', icon: FileText, label: 'Logs' },
            { id: 'reminders', icon: Mail, label: 'Reminders' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as AdminTab)}
              className={`w-full vox-sidebar-item ${activeTab === item.id ? 'active' : ''}`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <Button variant="ghost" onClick={() => navigate('/')} className="w-full text-white/70 hover:text-white hover:bg-white/10">
            <LogOut className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 bg-muted overflow-auto">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as AdminTab)} className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Admin Dashboard</h1>
            </div>
            <Button onClick={loadResponsesData} variant="outline" disabled={loading}>
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Refresh Data
            </Button>
          </div>

          <TabsList>
            <TabsTrigger value="sheets">Google Sheets Data</TabsTrigger>
            <TabsTrigger value="home">Dashboard</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="logs">Activity Logs</TabsTrigger>
            <TabsTrigger value="reminders">Reminders</TabsTrigger>
          </TabsList>

          <TabsContent value="sheets" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Google Sheets Integration</CardTitle>
                <CardDescription>
                  Real-time feedback data from your Google Sheets. Data updates automatically when the sheet changes.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SheetsDataTable />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="home" className="space-y-6">
            <div className="animate-fade-in">
              <h2 className="text-2xl font-bold text-foreground mb-4">Dashboard Overview</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <Users className="w-8 h-8 text-secondary mx-auto mb-2" />
                      <span className="text-3xl font-bold block">{stats.uniqueSubmitters}</span>
                      <span className="text-sm text-muted-foreground">Unique Submitters</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <TrendingUp className="w-8 h-8 text-secondary mx-auto mb-2" />
                      <span className="text-3xl font-bold block">{stats.totalResponses}</span>
                      <span className="text-sm text-muted-foreground">Total Responses</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <AlertTriangle className="w-8 h-8 text-accent mx-auto mb-2" />
                      <span className="text-3xl font-bold block">{stats.totalEmployees - stats.uniqueSubmitters}</span>
                      <span className="text-sm text-muted-foreground">Pending Users</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Responses by Quarter</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4">
                    {['Q1', 'Q2', 'Q3', 'Q4'].map(quarter => {
                      const count = stats.quarterlyData?.[quarter] || 0;
                      const totalCount = Object.values(stats.quarterlyData || {}).reduce((sum, val) => sum + (val || 0), 0);
                      const percentage = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
                      
                      return (
                        <div key={quarter} className="text-center p-4 bg-accent/10 rounded-xl border border-accent/30 hover:bg-accent/20 transition-colors">
                          <div className="flex flex-col items-center">
                            <span className="text-2xl font-bold text-secondary">{count}</span>
                            <p className="text-sm text-muted-foreground">{quarter}</p>
                            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-secondary h-2 rounded-full" 
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
   <TabsContent value="analytics" className="space-y-6">
  <div className="animate-fade-in">
    <h2 className="text-2xl font-bold text-foreground mb-4">Analytics</h2>
<Card className="mb-6">
  <CardHeader>
    <CardTitle>Leader Insights</CardTitle>
    <CardDescription>
      Select a leader to view detailed analytics
    </CardDescription>
  </CardHeader>
  <CardContent>
    <div className="flex flex-col gap-4">
      <div className="flex gap-3 items-center">
        <select 
          className="flex-1 p-2 border rounded-md bg-white"
          value={selectedLeader}
          onChange={(e) => setSelectedLeader(e.target.value)}
        >
          <option value="all">All Leaders (Global Overview)</option>
          {getUniqueLeaders().map(leader => (
            <option key={leader.email} value={leader.email}>
              {leader.name} ({leader.feedbackCount} feedbacks)
            </option>
          ))}
        </select>
        <Button onClick={refreshAnalytics} variant="outline" className="whitespace-nowrap">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>
      
      {/* Show leader insights if a specific leader is selected */}
      {selectedLeader !== 'all' && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="font-semibold text-blue-800 text-lg">
                {emailToName(selectedLeader)}
              </h4>
              <p className="text-sm text-blue-600">{selectedLeader}</p>
            </div>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => setSelectedLeader('all')}
              className="text-blue-600 hover:text-blue-800"
            >
              ← View All Leaders
            </Button>
          </div>
          
         {(() => {
  const leaderData = calculateLeaderAnalyticsByPerson().find(l => l.email === selectedLeader);
  if (!leaderData) {
    return (
      <div className="text-center py-4 text-gray-500">
        No detailed data available for this leader.
      </div>
    );
  }
  
  // Create safe versions of the percentage values
  const safePercentages = {
    stronglyagree: leaderData.saPercent || 0,
    agree: leaderData.aPercent || 0,
    neutral: leaderData.nPercent || 0,
    disagree: leaderData.dPercent || 0,
    stronglydisagree: leaderData.sdPercent || 0,
  };
  
  const responseTypes = [
    { key: 'stronglyagree', label: 'Strongly Agree', color: 'bg-green-600', textColor: 'text-green-600' },
    { key: 'agree', label: 'Agree', color: 'bg-green-400', textColor: 'text-green-400' },
    { key: 'neutral', label: 'Neutral', color: 'bg-yellow-400', textColor: 'text-yellow-600' },
    { key: 'disagree', label: 'Disagree', color: 'bg-orange-400', textColor: 'text-orange-600' },
    { key: 'stronglydisagree', label: 'Strongly Disagree', color: 'bg-red-500', textColor: 'text-red-600' },
  ];
  
  return (
    <>
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-4 bg-white rounded-lg border shadow-sm">
          <div className="text-2xl font-bold text-blue-600">
            {leaderData.feedbackCount || 0}
          </div>
          <div className="text-xs text-gray-600">Total Feedbacks</div>
          <div className="text-xs text-gray-500 mt-1">
            {leaderData.uniqueRespondents || 0} people
          </div>
        </div>
        <div className="text-center p-4 bg-white rounded-lg border shadow-sm">
          <div className={`text-2xl font-bold ${
            (leaderData.avgScore || 0) >= 4 ? 'text-green-600' :
            (leaderData.avgScore || 0) >= 3 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {(leaderData.avgScore || 0).toFixed(1)}
          </div>
          <div className="text-xs text-gray-600">Avg Rating (1-5)</div>
          <div className="text-xs text-gray-500 mt-1">
            per feedback
          </div>
        </div>
        <div className="text-center p-4 bg-white rounded-lg border shadow-sm">
          <div className="text-2xl font-bold text-green-600">
            {(leaderData.saPercent || 0).toFixed(1)}%
          </div>
          <div className="text-xs text-gray-600">Strongly Agree</div>
          <div className="text-xs text-gray-500 mt-1">
            {leaderData.saCount || 0} responses
          </div>
        </div>
        <div className="text-center p-4 bg-white rounded-lg border shadow-sm">
          <div className="text-2xl font-bold text-red-600">
            {(leaderData.sdPercent || 0).toFixed(1)}%
          </div>
          <div className="text-xs text-gray-600">Strongly Disagree</div>
          <div className="text-xs text-gray-500 mt-1">
            {leaderData.sdCount || 0} responses
          </div>
        </div>
      </div>
      
      {/* Response Distribution */}
      <div className="mb-6">
        <h5 className="font-medium mb-3 text-blue-700">Response Distribution</h5>
        <div className="space-y-2">
          {responseTypes.map((responseType, index) => {
            const percent = safePercentages[responseType.key];
            const countKey = responseType.key.replace('strongly', '').replace('disagree', 'd').replace('agree', 'a');
            const count = leaderData[`${countKey}Count`] || 0;
            
            return (
              <div key={responseType.key} className="flex items-center gap-3">
                <div className="w-24 text-sm text-gray-600">{responseType.label}</div>
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span>{percent.toFixed(1)}%</span>
                    <span>{count} responses</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-2 rounded-full ${responseType.color}`}
                      style={{ width: `${Math.min(percent, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Risk Assessment */}
      <div className="p-4 bg-gray-50 rounded-lg border">
        <h5 className="font-medium mb-2 text-gray-700">Risk Assessment</h5>
        <div className="flex items-center justify-between">
          <div>
            <div className={`text-lg font-bold ${
              (leaderData.riskLevel || 'Low') === 'High' ? 'text-red-600' :
              (leaderData.riskLevel || 'Low') === 'Medium' ? 'text-yellow-600' : 'text-green-600'
            }`}>
              {leaderData.riskLevel || 'Low'} Risk
            </div>
            <div className="text-sm text-gray-600">
              SD/SA Ratio: {((leaderData.sdCount || 0) / Math.max((leaderData.saCount || 0), 1)).toFixed(2)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium">Risk Score</div>
            <div className="text-2xl font-bold">{leaderData.riskScore || 0}</div>
          </div>
        </div>
      </div>
    </>
  );
})()}
        </div>
      )}
    </div>
  </CardContent>
</Card>

    {/* Participation Rate */}
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Participation Rate</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="flex justify-between mb-1">
            <span>Participation Progress</span>
            <span className="font-bold">{participationRate}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div 
              className="bg-secondary h-4 rounded-full transition-all duration-500" 
              style={{ width: `${participationRate}%` }}
            ></div>
          </div>
        </div>
        <p className="text-muted-foreground text-sm">
          <span className="font-bold">{stats.uniqueSubmitters}</span> out of 
          <span className="font-bold"> {stats.totalEmployees}</span> employees submitted feedback.
        </p>
      </CardContent>
    </Card>

    {/* Question Performance Analysis */}
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Question Performance Analysis</CardTitle>
        <CardDescription>
          Mean scores and consistency across questions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 font-medium">Question</th>
                <th className="text-left py-3 font-medium">Mean Score</th>
                <th className="text-left py-3 font-medium">Std Dev</th>
                <th className="text-left py-3 font-medium">Responses</th>
                {/* <th className="text-left py-3 font-medium">Trend</th> */}
              </tr>
            </thead>
            <tbody>
              {calculateQuestionMetrics().map((metric, idx) => (
                <tr key={idx} className="border-b hover:bg-muted/50">
                  <td className="py-3 font-medium max-w-xs truncate">
                    {metric.question}
                  </td>
                  <td className="py-3">
                    <span className={`font-bold ${
                      metric.meanScore >= 4 ? 'text-green-600' : 
                      metric.meanScore >= 3 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {metric.meanScore.toFixed(2)}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className={metric.stdDev > 1.5 ? 'text-yellow-600' : 'text-green-600'}>
                      {metric.stdDev.toFixed(2)}
                    </span>
                  </td>
                  <td className="py-3">{metric.count}</td>
                  {/* <td className="py-3">
                    {metric.trend === 'up' ? '↗️' : metric.trend === 'down' ? '↘️' : '➡️'}
                  </td> */}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>

    {/* Demographic Analysis */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
<Card>
  <CardHeader>
    <CardTitle>Gender Analysis</CardTitle>
    <CardDescription>
      Response distribution by submitter gender (Total: {stats.totalResponses} responses)
    </CardDescription>
  </CardHeader>
  <CardContent>
    <div className="space-y-4">
      {(() => {
        const genderData = calculateGenderAnalysisByPerson(); // Use corrected function
        const totalPeople = stats.totalResponses; // 99 people
        
        return Object.entries(genderData).map(([gender, data]) => {
          const peopleCount = data.peopleCount || 0;
          const percentageOfTotal = totalPeople > 0 
            ? (peopleCount / totalPeople) * 100 
            : 0;
          
          // Calculate percentages based on average scores per person
          const responsePercentages = {
            sa: data.avgSaPercent || 0,
            a: data.avgAPercent || 0,
            n: data.avgNPercent || 0,
            d: data.avgDPercent || 0,
            sd: data.avgSdPercent || 0,
          };
          
          const avgScore = data.avgScore || 0;
          
          return (
            <div key={gender} className="pb-4 border-b last:border-b-0 last:pb-0">
              {/* Header */}
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">{gender}</span>
                <div className="text-right">
                  <div className="text-sm font-bold">{peopleCount} people</div>
                  {/* <div className="text-xs text-muted-foreground">
                    {percentageOfTotal.toFixed(1)}% of total
                  </div> */}
                </div>
              </div>
              
              {/* Main percentage bar - showing share of total people */}
              <div className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                  <span>Share of total respondents</span>
                  <span className="font-medium">{percentageOfTotal.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-secondary h-2 rounded-full" 
                    style={{ width: `${Math.min(percentageOfTotal, 100)}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Response distribution stack */}
              <div className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                  <span>Average response distribution</span>
                  <span className={`font-medium ${
                    avgScore >= 4 ? 'text-green-600' :
                    avgScore >= 3 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    Avg: {avgScore.toFixed(1)}/5
                  </span>
                </div>
                <div className="w-full rounded-full h-2 overflow-hidden flex border border-gray-300">
                  <div 
                    className="bg-red-500 h-full"
                    style={{ width: `${Math.min(responsePercentages.sd, 100)}%` }}
                    title={`Average Strongly Disagree: ${responsePercentages.sd.toFixed(1)}%`}
                  ></div>
                  <div 
                    className="bg-orange-400 h-full"
                    style={{ width: `${Math.min(responsePercentages.d, 100)}%` }}
                    title={`Average Disagree: ${responsePercentages.d.toFixed(1)}%`}
                  ></div>
                  <div 
                    className="bg-yellow-400 h-full"
                    style={{ width: `${Math.min(responsePercentages.n, 100)}%` }}
                    title={`Average Neutral: ${responsePercentages.n.toFixed(1)}%`}
                  ></div>
                  <div 
                    className="bg-green-400 h-full"
                    style={{ width: `${Math.min(responsePercentages.a, 100)}%` }}
                    title={`Average Agree: ${responsePercentages.a.toFixed(1)}%`}
                  ></div>
                  <div 
                    className="bg-green-600 h-full"
                    style={{ width: `${Math.min(responsePercentages.sa, 100)}%` }}
                    title={`Average Strongly Agree: ${responsePercentages.sa.toFixed(1)}%`}
                  ></div>
                </div>
              </div>
              
              {/* Percentage breakdown grid */}
              <div className="grid grid-cols-5 gap-1 text-xs">
                <div className="text-center" title="Average Strongly Disagree">
                  <div className="text-red-600 font-medium">
                    {responsePercentages.sd.toFixed(0)}%
                  </div>
                  <div className="text-gray-500 truncate">SD</div>
                </div>
                <div className="text-center" title="Average Disagree">
                  <div className="text-orange-600 font-medium">
                    {responsePercentages.d.toFixed(0)}%
                  </div>
                  <div className="text-gray-500 truncate">D</div>
                </div>
                <div className="text-center" title="Average Neutral">
                  <div className="text-yellow-600 font-medium">
                    {responsePercentages.n.toFixed(0)}%
                  </div>
                  <div className="text-gray-500 truncate">N</div>
                </div>
                <div className="text-center" title="Average Agree">
                  <div className="text-green-600 font-medium">
                    {responsePercentages.a.toFixed(0)}%
                  </div>
                  <div className="text-gray-500 truncate">A</div>
                </div>
                <div className="text-center" title="Average Strongly Agree">
                  <div className="text-green-700 font-medium">
                    {responsePercentages.sa.toFixed(0)}%
                  </div>
                  <div className="text-gray-500 truncate">SA</div>
                </div>
              </div>
              
              {/* Additional stats */}
              <div className="mt-2 text-xs text-muted-foreground text-center">
                Avg questions per person: {data.avgQuestionsPerPerson?.toFixed(1) || 0}
              </div>
            </div>
          );
        });
      })()}
    </div>
    
    {/* Summary */}
    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
      <div className="text-sm font-medium mb-1">Summary</div>
      <div className="text-xs text-muted-foreground">
        Based on {stats.totalResponses} individual respondents, not question counts.
      </div>
    </div>
    
    {/* Legend */}
    <div className="mt-4 pt-4 border-t">
      <div className="text-xs font-medium mb-2">Legend:</div>
      <div className="flex flex-wrap gap-3 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span>SD: Strongly Disagree</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-orange-400 rounded"></div>
          <span>D: Disagree</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-yellow-400 rounded"></div>
          <span>N: Neutral</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-400 rounded"></div>
          <span>A: Agree</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-600 rounded"></div>
          <span>SA: Strongly Agree</span>
        </div>
      </div>
    </div>
  </CardContent>
</Card>

{/* Tenure Analysis - Counting People, Not Questions */}
<Card>
  <CardHeader>
    <CardTitle>Tenure Analysis</CardTitle>
    <CardDescription>
      Response distribution by submitter tenure (Total: {stats.totalResponses} responses)
    </CardDescription>
  </CardHeader>
  <CardContent>
    <div className="space-y-4">
      {(() => {
        const tenureData = calculateTenureAnalysisByPerson(); // Use corrected function
        const totalPeople = stats.totalResponses; // 99 people
        
        return Object.entries(tenureData).map(([tenure, data]) => {
          const peopleCount = data.peopleCount || 0;
          const percentageOfTotal = totalPeople > 0 
            ? (peopleCount / totalPeople) * 100 
            : 0;
          
          // Calculate percentages based on average scores per person
          const responsePercentages = {
            sa: data.avgSaPercent || 0,
            a: data.avgAPercent || 0,
            n: data.avgNPercent || 0,
            d: data.avgDPercent || 0,
            sd: data.avgSdPercent || 0,
          };
          
          const avgScore = data.avgScore || 0;
          
          return (
            <div key={tenure} className="pb-4 border-b last:border-b-0 last:pb-0">
              {/* Header */}
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">{tenure}</span>
                <div className="text-right">
                  <div className="text-sm font-bold">{peopleCount} people</div>
                  {/* <div className="text-xs text-muted-foreground">
                    {percentageOfTotal.toFixed(1)}% of total
                  </div> */}
                </div>
              </div>
              
              {/* Main percentage bar - showing share of total people */}
              <div className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                  <span>Share of total respondents</span>
                  <span className="font-medium">{percentageOfTotal.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ width: `${Math.min(percentageOfTotal, 100)}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Response distribution stack */}
              <div className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                  <span>Average response distribution</span>
                  <span className={`font-medium ${
                    avgScore >= 4 ? 'text-green-600' :
                    avgScore >= 3 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    Avg: {avgScore.toFixed(1)}/5
                  </span>
                </div>
                <div className="w-full rounded-full h-2 overflow-hidden flex border border-gray-300">
                  <div 
                    className="bg-red-500 h-full"
                    style={{ width: `${Math.min(responsePercentages.sd, 100)}%` }}
                    title={`Average Strongly Disagree: ${responsePercentages.sd.toFixed(1)}%`}
                  ></div>
                  <div 
                    className="bg-orange-400 h-full"
                    style={{ width: `${Math.min(responsePercentages.d, 100)}%` }}
                    title={`Average Disagree: ${responsePercentages.d.toFixed(1)}%`}
                  ></div>
                  <div 
                    className="bg-yellow-400 h-full"
                    style={{ width: `${Math.min(responsePercentages.n, 100)}%` }}
                    title={`Average Neutral: ${responsePercentages.n.toFixed(1)}%`}
                  ></div>
                  <div 
                    className="bg-green-400 h-full"
                    style={{ width: `${Math.min(responsePercentages.a, 100)}%` }}
                    title={`Average Agree: ${responsePercentages.a.toFixed(1)}%`}
                  ></div>
                  <div 
                    className="bg-green-600 h-full"
                    style={{ width: `${Math.min(responsePercentages.sa, 100)}%` }}
                    title={`Average Strongly Agree: ${responsePercentages.sa.toFixed(1)}%`}
                  ></div>
                </div>
              </div>
              
              {/* Percentage breakdown grid */}
              <div className="grid grid-cols-5 gap-1 text-xs">
                <div className="text-center" title="Average Strongly Disagree">
                  <div className="text-red-600 font-medium">
                    {responsePercentages.sd.toFixed(0)}%
                  </div>
                  <div className="text-gray-500 truncate">SD</div>
                </div>
                <div className="text-center" title="Average Disagree">
                  <div className="text-orange-600 font-medium">
                    {responsePercentages.d.toFixed(0)}%
                  </div>
                  <div className="text-gray-500 truncate">D</div>
                </div>
                <div className="text-center" title="Average Neutral">
                  <div className="text-yellow-600 font-medium">
                    {responsePercentages.n.toFixed(0)}%
                  </div>
                  <div className="text-gray-500 truncate">N</div>
                </div>
                <div className="text-center" title="Average Agree">
                  <div className="text-green-600 font-medium">
                    {responsePercentages.a.toFixed(0)}%
                  </div>
                  <div className="text-gray-500 truncate">A</div>
                </div>
                <div className="text-center" title="Average Strongly Agree">
                  <div className="text-green-700 font-medium">
                    {responsePercentages.sa.toFixed(0)}%
                  </div>
                  <div className="text-gray-500 truncate">SA</div>
                </div>
              </div>
              
              {/* Additional stats */}
              <div className="mt-2 text-xs text-muted-foreground text-center">
                Avg questions per person: {data.avgQuestionsPerPerson?.toFixed(1) || 0}
              </div>
            </div>
          );
        });
      })()}
    </div>
    
    {/* Summary */}
    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
      <div className="text-sm font-medium mb-1">Summary</div>
      <div className="text-xs text-muted-foreground">
        Based on {stats.totalResponses} individual respondents, not question counts.
      </div>
    </div>
    
    {/* Legend */}
    <div className="mt-4 pt-4 border-t">
      <div className="text-xs font-medium mb-2">Legend:</div>
      <div className="flex flex-wrap gap-3 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span>SD: Strongly Disagree</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-orange-400 rounded"></div>
          <span>D: Disagree</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-yellow-400 rounded"></div>
          <span>N: Neutral</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-400 rounded"></div>
          <span>A: Agree</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-600 rounded"></div>
          <span>SA: Strongly Agree</span>
        </div>
      </div>
    </div>
  </CardContent>
</Card>


    </div>

    {/* Comment Sentiment Analysis */}
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Comment Sentiment Analysis</CardTitle>
        <CardDescription>
          Sentiment analysis of written comments
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {calculateCommentSentiment().map((sentiment, idx) => (
            <div key={idx} className="text-center p-4 rounded-lg border">
              <div className={`text-2xl font-bold mb-2 ${
                sentiment.type === 'Positive' ? 'text-green-600' :
                sentiment.type === 'Negative' ? 'text-red-600' : 'text-yellow-600'
              }`}>
                {sentiment.percentage}%
              </div>
              <div className="text-sm font-medium">{sentiment.type}</div>
              <div className="text-xs text-muted-foreground">
                {sentiment.count} comments
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 text-sm text-muted-foreground">
          Total comments analyzed: {calculateTotalComments()}
        </div>
      </CardContent>
    </Card>

    {/* Risk Analysis */}
    <Card>
      <CardHeader>
        <CardTitle>Risk Analysis Dashboard</CardTitle>
        <CardDescription>
          Predictive attrition indicators and HR risk assessment
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">Global HR Risk Score</span>
            <span className="text-2xl font-bold text-red-600">{calculateGlobalRiskScore()}/100</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div 
              className={`h-4 rounded-full ${
                calculateGlobalRiskScore() > 70 ? 'bg-red-500' :
                calculateGlobalRiskScore() > 40 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${calculateGlobalRiskScore()}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Low</span>
            <span>Medium</span>
            <span>High</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {calculateRiskBuckets().low}
            </div>
            <div className="text-sm font-medium">Low Risk</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {calculateRiskBuckets().medium}
            </div>
            <div className="text-sm font-medium">Medium Risk</div>
          </div>
          <div className="text-center p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-2xl font-bold text-red-600">
              {calculateRiskBuckets().high}
            </div>
            <div className="text-sm font-medium">High Risk</div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 font-medium">Leader</th>
                <th className="text-left py-3 font-medium">SD Count</th>
                <th className="text-left py-3 font-medium">SA Count</th>
                <th className="text-left py-3 font-medium">Risk Score</th>
                <th className="text-left py-3 font-medium">Action Needed</th>
              </tr>
            </thead>
            <tbody>
              {calculateHighRiskLeaders().map(leader => (
                <tr key={leader.name} className="border-b hover:bg-muted/50">
                  <td className="py-3 font-medium">
                    {leader.name.includes('@') ? leader.name.split('@')[0] : leader.name}
                  </td>
                  <td className="py-3 text-red-600 font-bold">{leader.sdCount}</td>
                  <td className="py-3 text-green-600 font-bold">{leader.saCount}</td>
                  <td className="py-3 font-bold">{leader.riskScore}</td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      leader.actionNeeded === 'High' ? 'bg-red-100 text-red-800' :
                      leader.actionNeeded === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {leader.actionNeeded}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>

  </div>
</TabsContent>

 {/* <TabsContent value="logs" className="space-y-6">
            <div className="animate-fade-in">
              <h2 className="text-2xl font-bold text-foreground mb-4">Activity Logs</h2>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex justify-end mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Show:</span>
                      <select 
                        value={itemsPerPage}
                        onChange={(e) => setItemsPerPage(Number(e.target.value))}
                        className="px-3 py-1 text-sm border rounded-md bg-background"
                      >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                    </div>
                  </div>

                  {responses.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No activity logs found
                    </div>
                  ) : (
                    <>
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 font-medium">Date</th>
                            <th className="text-left py-3 font-medium">Role</th>
                            <th className="text-left py-3 font-medium">Process</th>
                            <th className="text-left py-3 font-medium">Target</th>
                            <th className="text-left py-3 font-medium">Submitter</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentLogs.map((log, idx) => (
                            <tr key={idx} className="border-b hover:bg-muted/50">
                              <td className="py-3">
                                {log.Timestamp ? formatDate(log.Timestamp as string) : 'N/A'}
                              </td>
                              <td className="py-3">{log['Role Reviewed'] || 'N/A'}</td>
                              <td className="py-3">{log.Process || 'N/A'}</td>
                              <td className="py-3">{log['Management Email ID'] || 'N/A'}</td>
                              <td className="py-3">
                                {log['Encrypted Submitter ID'] 
                                  ? `${(log['Encrypted Submitter ID'] as string).substring(0, 8)}...` 
                                  : 'Anonymous'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      <div className="flex justify-between items-center mt-6">
                        <div className="text-sm text-muted-foreground">
                          Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, responses.length)} of {responses.length} entries
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            size="sm"
                          >
                            Previous
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            size="sm"
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent> */}



          <TabsContent value="logs" className="space-y-6">
  <div className="animate-fade-in">
    <h2 className="text-2xl font-bold text-foreground mb-4">Complete Response Data</h2>
    {/* <p className="text-muted-foreground mb-4">
      Showing all {responses.length} records with all survey columns.
    </p> */}
    
    <Card>
      <CardContent className="pt-6">
        {/* Control bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
              {responses.length} records
            </div>
            <div className="text-sm text-muted-foreground">
              72 columns • Page {currentPage} of {totalPages}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Rows:</span>
              <select 
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="px-3 py-1 text-sm border rounded-md bg-background"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            
            <Button
              onClick={loadResponsesData}
              variant="outline"
              size="sm"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Refresh
            </Button>
          </div>
        </div>

        {responses.length === 0 ? (
          <div className="text-center py-12 border rounded-lg">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No data available</h3>
            <p className="text-muted-foreground mb-4">No response data found in Google Sheets</p>
            <Button onClick={loadResponsesData}>
              Load Data
            </Button>
          </div>
        ) : (
          <>
            {/* Fixed column headers in your specified order */}
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto max-h-[70vh]">
                <table className="w-full min-w-max">
                  <thead className="sticky top-0 bg-muted z-10">
                    <tr>
                      {/* Fixed column headers in your exact order */}
                      <th className="text-left py-3 px-4 font-medium border-b bg-muted sticky left-0 z-20 min-w-[80px]">
                        #
                      </th>
                      
                      {/* Your specified columns in exact order */}
                      <th className="text-left py-3 px-4 font-medium border-b bg-muted min-w-[180px]">Timestamp</th>
                      <th className="text-left py-3 px-4 font-medium border-b bg-muted min-w-[200px]">Encrypted Submitter ID</th>
                      <th className="text-left py-3 px-4 font-medium border-b bg-muted min-w-[120px]">Role Reviewed</th>
                      <th className="text-left py-3 px-4 font-medium border-b bg-muted min-w-[100px]">Gender</th>
                      <th className="text-left py-3 px-4 font-medium border-b bg-muted min-w-[100px]">Tenure</th>
                      <th className="text-left py-3 px-4 font-medium border-b bg-muted min-w-[150px]">Designation/Level</th>
                      <th className="text-left py-3 px-4 font-medium border-b bg-muted min-w-[80px]">Age</th>
                      <th className="text-left py-3 px-4 font-medium border-b bg-muted min-w-[80px]">Rating</th>
                      <th className="text-left py-3 px-4 font-medium border-b bg-muted min-w-[120px]">Process</th>
                      <th className="text-left py-3 px-4 font-medium border-b bg-muted min-w-[140px]">Gender of the user</th>
                      <th className="text-left py-3 px-4 font-medium border-b bg-muted min-w-[200px]">Management Email ID</th>
                      
                      {/* Support & Development questions */}
                      <th className="text-left py-3 px-4 font-medium border-b bg-muted min-w-[220px]">Support for personal and professional development</th>
                      <th className="text-left py-3 px-4 font-medium border-b bg-muted min-w-[200px]">Feedback that contributes to skill growth</th>
                      <th className="text-left py-3 px-4 font-medium border-b bg-muted min-w-[220px]">Encouragement for continuous learning - regular syncs</th>
                      <th className="text-left py-3 px-4 font-medium border-b bg-muted min-w-[200px]">Clarity in discussing development goals</th>
                      <th className="text-left py-3 px-4 font-medium border-b bg-muted min-w-[240px]">Availability of opportunities or resources for career growth</th>
                      <th className="text-left py-3 px-4 font-medium border-b bg-muted min-w-[200px]">Comfort in career-related discussions</th>
                      <th className="text-left py-3 px-4 font-medium border-b bg-muted min-w-[240px]">Clear identification of strengths and improvement areas</th>
                      
                      {/* Communication questions */}
                      <th className="text-left py-3 px-4 font-medium border-b bg-muted min-w-[180px]">Clarity of goals and priorities</th>
                      <th className="text-left py-3 px-4 font-medium border-b bg-muted min-w-[160px]">Timely sharing of updates</th>
                      <th className="text-left py-3 px-4 font-medium border-b bg-muted min-w-[200px]">Openness to questions and clarification</th>
                      <th className="text-left py-3 px-4 font-medium border-b bg-muted min-w-[200px]">Transparency in information sharing</th>
                      <th className="text-left py-3 px-4 font-medium border-b bg-muted min-w-[180px]">Responsiveness to concerns</th>
                      <th className="text-left py-3 px-4 font-medium border-b bg-muted min-w-[200px]">Overall communication effectiveness</th>
                      
                      {/* Support & Approachability questions */}
                      <th className="text-left py-3 px-4 font-medium border-b bg-muted min-w-[200px]">Availability of support when needed</th>
                      <th className="text-left py-3 px-4 font-medium border-b bg-muted min-w-[200px]">Demonstration of concern for well-being</th>
                      <th className="text-left py-3 px-4 font-medium border-b bg-muted min-w-[160px]">Ease of seeking guidance</th>
                      <th className="text-left py-3 px-4 font-medium border-b bg-muted min-w-[200px]">Effectiveness in resolving challenges</th>
                      <th className="text-left py-3 px-4 font-medium border-b bg-muted min-w-[180px]">Support for work-life balance</th>
                      
                      {/* Workload & Task Management questions */}
                      <th className="text-left py-3 px-4 font-medium border-b bg-muted min-w-[160px]">Fair distribution of workload</th>
                      <th className="text-left py-3 px-4 font-medium border-b bg-muted min-w-[180px]">Support in prioritizing tasks</th>
                      <th className="text-left py-3 px-4 font-medium border-b bg-muted min-w-[200px]">Identification and management of overload</th>
                      <th className="text-left py-3 px-4 font-medium border-b bg-muted min-w-[200px]">Encouragement to voice capacity concerns</th>
                      <th className="text-left py-3 px-4 font-medium border-b bg-muted min-w-[200px]">Realistic deadlines and expectations</th>
                      
                      {/* Leadership & Direction questions */}
                      <th className="text-left py-3 px-4 font-medium border-b bg-muted min-w-[200px]">Clear direction for work activities</th>
                      <th className="text-left py-3 px-4 font-medium border-b bg-muted min-w-[200px]">Informed and timely decisions</th>
                      <th className="text-left py-3 px-4 font-medium border-b bg-muted min-w-[180px]">Confidence in leadership</th>
                      <th className="text-left py-3 px-4 font-medium border-b bg-muted min-w-[200px]">Promotion of motivation and inspiration</th>
                      <th className="text-left py-3 px-4 font-medium border-b bg-muted min-w-[200px]">Demonstration of leadership through actions</th>
                      
                      {/* Feedback & Performance questions */}
                      <th className="text-left py-3 px-4 font-medium border-b bg-muted min-w-[180px]">Regular performance feedback</th>
                      <th className="text-left py-3 px-4 font-medium border-b bg-muted min-w-[200px]">Constructive and actionable feedback</th>
                      <th className="text-left py-3 px-4 font-medium border-b bg-muted min-w-[200px]">Improvement through performance discussions</th>
                      <th className="text-left py-3 px-4 font-medium border-b bg-muted min-w-[160px]">Recognition of achievements</th>
                      <th className="text-left py-3 px-4 font-medium border-b bg-muted min-w-[200px]">Review of performance goals when needed</th>
                      
                      {/* Fairness & Respect questions */}
                      <th className="text-left py-3 px-4 font-medium border-b bg-muted min-w-[160px]">Fair treatment of individuals</th>
                      <th className="text-left py-3 px-4 font-medium border-b bg-muted min-w-[180px]">Consistent demonstration of respect</th>
                      <th className="text-left py-3 px-4 font-medium border-b bg-muted min-w-[140px]">Avoidance of favoritism</th>
                      <th className="text-left py-3 px-4 font-medium border-b bg-muted min-w-[200px]">Value given to contributions and opinions</th>
                      <th className="text-left py-3 px-4 font-medium border-b bg-muted min-w-[160px]">Promotion of inclusion</th>
                      
                      {/* Team Culture questions */}
                      <th className="text-left py-3 px-4 font-medium border-b bg-muted min-w-[200px]">Encouragement of a positive work environment</th>
                      <th className="text-left py-3 px-4 font-medium border-b bg-muted min-w-[180px]">Fair and timely handling of conflicts</th>
                      <th className="text-left py-3 px-4 font-medium border-b bg-muted min-w-[160px]">Support for collaboration</th>
                      <th className="text-left py-3 px-4 font-medium border-b bg-muted min-w-[180px]">A safe and inclusive environment</th>
                      <th className="text-left py-3 px-4 font-medium border-b bg-muted min-w-[120px]">Fostering of trust</th>
                      
                      {/* Problem Solving questions */}
                      <th className="text-left py-3 px-4 font-medium border-b bg-muted min-w-[180px]">Effective handling of roadblocks</th>
                      <th className="text-left py-3 px-4 font-medium border-b bg-muted min-w-[220px]">Involvement of relevant individuals in issue resolution</th>
                      <th className="text-left py-3 px-4 font-medium border-b bg-muted min-w-[180px]">Encouragement of analytical thinking</th>
                      <th className="text-left py-3 px-4 font-medium border-b bg-muted min-w-[160px]">Comfort in raising issues</th>
                      
                      {/* Accountability questions */}
                      <th className="text-left py-3 px-4 font-medium border-b bg-muted min-w-[160px]">Clarity of responsibilities</th>
                      <th className="text-left py-3 px-4 font-medium border-b bg-muted min-w-[180px]">Consistency in upholding commitments</th>
                      <th className="text-left py-3 px-4 font-medium border-b bg-muted min-w-[140px]">Ownership of outcomes</th>
                      
                      {/* Overall questions */}
                      <th className="text-left py-3 px-4 font-medium border-b bg-muted min-w-[180px]">Overall effectiveness of leadership</th>
                      <th className="text-left py-3 px-4 font-medium border-b bg-muted min-w-[240px]">Positive experience working within the current environment</th>
                      <th className="text-left py-3 px-4 font-medium border-b bg-muted min-w-[180px]">Positive impact on job satisfaction</th>
                      
                      {/* Comments */}
                      <th className="text-left py-3 px-4 font-medium border-b bg-muted min-w-[300px]">Additional Comments</th>
                    </tr>
                  </thead>
                  <tbody>
                    {responses
                      .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                      .map((response, rowIndex) => (
                        <tr key={rowIndex} className="border-b hover:bg-muted/30 even:bg-muted/10">
                          {/* Row number */}
                          <td className="py-2 px-4 text-sm border-r bg-background sticky left-0 z-10 font-medium">
                            {(currentPage - 1) * itemsPerPage + rowIndex + 1}
                          </td>
                          
                          {/* Data cells in exact order */}
                          <td className="py-2 px-4 text-sm border-r">{formatDate(response.Timestamp as string || '')}</td>
                          <td className="py-2 px-4 text-sm border-r font-mono text-xs truncate max-w-[200px]" title={response['Encrypted Submitter ID'] as string || ''}>
                            {response['Encrypted Submitter ID'] || '-'}
                          </td>
                          <td className="py-2 px-4 text-sm border-r">{response['Role Reviewed'] || '-'}</td>
                          <td className="py-2 px-4 text-sm border-r">{response['Gender'] || '-'}</td>
                          <td className="py-2 px-4 text-sm border-r">{response['Tenure'] || '-'}</td>
                          <td className="py-2 px-4 text-sm border-r">{response['Designation/Level'] || '-'}</td>
                          <td className="py-2 px-4 text-sm border-r">{response['Age'] || '-'}</td>
                          <td className="py-2 px-4 text-sm border-r font-medium">
                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs ${
                              typeof response['Rating'] === 'number' 
                                ? response['Rating'] >= 4 ? 'bg-green-100 text-green-800' :
                                  response['Rating'] >= 3 ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {response['Rating'] || '-'}
                            </span>
                          </td>
                          <td className="py-2 px-4 text-sm border-r">{response['Process'] || '-'}</td>
                          <td className="py-2 px-4 text-sm border-r">{response['Gender of the user'] || '-'}</td>
                          <td className="py-2 px-4 text-sm border-r truncate max-w-[200px]" title={response['Management Email ID'] as string || ''}>
                            {response['Management Email ID'] || '-'}
                          </td>
                          
                          {/* Survey questions - all with consistent formatting */}
                          {[
                            'Support for personal and professional development',
                            'Feedback that contributes to skill growth',
                            'Encouragement for continuous learning - regular syncs',
                            'Clarity in discussing development goals',
                            'Availability of opportunities or resources for career growth',
                            'Comfort in career-related discussions',
                            'Clear identification of strengths and improvement areas',
                            'Clarity of goals and priorities',
                            'Timely sharing of updates',
                            'Openness to questions and clarification',
                            'Transparency in information sharing',
                            'Responsiveness to concerns',
                            'Overall communication effectiveness',
                            'Availability of support when needed',
                            'Demonstration of concern for well-being',
                            'Ease of seeking guidance',
                            'Effectiveness in resolving challenges',
                            'Support for work-life balance',
                            'Fair distribution of workload',
                            'Support in prioritizing tasks',
                            'Identification and management of overload',
                            'Encouragement to voice capacity concerns',
                            'Realistic deadlines and expectations',
                            'Clear direction for work activities',
                            'Informed and timely decisions',
                            'Confidence in leadership',
                            'Promotion of motivation and inspiration',
                            'Demonstration of leadership through actions',
                            'Regular performance feedback',
                            'Constructive and actionable feedback',
                            'Improvement through performance discussions',
                            'Recognition of achievements',
                            'Review of performance goals when needed',
                            'Fair treatment of individuals',
                            'Consistent demonstration of respect',
                            'Avoidance of favoritism',
                            'Value given to contributions and opinions',
                            'Promotion of inclusion',
                            'Encouragement of a positive work environment',
                            'Fair and timely handling of conflicts',
                            'Support for collaboration',
                            'A safe and inclusive environment',
                            'Fostering of trust',
                            'Effective handling of roadblocks',
                            'Involvement of relevant individuals in issue resolution',
                            'Encouragement of analytical thinking',
                            'Comfort in raising issues',
                            'Clarity of responsibilities',
                            'Consistency in upholding commitments',
                            'Ownership of outcomes',
                            'Overall effectiveness of leadership',
                            'Positive experience working within the current environment',
                            'Positive impact on job satisfaction'
                          ].map((question, qIndex) => {
                            const answer = response[question];
                            let displayValue = answer || '-';
                            let cellClass = 'py-2 px-4 text-sm border-r ';
                            
                            // Style based on answer type
                            if (typeof answer === 'string') {
                              if (answer.includes('Strongly')) {
                                cellClass += answer.includes('Agree') 
                                  ? 'bg-green-50 text-green-700 font-medium' 
                                  : 'bg-red-50 text-red-700 font-medium';
                              } else if (answer === 'Agree') {
                                cellClass += 'bg-green-50 text-green-700';
                              } else if (answer === 'Disagree') {
                                cellClass += 'bg-red-50 text-red-700';
                              } else if (answer === 'Neutral') {
                                cellClass += 'bg-yellow-50 text-yellow-700';
                              }
                            }
                            
                            // Truncate long answers
                            if (typeof displayValue === 'string' && displayValue.length > 30) {
                              displayValue = displayValue.substring(0, 27) + '...';
                            }
                            
                            return (
                              <td 
                                key={qIndex} 
                                className={cellClass}
                                title={typeof answer === 'string' && answer.length > 30 ? answer : undefined}
                              >
                                {displayValue}
                              </td>
                            );
                          })}
                          
                          {/* Additional Comments */}
                          <td className="py-2 px-4 text-sm">
                            {response['Additional Comments'] ? (
                              <div className="max-w-[300px]">
                                <div className="truncate" title={response['Additional Comments'] as string}>
                                  {(response['Additional Comments'] as string).substring(0, 50)}
                                  {(response['Additional Comments'] as string).length > 50 ? '...' : ''}
                                </div>
                                {(response['Additional Comments'] as string).length > 50 && (
                                  <span className="text-xs text-muted-foreground">
                                    {(response['Additional Comments'] as string).length} chars
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Enhanced pagination */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {Math.min(itemsPerPage, responses.length - (currentPage - 1) * itemsPerPage)} of {responses.length} rows
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  size="sm"
                >
                  « First
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  size="sm"
                >
                  ‹ Prev
                </Button>
                
                <div className="flex items-center px-3">
                  <input
                    type="number"
                    min="1"
                    max={totalPages}
                    value={currentPage}
                    onChange={(e) => {
                      const page = Math.max(1, Math.min(totalPages, Number(e.target.value) || 1));
                      setCurrentPage(page);
                    }}
                    className="w-12 text-center border rounded py-1 text-sm"
                  />
                  <span className="text-sm text-muted-foreground mx-1">of</span>
                  <span className="text-sm font-medium">{totalPages}</span>
                </div>
                
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  size="sm"
                >
                  Next ›
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  size="sm"
                >
                  Last »
                </Button>
              </div>
              
              <div className="text-sm text-muted-foreground">
                {itemsPerPage} rows per page
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  </div>
</TabsContent>


          <TabsContent value="reminders" className="space-y-6">
            <div className="animate-fade-in">
              <h2 className="text-2xl font-bold text-foreground mb-4">Email Reminders</h2>
              <Card>
                <CardContent className="py-12 text-center">
                  <Mail className="w-16 h-16 text-secondary mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">Send Reminders</h3>
                  <p className="text-muted-foreground mb-6">
                    {stats.totalEmployees - stats.uniqueSubmitters} employees haven't submitted feedback yet.
                  </p>
                  <Button className="vox-btn-primary">Send Email Reminders</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminPage;