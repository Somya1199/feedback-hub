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
    totalEmployees: 100, // Default value, can be updated
    leaderMeanScores: [] as Array<{ name: string; meanScore: number; totalAnswers: number }>,
    recentLogs: [] as Array<{ date: string; role: string; process: string; target: string }>,
    quarterlyData: {
      'Q1': 0,
      'Q2': 0,
      'Q3': 0,
      'Q4': 0
    }
  });

  useEffect(() => {
    if (activeTab === 'sheets' || activeTab === 'analytics') {
      loadResponsesData();
    }
  }, [activeTab]);

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

    const getMonthlyData = (responses: any[]) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyData: Record<string, number> = {};
  
  months.forEach(month => {
    monthlyData[month] = 0;
  });
  
  responses.forEach(response => {
    const dateStr = response.Timestamp || response.Date || '';
    if (dateStr) {
      try {
        const date = new Date(dateStr);
        const monthIndex = date.getMonth();
        if (monthIndex >= 0 && monthIndex < 12) {
          monthlyData[months[monthIndex]]++;
        }
      } catch (error) {
        // Skip invalid dates
      }
    }
  });
  
  return monthlyData;
};

    const leaderMeanScores = Array.from(leaderScores.entries())
      .map(([email, score]) => ({
        name: email,
        meanScore: Math.round((score.total / score.count) * 10) / 10, // 1 decimal place
        totalAnswers: score.count
      }))
      .sort((a, b) => b.meanScore - a.meanScore)
      .slice(0, 10); // Top 10 leaders

    // Calculate quarterly data (simplified - based on timestamp)
// Calculate quarterly data using the actual responses
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
      totalEmployees: 150, // This should come from mapping sheet
      leaderMeanScores,
      recentLogs,
      quarterlyData
    });
  };

  const getCurrentQuarter = (): string => {
  const month = new Date().getMonth() + 1;
  if (month <= 3) return 'Q1';
  if (month <= 6) return 'Q2';
  if (month <= 9) return 'Q3';
  return 'Q4';
};

const getCurrentQuarterCount = (responses: any[]): number => {
  const currentQuarter = getCurrentQuarter();
  const currentYear = new Date().getFullYear();
  
  return responses.filter(response => {
    const dateStr = response.Timestamp || response.Date || '';
    if (!dateStr) return false;
    
    try {
      const date = new Date(dateStr);
      const year = date.getFullYear();
      const quarter = getQuarterFromDate(dateStr);
      
      return year === currentYear && quarter === currentQuarter;
    } catch (error) {
      return false;
    }
  }).length;
};
// In your admin dashboard component, add this function:
// const getQuarterFromDate = (dateString: string): string => {
//   if (!dateString) return 'Unknown';
  
//   try {
//     const date = new Date(dateString);
    
//     // Handle different date formats
//     if (isNaN(date.getTime())) {
//       // Try parsing as MM/DD/YYYY format (from your sheet)
//       const parts = dateString.split('/');
//       if (parts.length === 3) {
//         const [month, day, year] = parts.map(part => parseInt(part, 10));
//         date.setFullYear(year, month - 1, day);
//       }
//     }
    
//     const month = date.getMonth() + 1; // getMonth() returns 0-11
    
//     if (month >= 1 && month <= 3) return 'Q1';
//     if (month >= 4 && month <= 6) return 'Q2';
//     if (month >= 7 && month <= 9) return 'Q3';
//     if (month >= 10 && month <= 12) return 'Q4';
    
//     return 'Unknown';
//   } catch (error) {
//     console.error('Error parsing date:', dateString, error);
//     return 'Unknown';
//   }
// };

  const participationRate = stats.totalEmployees > 0 
    ? Math.round((stats.uniqueSubmitters / stats.totalEmployees) * 100) 
    : 0;

    const debugQuarterCalculation = (responses: any[]) => {
  console.log('=== Quarter Calculation Debug ===');
  
  // Check first 10 responses
  responses.slice(0, 10).forEach((response, index) => {
    const dateStr = response.Timestamp || response.Date || '';
    const quarter = getQuarterFromDate(dateStr);
    console.log(`Response ${index + 1}:`, {
      date: dateStr,
      quarter: quarter,
      parsedDate: new Date(dateStr).toString()
    });
  });
  
  // Count quarters
  const quarterCounts: Record<string, number> = {};
  responses.forEach(response => {
    const dateStr = response.Timestamp || response.Date || '';
    const quarter = getQuarterFromDate(dateStr);
    quarterCounts[quarter] = (quarterCounts[quarter] || 0) + 1;
  });
  
  console.log('Quarter counts:', quarterCounts);
  console.log('Total responses:', responses.length);
  console.log('Sum of quarter counts:', Object.values(quarterCounts).reduce((a, b) => a + b, 0));
};
const getQuarterFromDate = (dateString: string): string => {
  if (!dateString || dateString.trim() === '') {
    return 'Unknown';
  }
  
  try {
    // Try to parse the date string
    let date: Date;
    
    // Handle MM/DD/YYYY HH:MM:SS format
    if (dateString.includes('/')) {
      // Remove time portion if present
      const datePart = dateString.split(' ')[0];
      const [month, day, year] = datePart.split('/').map(part => parseInt(part, 10));
      
      // Validate
      if (isNaN(month) || isNaN(day) || isNaN(year)) {
        return 'Unknown';
      }
      
      date = new Date(year, month - 1, day);
    } else {
      // Try standard Date parsing
      date = new Date(dateString);
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Unknown';
    }
    
    const month = date.getMonth() + 1; // 1-12
    
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
              {/* <p className="text-muted-foreground">Real-time data from Google Sheets</p> */}
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
            {/* <TabsTrigger value="sheets">Google Sheets Data</TabsTrigger> */}
            <TabsTrigger value="home">Dashboard</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="logs">Activity Logs</TabsTrigger>
            <TabsTrigger value="reminders">Reminders</TabsTrigger>
          </TabsList>

          <TabsContent value="sheets" className="space-y-4">
            {/* <Card>
              <CardHeader>
                <CardTitle>Google Sheets Integration</CardTitle>
                <CardDescription>
                  Real-time feedback data from your Google Sheets. Data updates automatically when the sheet changes.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SheetsDataTable />
              </CardContent>
            </Card> */}

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Connection Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span className="text-sm">Connected to Google Sheets backend</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Showing data from: {responses.length} responses
                </p>
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
                {/* <CardContent>
                  <div className="grid grid-cols-4 gap-4">
                    {Object.entries(stats.quarterlyData).map(([quarter, count]) => (
                      <div key={quarter} className="text-center p-4 bg-accent/10 rounded-xl border border-accent/30">
                        <span className="text-2xl font-bold text-secondary">{count}</span>
                        <p className="text-sm text-muted-foreground">{quarter}</p>
                      </div>
                    ))}
                  </div>
                </CardContent> */}
                {/* <CardContent>
                  <div className="grid grid-cols-4 gap-4">
                    {Object.entries(stats.monthlyData || getMonthlyData(responses)).map(([month, count]) => (
                      <div key={month} className="text-center p-4 bg-accent/10 rounded-xl border border-accent/30">
                        <span className="text-2xl font-bold text-secondary">{count}</span>
                        <p className="text-sm text-muted-foreground">{month}</p>
                      </div>
                    ))}
                  </div>
                </CardContent> */}

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
            {/* <span className="text-xs text-muted-foreground mt-1">{percentage}% of total</span> */}
          </div>
        </div>
      );
    })}
  </div>
  
  {/* Show quarter summary */}
  {/* <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
    <div className="flex items-center justify-between">
      <div>
        <h4 className="font-semibold text-blue-800">Quarter Summary</h4>
        <p className="text-sm text-blue-600">
          Total responses: {stats.totalResponses}
        </p>
      </div>of total
        <div className="text-right">
          <span className="text-2xl font-bold text-blue-700">
            {getCurrentQuarterCount(responses)}
          </span>
          <p className="text-sm text-blue-600">in {getCurrentQuarter()}</p>
        </div>
    </div>
    <div className="mt-2 text-xs text-blue-600">
      <p>Note: Percentages are based on total quarter responses</p>
    </div>
  </div> */}
</CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="animate-fade-in">
              <h2 className="text-2xl font-bold text-foreground mb-4">Analytics</h2>
              
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Participation Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <span className="text-5xl font-bold text-secondary">{participationRate}%</span>
                    <p className="text-muted-foreground mt-2">
                      {stats.uniqueSubmitters} out of {stats.totalEmployees} employees submitted.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Leader Scoreboard</CardTitle>
                </CardHeader>
                <CardContent>
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 font-medium">Leader</th>
                        <th className="text-left py-3 font-medium">Mean Score</th>
                        <th className="text-left py-3 font-medium">Responses</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.leaderMeanScores.map(leader => (
                        <tr key={leader.name} className="border-b hover:bg-muted/50">
                          <td className="py-3 font-medium">
                            {leader.name.includes('@') ? leader.name.split('@')[0] : leader.name}
                          </td>
                          <td className="py-3">
                            <span className={`font-bold ${
                              leader.meanScore >= 4 ? 'text-green-600' : 
                              leader.meanScore >= 3 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {leader.meanScore.toFixed(1)}/5
                            </span>
                          </td>
                          <td className="py-3">{leader.totalAnswers}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="logs" className="space-y-6">
            <div className="animate-fade-in">
              <h2 className="text-2xl font-bold text-foreground mb-4">Recent Activity Logs</h2>
              <Card>
                <CardContent className="pt-6">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 font-medium">Date</th>
                        <th className="text-left py-3 font-medium">Role</th>
                        <th className="text-left py-3 font-medium">Process</th>
                        <th className="text-left py-3 font-medium">Target</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recentLogs.map((log, idx) => (
                        <tr key={idx} className="border-b hover:bg-muted/50">
                          <td className="py-3">{log.date}</td>
                          <td className="py-3">{log.role}</td>
                          <td className="py-3">{log.process}</td>
                          <td className="py-3">{log.target}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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