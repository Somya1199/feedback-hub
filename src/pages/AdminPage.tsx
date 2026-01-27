import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, BarChart3, FileText, Mail, LogOut, Users, TrendingUp, AlertTriangle, RefreshCw, Loader2, Filter, CheckCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { fetchFeedbackResponses, type FeedbackResponse, fetchManagementMapping } from '@/services/sheetsApi';
import SheetsDataTable from '@/components/SheetsDataTable';
import { EmployeeMapping } from '@/services/mappingApi';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';

type AdminTab = 'home' | 'analytics' | 'logs' | 'reminders' | 'sheets';

const AdminPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  // const [activeTab, setActiveTab] = useState<AdminTab>('sheets');
  const [activeTab, setActiveTab] = useState<AdminTab>('home');
  const [responses, setResponses] = useState<FeedbackResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [employeeMappings, setEmployeeMappings] = useState<EmployeeMapping[]>([]);
  const [mappingLoading, setMappingLoading] = useState(false);
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
      'Q4': 0,
      // 'Unknown': 0  // Add Unknown here
    }
  });

  // Analytics state
  const [selectedLeader, setSelectedLeader] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  // Add these to your existing filter state
  const [globalFilters, setGlobalFilters] = useState({
    client: '',
    process: '',
    accountManager: ''
  });

  // Filter state
  const [filters, setFilters] = useState({
    role: '',
    gender: '',
    tenure: '',
    designation: '',
    age: '',
    rating: '',
    process: '',
    genderOfUser: '',
    managementEmail: '',
    timePeriod: ''
  });

  useEffect(() => {
    if (activeTab === 'sheets' || activeTab === 'analytics' || activeTab === 'home') {
      loadAllData();
    }
  }, [activeTab]);

  // Reset to page 1 when items per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Function to load both responses and mapping data
  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadResponsesData(),
        loadEmployeeMappings()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadEmployeeMappings = async () => {
    setMappingLoading(true);
    try {
      const result = await fetchManagementMapping();
      console.log('Mapping data result:', result);

      if (result.success && result.data) {
        // Transform the mapping data to EmployeeMapping format
        const transformedMappings = transformMappingData(result.data);
        console.log('Transformed mappings:', transformedMappings);

        setEmployeeMappings(transformedMappings);

        // Update stats with actual employee count
        setStats(prev => ({
          ...prev,
          totalEmployees: transformedMappings.length
        }));

        toast({
          title: 'Employee Data Loaded',
          description: `Loaded ${transformedMappings.length} employee records`,
        });
      } else {
        toast({
          title: 'Warning',
          description: result.error || 'Failed to load employee mapping data',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error loading employee mappings:', error);
      toast({
        title: 'Warning',
        description: 'Could not load employee mapping data',
        variant: 'destructive',
      });
    } finally {
      setMappingLoading(false);
    }
  };

  // Function to transform mapping data
  // const transformMappingData = (data: any[]): EmployeeMapping[] => {
  //   if (!data || data.length === 0) {
  //     return [];
  //   }

  //   console.log('Transforming mapping data, rows:', data.length);

  //   // Create a set to track unique employees by email
  //   const uniqueEmployees = new Map<string, EmployeeMapping>();

  //   data.forEach((row, index) => {
  //     // Look for LDAP/email fields in different possible formats
  //     const ldap = row.Ldap || row.ldap || row['LDAP'] || row['Ldap '] || '';
  //     const email = row.Email || row.email || row['Email '] || row['email '] || '';

  //     if ((ldap && typeof ldap === 'string' && ldap.trim() !== '') ||
  //       (email && typeof email === 'string' && email.includes('@'))) {

  //       const employeeKey = email.toLowerCase() || ldap.toLowerCase();

  //       if (!uniqueEmployees.has(employeeKey)) {
  //         uniqueEmployees.set(employeeKey, {
  //           Email: email || `${ldap.toLowerCase()}@company.com`,
  //           Ldap: ldap || email.split('@')[0] || `Employee-${index + 1}`,
  //           Process: row.Process || row.process || row['Process '] || 'Unknown',
  //           POC: row.POC || row.poc || '',
  //           Manager: row.Manager || row.manager || '',
  //           AccountManager: row['Account manager'] || row.AccountManager || row['Account Manager'] || ''
  //         });
  //       }
  //     }
  //   });

  //   const result = Array.from(uniqueEmployees.values());
  //   console.log(`Transformed ${data.length} rows to ${result.length} unique employees`);

  //   // Log first few employees for debugging
  //   if (result.length > 0) {
  //     console.log('Sample employees (first 3):');
  //     result.slice(0, 3).forEach((emp, i) => {
  //       console.log(`${i + 1}. LDAP: ${emp.Ldap}, Email: ${emp.Email}, Process: ${emp.Process}`);
  //     });
  //   }

  //   return result;
  // };
  // Update the transformMappingData function to include Client
  // const transformMappingData = (data: any[]): EmployeeMapping[] => {
  //   if (!data || data.length === 0) {
  //     return [];
  //   }

  //   console.log('Transforming mapping data, rows:', data.length);

  //   // Create a set to track unique employees by email
  //   const uniqueEmployees = new Map<string, EmployeeMapping>();

  //   data.forEach((row, index) => {
  //     // Look for LDAP/email fields in different possible formats
  //     const ldap = row.Ldap || row.ldap || row['LDAP'] || row['Ldap '] || '';
  //     const email = row.Email || row.email || row['Email '] || row['email '] || '';

  //     if ((ldap && typeof ldap === 'string' && ldap.trim() !== '') ||
  //       (email && typeof email === 'string' && email.includes('@'))) {

  //       const employeeKey = email.toLowerCase() || ldap.toLowerCase();

  //       if (!uniqueEmployees.has(employeeKey)) {
  //         uniqueEmployees.set(employeeKey, {
  //           Email: email || `${ldap.toLowerCase()}@company.com`,
  //           Ldap: ldap || email.split('@')[0] || `Employee-${index + 1}`,
  //           Process: row.Process || row.process || row['Process '] || 'Unknown',
  //           POC: row.POC || row.poc || '',
  //           Manager: row.Manager || row.manager || '',
  //           AccountManager: row['Account manager'] || row.AccountManager || row['Account Manager'] || '',
  //           Client: row.Client || row.client || row['Client '] || '' // Add Client field
  //         });
  //       }
  //     }
  //   });

  //   const result = Array.from(uniqueEmployees.values());
  //   console.log(`Transformed ${data.length} rows to ${result.length} unique employees`);

  //   // Log first few employees for debugging
  //   if (result.length > 0) {
  //     console.log('Sample employees (first 3):');
  //     result.slice(0, 3).forEach((emp, i) => {
  //       console.log(`${i + 1}. LDAP: ${emp.Ldap}, Email: ${emp.Email}, Process: ${emp.Process}, Client: ${emp.Client}`);
  //     });
  //   }

  //   return result;
  // };

  const transformMappingData = (data: any[]): EmployeeMapping[] => {
    if (!data || data.length === 0) {
      return [];
    }

    const uniqueEmployees = new Map<string, EmployeeMapping>();

    data.forEach((row, index) => {
      const ldap = row.Ldap || row.ldap || row['LDAP'] || row['Ldap '] || '';
      const email = row.Email || row.email || row['Email '] || row['email '] || '';

      if ((ldap && typeof ldap === 'string' && ldap.trim() !== '') ||
        (email && typeof email === 'string' && email.includes('@'))) {

        const employeeKey = email.toLowerCase() || ldap.toLowerCase();

        if (!uniqueEmployees.has(employeeKey)) {
          uniqueEmployees.set(employeeKey, {
            Email: email || `${ldap.toLowerCase()}@company.com`,
            Ldap: ldap || email.split('@')[0] || `Employee-${index + 1}`,
            Process: row.Process || row.process || row['Process '] || 'Unknown',
            POC: row.POC || row.poc || '',
            Manager: row.Manager || row.manager || '',
            AccountManager: row['Account manager'] || row.AccountManager || row['Account Manager'] || '',
            Client: row.Client || row.client || row['Client '] || '',
            Gender: row.Gender || row.gender || row['Gender '] || 'Unknown' // Add this
          });
        }
      }
    });

    return Array.from(uniqueEmployees.values());
  };
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

  // const loadResponsesData = async () => {
  //   setLoading(true);
  //   try {
  //     const result = await fetchFeedbackResponses();
  //     if (result.success && result.data) {
  //       setResponses(result.data);
  //       calculateStats(result.data);
  //       toast({
  //         title: 'Data Loaded',
  //         description: `Fetched ${result.data.length} responses from Google Sheets`,
  //       });
  //     } else {
  //       toast({
  //         title: 'Error',
  //         description: result.error || 'Failed to load data',
  //         variant: 'destructive',
  //       });
  //     }
  //   } catch (error) {
  //     console.error('Error loading responses:', error);
  //     toast({
  //       title: 'Error',
  //       description: 'Failed to connect to backend',
  //       variant: 'destructive',
  //     });
  //   } finally {
  //     setLoading(false);
  //   }
  // };
  // Add this function inside your component
  const getRespondingEmployees = (): Set<string> => {
    const respondingEmployees = new Set<string>();

    if (!employeeMappings.length || !responses.length) {
      return respondingEmployees;
    }

    // Create a map of email parts to employee emails for faster lookup
    const emailPartsMap = new Map<string, string>();

    employeeMappings.forEach(emp => {
      const email = (emp.Email as string || '').toLowerCase().trim();
      if (email && email.includes('@')) {
        const localPart = email.split('@')[0];
        const domainPart = email.split('@')[1];

        // Store multiple ways to match
        emailPartsMap.set(email, email);
        emailPartsMap.set(localPart, email);

        // Also store common variations
        if (localPart.includes('.')) {
          const withoutDots = localPart.replace(/\./g, '');
          emailPartsMap.set(withoutDots, email);
        }

        // Store first 5-10 characters as potential hash components
        for (let i = 5; i <= Math.min(10, localPart.length); i++) {
          emailPartsMap.set(localPart.substring(0, i), email);
        }
      }
    });

    // Check each response's submitter ID
    responses.forEach(response => {
      const submitterId = (response['Encrypted Submitter ID'] as string || '').toLowerCase().trim();
      if (!submitterId || submitterId.length < 5) return;

      // Try exact match first
      if (emailPartsMap.has(submitterId)) {
        respondingEmployees.add(emailPartsMap.get(submitterId)!);
        return;
      }

      // Try partial matches
      for (const [key, email] of emailPartsMap.entries()) {
        if (submitterId.includes(key) || key.includes(submitterId)) {
          respondingEmployees.add(email);
          break;
        }
      }
    });

    return respondingEmployees;
  };

  const emailToName = (email: string) => {
    if (!email || !email.includes('@')) return email;

    const namePart = email.split('@')[0];
    return namePart
      .split(/[._]/)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  };

  // First, update the loadResponsesData function to enrich responses with client data:
  // const loadResponsesData = async () => {
  //   setLoading(true);
  //   try {
  //     const result = await fetchFeedbackResponses();
  //     if (result.success && result.data) {
  //       // Enrich responses with client data from mappings
  //       const enrichedResponses = result.data.map(response => {
  //         const responseWithClient = { ...response };
  //         const managementEmail = (response['Management Email ID'] as string || '').toLowerCase().trim();
  //         const responseProcess = (response['Process'] as string || '').toLowerCase().trim();

  //         // Try to find matching employee
  //         const matchingEmployee = employeeMappings.find(emp => {
  //           const empEmail = (emp.Email as string || '').toLowerCase().trim();
  //           const empProcess = (emp.Process as string || '').toLowerCase().trim();

  //           // Try email match first
  //           if (managementEmail && empEmail && managementEmail === empEmail) {
  //             return true;
  //           }

  //           // Try process match as fallback
  //           if (responseProcess && empProcess && responseProcess === empProcess) {
  //             return true;
  //           }

  //           return false;
  //         });

  //         // Add client to response if found
  //         if (matchingEmployee && matchingEmployee.Client) {
  //           responseWithClient['Client'] = matchingEmployee.Client;
  //         }

  //         return responseWithClient;
  //       });

  //       setResponses(enrichedResponses);
  //       calculateStats(enrichedResponses);
  //       toast({
  //         title: 'Data Loaded',
  //         description: `Fetched ${enrichedResponses.length} responses from Google Sheets`,
  //       });
  //     } else {
  //       toast({
  //         title: 'Error',
  //         description: result.error || 'Failed to load data',
  //         variant: 'destructive',
  //       });
  //     }
  //   } catch (error) {
  //     console.error('Error loading responses:', error);
  //     toast({
  //       title: 'Error',
  //       description: 'Failed to connect to backend',
  //       variant: 'destructive',
  //     });
  //   } finally {
  //     setLoading(false);
  //   }
  // };
  const loadResponsesData = async () => {
  setLoading(true);
  try {
    const result = await fetchFeedbackResponses();
    if (result.success && result.data) {
      // Enrich responses with client data from mappings
      const enrichedResponses = result.data.map(response => {
        const responseWithClient = { ...response };
        const managementEmail = (response['Management Email ID'] as string || '').toLowerCase().trim();
        const responseProcess = (response['Process'] as string || '').toLowerCase().trim();

        // Try to find matching employee by multiple methods
        let matchingEmployee = null;

        if (managementEmail) {
          // 1. Try exact email match
          matchingEmployee = employeeMappings.find(emp => {
            const empEmail = (emp.Email as string || '').toLowerCase().trim();
            return empEmail === managementEmail;
          });

          // 2. Try partial email match (without domain)
          if (!matchingEmployee && managementEmail.includes('@')) {
            const emailLocalPart = managementEmail.split('@')[0];
            matchingEmployee = employeeMappings.find(emp => {
              const empEmail = (emp.Email as string || '').toLowerCase().trim();
              if (empEmail.includes('@')) {
                const empLocalPart = empEmail.split('@')[0];
                return empLocalPart === emailLocalPart;
              }
              return false;
            });
          }
        }

        // 3. Try process match as fallback
        if (!matchingEmployee && responseProcess) {
          matchingEmployee = employeeMappings.find(emp => {
            const empProcess = (emp.Process as string || '').toLowerCase().trim();
            return empProcess === responseProcess;
          });
        }

        // Add client to response if found
        if (matchingEmployee && matchingEmployee.Client) {
          responseWithClient['Client'] = matchingEmployee.Client;
        } else {
          responseWithClient['Client'] = 'Unknown'; // Default value
        }

        return responseWithClient;
      });

      setResponses(enrichedResponses);
      calculateStats(enrichedResponses);
      toast({
        title: 'Data Loaded',
        description: `Fetched ${enrichedResponses.length} responses from Google Sheets`,
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

    setStats(prev => ({
      ...prev,
      uniqueSubmitters: uniqueEmails.size,
      totalResponses: data.length,
      leaderMeanScores,
      recentLogs,
      quarterlyData
    }));
  };

  // const calculateQuarterlyData = (responses: any[]) => {
  //   const quarterlyData = {
  //     Q1: 0,
  //     Q2: 0,
  //     Q3: 0,
  //     Q4: 0,
  //     Unknown: 0
  //   };

  //   responses.forEach(response => {
  //     const quarter = getQuarterFromDate(response.Timestamp || response.Date || '');
  //     if (quarterlyData.hasOwnProperty(quarter)) {
  //       quarterlyData[quarter as keyof typeof quarterlyData]++;
  //     } else {
  //       quarterlyData.Unknown++;
  //     }
  //   });

  //   return quarterlyData;
  // };
  const calculateQuarterlyData = (responses: any[]) => {
    const quarterlyData = {
      Q1: 0,
      Q2: 0,
      Q3: 0,
      Q4: 0,
      // Unknown: 0
    };

    responses.forEach(response => {
      const quarter = getQuarterFromDate(response.Timestamp || response.Date || '');
      if (quarterlyData.hasOwnProperty(quarter)) {
        quarterlyData[quarter as keyof typeof quarterlyData]++;
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
  const calculateFilteredTimePeriodCount = (period: 'week' | 'month' | 'quarter') => {
    const filteredResponses = getFilteredResponses();
    if (!filteredResponses.length) return 0;

    const now = new Date();
    const startDate = new Date();

    switch (period) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
    }

    return filteredResponses.filter(response => {
      const timestamp = response.Timestamp as string;
      if (!timestamp) return false;

      try {
        const responseDate = new Date(timestamp);
        // Handle invalid dates
        if (isNaN(responseDate.getTime())) return false;
        return responseDate >= startDate && responseDate <= now;
      } catch {
        return false;
      }
    }).length;
  };
  // const getFilteredResponses = (): FeedbackResponse[] => {
  //   if (!responses.length) return [];

  //   const filteredMappings = getFilteredEmployeeMappings();
  //   if (!filteredMappings.length && !globalFilters.accountManager) {
  //     return responses; // No filters applied
  //   }

  //   return responses.filter(response => {
  //     const submitterId = (response['Encrypted Submitter ID'] as string || '').toLowerCase().trim();
  //     const managementEmail = (response['Management Email ID'] as string || '').toLowerCase().trim();
  //     const responseProcess = (response['Process'] as string || '').toLowerCase().trim();

  //     // 1. Check if submitter matches any filtered employee
  //     let matchesEmployee = false;
  //     let matchesAccountManager = false;
  //     let matchesProcess = false;

  //     // Check against employee mappings
  //     if (filteredMappings.length > 0) {
  //       for (const emp of filteredMappings) {
  //         const empEmail = (emp.Email as string || '').toLowerCase().trim();
  //         const empLdap = (emp.Ldap as string || '').toLowerCase().trim();
  //         const empAccountManager = (emp.AccountManager as string || '').toLowerCase().trim();
  //         const empProcess = (emp.Process as string || '').toLowerCase().trim();

  //         // Check if submitter ID contains email or ldap
  //         if (empEmail && submitterId.includes(empEmail)) {
  //           matchesEmployee = true;
  //           break;
  //         }
  //         if (empLdap && submitterId.includes(empLdap)) {
  //           matchesEmployee = true;
  //           break;
  //         }
  //         // Check if email matches without domain
  //         if (empEmail.includes('@')) {
  //           const emailLocalPart = empEmail.split('@')[0];
  //           if (submitterId.includes(emailLocalPart)) {
  //             matchesEmployee = true;
  //             break;
  //           }
  //         }
  //       }
  //     }

  //     // 2. Check if management email matches account manager filter
  //     if (globalFilters.accountManager) {
  //       const filterAccountManager = globalFilters.accountManager.toLowerCase();

  //       // Direct match
  //       if (managementEmail === filterAccountManager) {
  //         matchesAccountManager = true;
  //       }

  //       // Check if any employee in filtered mappings has this account manager
  //       if (filteredMappings.length > 0) {
  //         const matchingEmployee = filteredMappings.find(emp => {
  //           const empAccountManager = (emp.AccountManager as string || '').toLowerCase().trim();
  //           return empAccountManager === filterAccountManager;
  //         });
  //         if (matchingEmployee) {
  //           matchesAccountManager = true;
  //         }
  //       }
  //     } else {
  //       matchesAccountManager = true; // No account manager filter
  //     }

  //     // 3. Check process filter
  //     if (globalFilters.process) {
  //       const filterProcess = globalFilters.process.toLowerCase();
  //       matchesProcess = responseProcess === filterProcess;

  //       // Also check if any filtered employee has this process
  //       if (!matchesProcess && filteredMappings.length > 0) {
  //         const matchingEmployee = filteredMappings.find(emp => {
  //           const empProcess = (emp.Process as string || '').toLowerCase().trim();
  //           return empProcess === filterProcess;
  //         });
  //         if (matchingEmployee) {
  //           matchesProcess = true;
  //         }
  //       }
  //     } else {
  //       matchesProcess = true; // No process filter
  //     }

  //     // Return true if:
  //     // - We have employee matches OR no employee filters
  //     // - AND account manager matches OR no account manager filter
  //     // - AND process matches OR no process filter
  //     const hasEmployeeFilters = filteredMappings.length > 0 || globalFilters.client;
  //     const employeeCondition = !hasEmployeeFilters || matchesEmployee;
  //     const accountManagerCondition = !globalFilters.accountManager || matchesAccountManager;
  //     const processCondition = !globalFilters.process || matchesProcess;

  //     return employeeCondition && accountManagerCondition && processCondition;
  //   });
  // };

  //   const getFilteredResponses = (): FeedbackResponse[] => {
  //   if (!responses.length) return [];

  //   // If no global filters are applied, return all responses
  //   if (!globalFilters.client && !globalFilters.process && !globalFilters.accountManager) {
  //     return responses;
  //   }

  //   return responses.filter(response => {
  //     const responseProcess = (response['Process'] as string || '').toLowerCase().trim();
  //     const managementEmail = (response['Management Email ID'] as string || '').toLowerCase().trim();

  //     // Check process filter
  //     if (globalFilters.process && responseProcess !== globalFilters.process.toLowerCase()) {
  //       return false;
  //     }

  //     // Check account manager filter - compare with management email
  //     if (globalFilters.accountManager) {
  //       const filterAccountManager = globalFilters.accountManager.toLowerCase();
  //       if (managementEmail !== filterAccountManager) {
  //         return false;
  //       }
  //     }

  //     // Note: Client filter cannot be applied as there's no client field in response sheet
  //     // Unless you add it to the response sheet

  //     return true;
  //   });
  // };

  // const getFilteredResponses = (): FeedbackResponse[] => {
  //   if (!responses.length) return [];

  //   // If no global filters are applied, return all responses
  //   if (!globalFilters.process && !globalFilters.accountManager) {
  //     return responses;
  //   }

  //   return responses.filter(response => {
  //     const responseProcess = (response['Process'] as string || '').toLowerCase().trim();
  //     const managementEmail = (response['Management Email ID'] as string || '').toLowerCase().trim();

  //     // Check process filter
  //     if (globalFilters.process && responseProcess !== globalFilters.process.toLowerCase()) {
  //       return false;
  //     }

  //     // Check account manager filter - compare with management email
  //     if (globalFilters.accountManager) {
  //       const filterAccountManager = globalFilters.accountManager.toLowerCase();
  //       if (managementEmail !== filterAccountManager) {
  //         return false;
  //       }
  //     }

  //     return true;
  //   });
  // };

  // const getFilteredResponses = (): FeedbackResponse[] => {
  //   if (!responses.length) return [];

  //   // Get filtered employee mappings first
  //   const filteredEmployeeMappings = getFilteredEmployeeMappings();

  //   // If no filters are applied, return all responses
  //   if (!globalFilters.client && !globalFilters.process && !globalFilters.accountManager) {
  //     return responses;
  //   }

  //   return responses.filter(response => {
  //     const responseProcess = (response['Process'] as string || '').toLowerCase().trim();
  //     const managementEmail = (response['Management Email ID'] as string || '').toLowerCase().trim();

  //     // Check process filter
  //     if (globalFilters.process && responseProcess !== globalFilters.process.toLowerCase()) {
  //       return false;
  //     }

  //     // Check account manager filter - compare with management email
  //     if (globalFilters.accountManager) {
  //       const filterAccountManager = globalFilters.accountManager.toLowerCase();
  //       if (managementEmail !== filterAccountManager) {
  //         return false;
  //       }
  //     }

  //     // Check client filter - this requires matching the submitter to an employee in the filtered mappings
  //     if (globalFilters.client && filteredEmployeeMappings.length > 0) {
  //       const submitterId = (response['Encrypted Submitter ID'] as string || '').toLowerCase().trim();

  //       // Try to match the submitter with employees in the filtered mappings
  //       const submitterMatchesClient = filteredEmployeeMappings.some(emp => {
  //         const empEmail = (emp.Email as string || '').toLowerCase().trim();
  //         const empLdap = (emp.Ldap as string || '').toLowerCase().trim();

  //         // Check various matching patterns
  //         if (empEmail && submitterId.includes(empEmail)) return true;
  //         if (empLdap && submitterId.includes(empLdap)) return true;

  //         // Check email local part
  //         if (empEmail.includes('@')) {
  //           const emailLocalPart = empEmail.split('@')[0];
  //           if (submitterId.includes(emailLocalPart)) return true;
  //         }

  //         return false;
  //       });

  //       if (!submitterMatchesClient) return false;
  //     }

  //     return true;
  //   });
  // };
  // const getFilteredResponses = (): FeedbackResponse[] => {
  //   if (!responses.length) return [];

  //   // If no global filters are applied, return all responses
  //   if (!globalFilters.client && !globalFilters.process && !globalFilters.accountManager) {
  //     return responses;
  //   }

  //   return responses.filter(response => {
  //     const responseProcess = (response['Process'] as string || '').toLowerCase().trim();
  //     const managementEmail = (response['Management Email ID'] as string || '').toLowerCase().trim();

  //     // Check process filter
  //     if (globalFilters.process && responseProcess !== globalFilters.process.toLowerCase()) {
  //       return false;
  //     }

  //     // Check account manager filter - compare with management email
  //     if (globalFilters.accountManager) {
  //       const filterAccountManager = globalFilters.accountManager.toLowerCase();
  //       if (managementEmail !== filterAccountManager) {
  //         return false;
  //       }
  //     }

  //     // Check client filter - this is tricky because we can't directly match encrypted IDs
  //     // We'll need to use a different approach
  //     if (globalFilters.client) {
  //       // Get filtered employee mappings for this client
  //       const clientFilteredEmployees = employeeMappings.filter(emp => 
  //         emp.Client === globalFilters.client
  //       );

  //       // If no employees for this client, return no responses
  //       if (clientFilteredEmployees.length === 0) {
  //         return false;
  //       }

  //       // Try to match the response with any employee from this client
  //       // We can try matching by process or other available fields
  //       const responseMatchesClient = clientFilteredEmployees.some(emp => {
  //         // Try matching by process if available in both
  //         const empProcess = (emp.Process as string || '').toLowerCase().trim();
  //         if (responseProcess && empProcess && responseProcess === empProcess) {
  //           return true;
  //         }

  //         // Try matching by management email if available
  //         const empEmail = (emp.Email as string || '').toLowerCase().trim();
  //         if (managementEmail && empEmail && managementEmail === empEmail) {
  //           return true;
  //         }

  //         // If there's a POC or Manager field that might match
  //         const empPOC = (emp.POC as string || '').toLowerCase().trim();
  //         const empManager = (emp.Manager as string || '').toLowerCase().trim();

  //         // Check if management email matches POC or Manager
  //         if (managementEmail && (managementEmail === empPOC || managementEmail === empManager)) {
  //           return true;
  //         }

  //         return false;
  //       });

  //       if (!responseMatchesClient) return false;
  //     }

  //     return true;
  //   });
  // };
  // const getFilteredResponses = (): FeedbackResponse[] => {
  //   if (!responses.length) return [];

  //   // If no global filters are applied, return all responses
  //   if (!globalFilters.client && !globalFilters.process && !globalFilters.accountManager) {
  //     return responses;
  //   }

  //   return responses.filter(response => {
  //     const responseProcess = (response['Process'] as string || '').toLowerCase().trim();
  //     const managementEmail = (response['Management Email ID'] as string || '').toLowerCase().trim();
  //     const responseClient = (response['Client'] as string || '').toLowerCase().trim();

  //     // Check process filter
  //     if (globalFilters.process && responseProcess !== globalFilters.process.toLowerCase()) {
  //       return false;
  //     }

  //     // Check account manager filter - compare with management email
  //     if (globalFilters.accountManager) {
  //       const filterAccountManager = globalFilters.accountManager.toLowerCase();
  //       if (managementEmail !== filterAccountManager) {
  //         return false;
  //       }
  //     }

  //     // Check client filter
  //     if (globalFilters.client && responseClient !== globalFilters.client.toLowerCase()) {
  //       return false;
  //     }

  //     return true;
  //   });
  // };
  const getFilteredResponses = (): FeedbackResponse[] => {
  if (!responses.length) return [];

  // If no global filters are applied, return all responses
  if (!globalFilters.client && !globalFilters.process && !globalFilters.accountManager) {
    return responses;
  }

  return responses.filter(response => {
    const responseProcess = (response['Process'] as string || '').toLowerCase().trim();
    const managementEmail = (response['Management Email ID'] as string || '').toLowerCase().trim();
    const responseClient = (response['Client'] as string || '').toLowerCase().trim();

    // Debug logging
    console.log('Filtering response:', {
      responseClient,
      filterClient: globalFilters.client,
      process: responseProcess,
      filterProcess: globalFilters.process,
      email: managementEmail,
      filterAccountManager: globalFilters.accountManager
    });

    // Check process filter
    if (globalFilters.process && responseProcess !== globalFilters.process.toLowerCase()) {
      return false;
    }

    // Check account manager filter
    if (globalFilters.accountManager) {
      const filterAccountManager = globalFilters.accountManager.toLowerCase();
      if (managementEmail !== filterAccountManager) {
        return false;
      }
    }

    // Check client filter
    if (globalFilters.client) {
      const filterClient = globalFilters.client.toLowerCase();
      
      // Check if response has client data
      if (!responseClient || responseClient === 'unknown') {
        // Try to find client dynamically if not in response
        const matchingEmployee = employeeMappings.find(emp => {
          const empEmail = (emp.Email as string || '').toLowerCase().trim();
          const empProcess = (emp.Process as string || '').toLowerCase().trim();
          
          // Try email match
          if (managementEmail && empEmail && managementEmail === empEmail) {
            return true;
          }
          
          // Try process match
          if (responseProcess && empProcess && responseProcess === empProcess) {
            return true;
          }
          
          return false;
        });
        
        // Check if matching employee has the filtered client
        if (matchingEmployee) {
          const empClient = (matchingEmployee.Client as string || '').toLowerCase().trim();
          if (empClient !== filterClient) {
            return false;
          }
        } else {
          // No matching employee found
          return false;
        }
      } else if (responseClient !== filterClient) {
        // Response has client data but doesn't match filter
        return false;
      }
    }

    return true;
  });
};
  // const getFilteredEmployeeMappings = (): EmployeeMapping[] => {
  //   if (!employeeMappings.length) return [];

  //   return employeeMappings.filter(emp => {
  //     // Client filter
  //     if (globalFilters.client && emp.Client !== globalFilters.client) return false;

  //     // Process filter
  //     if (globalFilters.process && emp.Process !== globalFilters.process) return false;

  //     return true;
  //   });
  // };
  // const getFilteredEmployeeMappings = (): EmployeeMapping[] => {
  //   if (!employeeMappings.length) return [];

  //   return employeeMappings.filter(emp => {
  //     // Client filter
  //     if (globalFilters.client && emp.Client !== globalFilters.client) return false;

  //     // Process filter
  //     if (globalFilters.process && emp.Process !== globalFilters.process) return false;

  //     // Note: Account Manager filter is handled differently in getFilteredResponses
  //     return true;
  //   });
  // };
  const getFilteredEmployeeMappings = (): EmployeeMapping[] => {
    if (!employeeMappings.length) return [];

    return employeeMappings.filter(emp => {
      // Client filter
      if (globalFilters.client && emp.Client !== globalFilters.client) return false;

      // Process filter
      if (globalFilters.process && emp.Process !== globalFilters.process) return false;

      return true;
    });
  };
  const filterResponses = (responses: FeedbackResponse[]) => {
    return responses.filter(response => {
      // Role filter
      if (filters.role && response['Role Reviewed'] !== filters.role) return false;

      // Gender filter
      if (filters.gender && response['Gender'] !== filters.gender) return false;

      // Tenure filter
      if (filters.tenure) {
        const tenureValue = response['Tenure'];
        if (tenureValue) {
          try {
            const tenureNum = typeof tenureValue === 'string'
              ? parseFloat(tenureValue.replace(/[^0-9.]/g, ''))
              : Number(tenureValue);

            if (!isNaN(tenureNum)) {
              if (filters.tenure === '0-1' && tenureNum >= 1) return false;
              if (filters.tenure === '1-3' && (tenureNum < 1 || tenureNum >= 3)) return false;
              if (filters.tenure === '3-5' && (tenureNum < 3 || tenureNum >= 5)) return false;
              if (filters.tenure === '5+' && tenureNum < 5) return false;
              if (filters.tenure === 'unknown' && !isNaN(tenureNum)) return false;
            } else if (filters.tenure !== 'unknown') {
              return false;
            }
          } catch {
            if (filters.tenure !== 'unknown') return false;
          }
        } else if (filters.tenure !== 'unknown') {
          return false;
        }
      }

      // Designation filter
      if (filters.designation && response['Designation/Level'] !== filters.designation) return false;

      // Age filter
      if (filters.age && response['Age'] !== filters.age) return false;

      // Rating filter
      if (filters.rating) {
        const rating = response['Rating'];
        const ratingNum = typeof rating === 'string' ? parseFloat(rating) : Number(rating);
        if (isNaN(ratingNum) || ratingNum !== Number(filters.rating)) return false;
      }

      // Process filter
      if (filters.process && response['Process'] !== filters.process) return false;

      // Gender of user filter
      if (filters.genderOfUser && response['Gender of the user'] !== filters.genderOfUser) return false;

      // Management email filter
      if (filters.managementEmail && response['Management Email ID'] !== filters.managementEmail) return false;

      // Time period filter
      if (filters.timePeriod && response['Timestamp']) {
        const responseDate = new Date(response['Timestamp'] as string);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        switch (filters.timePeriod) {
          case 'today':
            const responseDay = new Date(responseDate.getFullYear(), responseDate.getMonth(), responseDate.getDate());
            if (responseDay.getTime() !== today.getTime()) return false;
            break;
          case 'week':
            const weekAgo = new Date(today);
            weekAgo.setDate(today.getDate() - 7);
            if (responseDate < weekAgo) return false;
            break;
          case 'month':
            const monthAgo = new Date(today);
            monthAgo.setMonth(today.getMonth() - 1);
            if (responseDate < monthAgo) return false;
            break;
          case 'quarter':
            const quarterAgo = new Date(today);
            quarterAgo.setMonth(today.getMonth() - 3);
            if (responseDate < quarterAgo) return false;
            break;
          case 'year':
            const yearAgo = new Date(today);
            yearAgo.setFullYear(today.getFullYear() - 1);
            if (responseDate < yearAgo) return false;
            break;
        }
      }

      return true;
    });
  };

  const filteredResponses = filterResponses(responses);
  const totalPages = Math.ceil(filteredResponses.length / itemsPerPage);
  const currentLogs = filteredResponses
    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const participationRate = stats.totalEmployees > 0
    ? Math.round((stats.uniqueSubmitters / stats.totalEmployees) * 100)
    : 0;

  const refreshAnalytics = () => {
    loadAllData();
    toast({
      title: 'Analytics Refreshed',
      description: 'Analytics data has been updated',
    });
  };

  // Calculate pending users
  const pendingUsers = employeeMappings.length > 0
    ? Math.max(0, employeeMappings.length - stats.uniqueSubmitters)
    : 0;

  // Calculate actual participation rate based on mapping data
  const actualParticipationRate = employeeMappings.length > 0
    ? Math.round((stats.uniqueSubmitters / employeeMappings.length) * 100)
    : 0;

  // Analytics calculation functions - ALL THESE REMAIN UNCHANGED
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
      let totalRatingSum = 0;
      let feedbacksWithQuestions = 0;

      // For FEEDBACK distribution (categorizing each feedback based on its average)
      let sdFeedbackCount = 0, dFeedbackCount = 0, nFeedbackCount = 0, aFeedbackCount = 0, saFeedbackCount = 0;

      // For QUESTION analysis
      let totalQuestions = 0;
      let sdQuestionCount = 0, dQuestionCount = 0, nQuestionCount = 0, aQuestionCount = 0, saQuestionCount = 0;

      leader.feedbacks.forEach(feedback => {
        let feedbackTotal = 0;
        let feedbackQuestionCount = 0;

        // Count question responses
        let questionSd = 0, questionD = 0, questionN = 0, questionA = 0, questionSa = 0;

        Object.values(feedback).forEach(value => {
          if (typeof value === 'string') {
            switch (value) {
              case 'Strongly Disagree':
                feedbackTotal += 1;
                feedbackQuestionCount++;
                questionSd++;
                break;
              case 'Disagree':
                feedbackTotal += 2;
                feedbackQuestionCount++;
                questionD++;
                break;
              case 'Neutral':
                feedbackTotal += 3;
                feedbackQuestionCount++;
                questionN++;
                break;
              case 'Agree':
                feedbackTotal += 4;
                feedbackQuestionCount++;
                questionA++;
                break;
              case 'Strongly Agree':
                feedbackTotal += 5;
                feedbackQuestionCount++;
                questionSa++;
                break;
            }
          }
        });

        // Add to question totals
        if (feedbackQuestionCount > 0) {
          totalQuestions += feedbackQuestionCount;
          sdQuestionCount += questionSd;
          dQuestionCount += questionD;
          nQuestionCount += questionN;
          aQuestionCount += questionA;
          saQuestionCount += questionSa;

          // Calculate average for this feedback
          const avgForFeedback = feedbackTotal / feedbackQuestionCount;
          totalRatingSum += avgForFeedback;
          feedbacksWithQuestions++;

          // DEBUG: Log for troubleshooting
          console.log(`Feedback for ${leader.email}:`, {
            total: feedbackTotal,
            count: feedbackQuestionCount,
            avg: avgForFeedback,
            saQuestions: questionSa,
            sdQuestions: questionSd
          });

          // CATEGORIZE this FEEDBACK based on its AVERAGE score
          // This is the critical logic for feedback distribution
          if (avgForFeedback >= 4.5) {
            saFeedbackCount++; // Average rating 4.5-5.0 = Strongly Agree feedback
          } else if (avgForFeedback >= 3.5) {
            aFeedbackCount++; // Average rating 3.5-4.49 = Agree feedback
          } else if (avgForFeedback >= 2.5) {
            nFeedbackCount++; // Average rating 2.5-3.49 = Neutral feedback
          } else if (avgForFeedback >= 1.5) {
            dFeedbackCount++; // Average rating 1.5-2.49 = Disagree feedback
          } else {
            sdFeedbackCount++; // Average rating 1.0-1.49 = Strongly Disagree feedback
          }
        }
      });

      const totalFeedbacks = leader.feedbacks.length;
      const avgScore = feedbacksWithQuestions > 0 ? totalRatingSum / feedbacksWithQuestions : 0;

      // Calculate FEEDBACK percentages
      const saFeedbackPercent = totalFeedbacks > 0 ? (saFeedbackCount / totalFeedbacks) * 100 : 0;
      const aFeedbackPercent = totalFeedbacks > 0 ? (aFeedbackCount / totalFeedbacks) * 100 : 0;
      const nFeedbackPercent = totalFeedbacks > 0 ? (nFeedbackCount / totalFeedbacks) * 100 : 0;
      const dFeedbackPercent = totalFeedbacks > 0 ? (dFeedbackCount / totalFeedbacks) * 100 : 0;
      const sdFeedbackPercent = totalFeedbacks > 0 ? (sdFeedbackCount / totalFeedbacks) * 100 : 0;

      // Calculate QUESTION percentages
      const totalQuestionResponses = sdQuestionCount + dQuestionCount + nQuestionCount + aQuestionCount + saQuestionCount;
      const saQuestionPercent = totalQuestionResponses > 0 ? (saQuestionCount / totalQuestionResponses) * 100 : 0;
      const aQuestionPercent = totalQuestionResponses > 0 ? (aQuestionCount / totalQuestionResponses) * 100 : 0;
      const nQuestionPercent = totalQuestionResponses > 0 ? (nQuestionCount / totalQuestionResponses) * 100 : 0;
      const dQuestionPercent = totalQuestionResponses > 0 ? (dQuestionCount / totalQuestionResponses) * 100 : 0;
      const sdQuestionPercent = totalQuestionResponses > 0 ? (sdQuestionCount / totalQuestionResponses) * 100 : 0;

      // Risk score based on questions (not feedbacks)
      const riskScore = Math.max(0, sdQuestionCount * 3 - saQuestionCount);
      let riskLevel = 'Low';
      if (sdQuestionPercent > 30 || sdQuestionCount > 10) riskLevel = 'High';
      else if (sdQuestionPercent > 15 || sdQuestionCount > 5) riskLevel = 'Medium';

      return {
        email: leader.email,
        name: leader.name,
        feedbackCount: leader.feedbacks.length,
        uniqueRespondents: leader.uniqueRespondents.size,
        avgScore: parseFloat(avgScore.toFixed(2)),

        // FEEDBACK-based counts (for Feedback Distribution section)
        saFeedbackCount,
        aFeedbackCount,
        nFeedbackCount,
        dFeedbackCount,
        sdFeedbackCount,

        // FEEDBACK-based percentages
        saFeedbackPercent: parseFloat(saFeedbackPercent.toFixed(1)),
        aFeedbackPercent: parseFloat(aFeedbackPercent.toFixed(1)),
        nFeedbackPercent: parseFloat(nFeedbackPercent.toFixed(1)),
        dFeedbackPercent: parseFloat(dFeedbackPercent.toFixed(1)),
        sdFeedbackPercent: parseFloat(sdFeedbackPercent.toFixed(1)),

        // QUESTION-based counts (for metric boxes)
        saQuestionCount,
        aQuestionCount,
        nQuestionCount,
        dQuestionCount,
        sdQuestionCount,

        // QUESTION-based percentages
        saQuestionPercent: parseFloat(saQuestionPercent.toFixed(1)),
        aQuestionPercent: parseFloat(aQuestionPercent.toFixed(1)),
        nQuestionPercent: parseFloat(nQuestionPercent.toFixed(1)),
        dQuestionPercent: parseFloat(dQuestionPercent.toFixed(1)),
        sdQuestionPercent: parseFloat(sdQuestionPercent.toFixed(1)),

        totalQuestionResponses,

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
  // Add this function after calculateQuarterlyData
  const calculateTimePeriodCount = (period: 'week' | 'month' | 'quarter') => {
    if (!responses.length) return 0;

    const now = new Date();
    const startDate = new Date();

    switch (period) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
    }

    return responses.filter(response => {
      const timestamp = response.Timestamp as string;
      if (!timestamp) return false;

      try {
        const responseDate = new Date(timestamp);
        // Handle invalid dates
        if (isNaN(responseDate.getTime())) return false;
        return responseDate >= startDate && responseDate <= now;
      } catch {
        return false;
      }
    }).length;
  };

  const convertResponseToScore = (response: string): number => {
    switch (response) {
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
          switch (val) {
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
          switch (val) {
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
  const calculateFilteredQuarterlyData = (quarter: string) => {
    const filteredResponses = getFilteredResponses();

    return filteredResponses.filter(response => {
      const quarterFromDate = getQuarterFromDate(response.Timestamp || response.Date || '');
      return quarterFromDate === quarter;
    }).length;
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
            switch (val) {
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
    const leaderAnalytics = calculateLeaderAnalytics();

    return leaderAnalytics
      .map(leader => {
        // Calculate risk score
        const riskScore = Math.max(0, leader.sdCount * 5 - leader.saCount);

        // Determine action needed based on SD count
        let actionNeeded = 'Low';
        if (leader.sdCount > 10) actionNeeded = 'High';
        else if (leader.sdCount > 5) actionNeeded = 'Medium';

        // Determine risk level
        let riskLevel = 'Low';
        const sdPercent = leader.totalResponses > 0 ? (leader.sdCount / leader.totalResponses) * 100 : 0;
        if (sdPercent > 30 || leader.sdCount > 10) riskLevel = 'High';
        else if (sdPercent > 15 || leader.sdCount > 5) riskLevel = 'Medium';

        return {
          name: leader.name,
          sdCount: leader.sdCount,
          saCount: leader.saCount,
          riskScore: riskScore,
          actionNeeded: actionNeeded,
          riskLevel: riskLevel,
          sdPercent: parseFloat(sdPercent.toFixed(1))
        };
      })
      .sort((a, b) => b.riskScore - a.riskScore); // Sort by risk score (highest first)
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
            // { id: 'sheets', icon: FileText, label: 'Google Sheets' },
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
            <Button onClick={loadAllData} variant="outline" disabled={loading}>
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
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold text-foreground">Dashboard Overview</h2>

                {/* Global Filters */}
                <div className="flex flex-wrap gap-4">
                  <div className="min-w-[180px]">
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      Filter by Client
                    </label>
                    <select
                      value={globalFilters.client}
                      onChange={(e) => setGlobalFilters(prev => ({ ...prev, client: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border rounded-md bg-background"
                    >
                      <option value="">All Clients</option>
                      {Array.from(new Set(employeeMappings.map(emp => emp.Client as string).filter(Boolean)))
                        .sort()
                        .map(client => (
                          <option key={client} value={client}>
                            {client} ({employeeMappings.filter(emp => emp.Client === client).length} employees)
                          </option>
                        ))}
                    </select>
                  </div>
                  {/* Process Filter */}
                  <div className="min-w-[180px]">
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      Filter by Process
                    </label>
                    <select
                      value={globalFilters.process}
                      onChange={(e) => setGlobalFilters(prev => ({ ...prev, process: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border rounded-md bg-background"
                    >
                      <option value="">All Processes</option>
                      {Array.from(new Set(responses.map(r => r['Process'] as string).filter(Boolean)))
                        .sort()
                        .map(process => (
                          <option key={process} value={process}>
                            {process}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Account Manager Filter */}
                  <div className="min-w-[180px]">
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      Filter by Account Manager
                    </label>
                    <select
                      value={globalFilters.accountManager}
                      onChange={(e) => setGlobalFilters(prev => ({ ...prev, accountManager: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border rounded-md bg-background"
                    >
                      <option value="">All Managers</option>
                      {Array.from(new Set(responses.map(r => r['Management Email ID'] as string).filter(Boolean)))
                        .sort()
                        .map(manager => (
                          <option key={manager} value={manager}>
                            {manager.split('@')[0]}
                          </option>
                        ))}
                    </select>
                  </div>


                  {/* Clear Filters Button */}
                  {/* {(globalFilters.process || globalFilters.accountManager) && (
                    <div className="flex items-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setGlobalFilters({ client: '', process: '', accountManager: '' })}
                        className="h-10"
                      >
                        Clear Filters
                      </Button>
                    </div>
                  )} */}
                  {/* {(globalFilters.client || globalFilters.process || globalFilters.accountManager) && (
                    <div className="mb-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-blue-700">Active Dashboard Filters:</span>
                        {globalFilters.client && (
                          <div className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                            <span className="font-medium">Client:</span>
                            <span>{globalFilters.client}</span>
                            <button
                              onClick={() => setGlobalFilters(prev => ({ ...prev, client: '' }))}
                              className="ml-1 text-blue-600 hover:text-blue-800"
                            >
                              ×
                            </button>
                          </div>
                        )}
                        {globalFilters.process && (
                          <div className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                            <span className="font-medium">Process:</span>
                            <span>{globalFilters.process}</span>
                            <button
                              onClick={() => setGlobalFilters(prev => ({ ...prev, process: '' }))}
                              className="ml-1 text-blue-600 hover:text-blue-800"
                            >
                              ×
                            </button>
                          </div>
                        )}
                        {globalFilters.accountManager && (
                          <div className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                            <span className="font-medium">Account Manager:</span>
                            <span>{globalFilters.accountManager.split('@')[0]}</span>
                            <button
                              onClick={() => setGlobalFilters(prev => ({ ...prev, accountManager: '' }))}
                              className="ml-1 text-blue-600 hover:text-blue-800"
                            >
                              ×
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )} */}
                  <div className="flex items-end">
                    <Button
                      variant={globalFilters.client || globalFilters.process || globalFilters.accountManager ? "default" : "outline"}
                      size="sm"
                      onClick={() => setGlobalFilters({ client: '', process: '', accountManager: '' })}
                      className="whitespace-nowrap"
                      disabled={!globalFilters.client && !globalFilters.process && !globalFilters.accountManager}
                    >
                      Clear Filters
                    </Button>
                  </div>
                </div>

              </div>

              {/* Filter Summary */}
              {/* {(globalFilters.process || globalFilters.accountManager) && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                    <div>
                      <h3 className="font-medium text-gray-700">Filtered View</h3>
                      <p className="text-sm text-gray-500">
                        {(() => {
                          const filteredResponses = getFilteredResponses();
                          return `Showing ${filteredResponses.length} out of ${responses.length} responses`;
                        })()}
                        {globalFilters.process && ` in process "${globalFilters.process}"`}
                        {globalFilters.accountManager && ` for manager "${globalFilters.accountManager.split('@')[0]}"`}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setGlobalFilters({ client: '', process: '', accountManager: '' })}
                      className="mt-2 sm:mt-0"
                    >
                      Clear All Filters
                    </Button>
                  </div>
                </div>
              )} */}

              {/* Active Filters Display */}
              {/* {(globalFilters.process || globalFilters.accountManager) && (
                <div className="mb-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-blue-700">Active Dashboard Filters:</span>
                    {globalFilters.process && (
                      <div className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        <span className="font-medium">Process:</span>
                        <span>{globalFilters.process}</span>
                        <button
                          onClick={() => setGlobalFilters(prev => ({ ...prev, process: '' }))}
                          className="ml-1 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </div>
                    )}
                    {globalFilters.accountManager && (
                      <div className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        <span className="font-medium">Account Manager:</span>
                        <span>{globalFilters.accountManager.split('@')[0]}</span>
                        <button
                          onClick={() => setGlobalFilters(prev => ({ ...prev, accountManager: '' }))}
                          className="ml-1 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )} */}

              {/* 3-card grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {/* Card 1: Unique Submitters - Compact */}
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Users className="w-5 h-5 text-secondary" />
                          <span className="text-sm font-medium text-muted-foreground">Unique Submitters</span>
                        </div>
                        <span className="text-2xl font-bold block leading-tight">
                          {(() => {
                            const filteredResponses = getFilteredResponses();
                            if (!filteredResponses.length) return 0;

                            // Get unique encrypted submitter IDs from filtered responses
                            const uniqueSubmitters = new Set(
                              filteredResponses
                                .map(r => r['Encrypted Submitter ID'] as string)
                                .filter(Boolean)
                            );

                            return uniqueSubmitters.size;
                          })()}
                        </span>
                        <div className="mt-2 text-xs text-muted-foreground">
                          {(() => {
                            const filteredResponses = getFilteredResponses();
                            if (!filteredResponses.length) return "0 total responses";

                            const uniqueSubmitters = new Set(
                              filteredResponses
                                .map(r => r['Encrypted Submitter ID'] as string)
                                .filter(Boolean)
                            );

                            const avgPerSubmitter = uniqueSubmitters.size > 0
                              ? (filteredResponses.length / uniqueSubmitters.size).toFixed(1)
                              : 0;

                            return `${filteredResponses.length} total responses • ${avgPerSubmitter} avg/submitter`;
                          })()}
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full font-medium">
                          Participants
                        </div>
                        {globalFilters.process || globalFilters.accountManager ? (
                          <div className="text-xs text-muted-foreground mt-1">Filtered</div>
                        ) : null}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Card 2: Incomplete Feedback - Compact */}
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    {loading ? (
                      <div className="flex items-center justify-center py-3">
                        <div className="text-center">
                          <Loader2 className="w-5 h-5 mx-auto animate-spin text-muted-foreground mb-2" />
                          <div className="text-xs text-muted-foreground">Loading data...</div>
                        </div>
                      </div>
                    ) : responses.length === 0 ? (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-yellow-500" />
                            <span className="text-sm font-medium text-muted-foreground">Incomplete Feedback</span>
                          </div>
                          <div className="text-2xl font-bold text-gray-300">?</div>
                        </div>
                        <div className="mt-3 space-y-2">
                          <div className="text-xs p-2 bg-yellow-50 border border-yellow-100 rounded">
                            <div className="flex items-start gap-2">
                              <AlertTriangle className="w-3 h-3 text-yellow-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <div className="font-medium text-yellow-700 text-xs">No response data</div>
                                <div className="text-yellow-600 text-xs mt-0.5">
                                  No feedback responses found yet
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <AlertTriangle className="w-5 h-5 text-accent" />
                              <span className="text-sm font-medium text-muted-foreground">Incomplete Feedback</span>
                            </div>
                            <span className="text-2xl font-bold block leading-tight text-red-600">
                              {(() => {
                                const filteredResponses = getFilteredResponses();
                                if (!filteredResponses.length) return 0;

                                // Count how many managers each submitter has reviewed
                                const submitterManagersMap = new Map<string, Set<string>>();

                                filteredResponses.forEach(response => {
                                  const submitterId = response['Encrypted Submitter ID'] as string;
                                  const managerEmail = response['Management Email ID'] as string;

                                  if (submitterId && managerEmail) {
                                    if (!submitterManagersMap.has(submitterId)) {
                                      submitterManagersMap.set(submitterId, new Set());
                                    }
                                    submitterManagersMap.get(submitterId)!.add(managerEmail.toLowerCase().trim());
                                  }
                                });

                                // Count submitters who have reviewed less than 3 managers
                                let incompleteCount = 0;
                                submitterManagersMap.forEach((managers, submitterId) => {
                                  if (managers.size < 3) {
                                    incompleteCount++;
                                  }
                                });

                                return incompleteCount;
                              })()}
                            </span>
                          </div>
                          <div className="flex flex-col items-end">
                            <div className="text-xs px-2 py-1 bg-red-50 text-red-700 rounded-full font-medium">
                              Incomplete
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {(() => {
                                const filteredResponses = getFilteredResponses();
                                const uniqueSubmitters = new Set(
                                  filteredResponses
                                    .map(r => r['Encrypted Submitter ID'] as string)
                                    .filter(Boolean)
                                );
                                return `${uniqueSubmitters.size} total submitters`;
                              })()}
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 space-y-2">
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-500">Completion Rate:</span>
                              <span className="font-medium text-green-600">
                                {(() => {
                                  const filteredResponses = getFilteredResponses();
                                  if (!filteredResponses.length) return "0%";

                                  const submitterManagersMap = new Map<string, Set<string>>();

                                  filteredResponses.forEach(response => {
                                    const submitterId = response['Encrypted Submitter ID'] as string;
                                    const managerEmail = response['Management Email ID'] as string;

                                    if (submitterId && managerEmail) {
                                      if (!submitterManagersMap.has(submitterId)) {
                                        submitterManagersMap.set(submitterId, new Set());
                                      }
                                      submitterManagersMap.get(submitterId)!.add(managerEmail.toLowerCase().trim());
                                    }
                                  });

                                  let completeCount = 0;
                                  let totalSubmitters = 0;

                                  submitterManagersMap.forEach((managers, submitterId) => {
                                    totalSubmitters++;
                                    if (managers.size >= 3) {
                                      completeCount++;
                                    }
                                  });

                                  return totalSubmitters > 0
                                    ? `${Math.round((completeCount / totalSubmitters) * 100)}%`
                                    : "0%";
                                })()}
                              </span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-green-500 h-1.5 rounded-full transition-all duration-500"
                                style={{
                                  width: `${(() => {
                                    const filteredResponses = getFilteredResponses();
                                    if (!filteredResponses.length) return 0;

                                    const submitterManagersMap = new Map<string, Set<string>>();

                                    filteredResponses.forEach(response => {
                                      const submitterId = response['Encrypted Submitter ID'] as string;
                                      const managerEmail = response['Management Email ID'] as string;

                                      if (submitterId && managerEmail) {
                                        if (!submitterManagersMap.has(submitterId)) {
                                          submitterManagersMap.set(submitterId, new Set());
                                        }
                                        submitterManagersMap.get(submitterId)!.add(managerEmail.toLowerCase().trim());
                                      }
                                    });

                                    let completeCount = 0;
                                    let totalSubmitters = 0;

                                    submitterManagersMap.forEach((managers, submitterId) => {
                                      totalSubmitters++;
                                      if (managers.size >= 3) {
                                        completeCount++;
                                      }
                                    });

                                    return totalSubmitters > 0
                                      ? Math.min((completeCount / totalSubmitters) * 100, 100)
                                      : 0;
                                  })()}%`
                                }}
                              />
                            </div>
                          </div>
                          {/* <div className="flex justify-between text-xs text-gray-500">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div> */}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Card 3: Gender Distribution - Compact */}
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-secondary" />
                        <span className="text-sm font-medium text-muted-foreground">Gender Distribution</span>
                      </div>
                      <div className="text-xs px-2 py-1 bg-purple-50 text-purple-700 rounded-full font-medium">
                        Diversity
                      </div>
                    </div>

                    {(() => {
                      // Get filtered responses based on global filters
                      const filteredResponses = getFilteredResponses();

                      const genderMap = new Map<string, number>();
                      const submitterMap = new Map<string, string>();

                      // Track unique submitters and their gender from filtered responses
                      filteredResponses.forEach(response => {
                        const submitterId = response['Encrypted Submitter ID'] as string;
                        const gender = (response['Gender'] as string)?.trim() || 'Unknown';

                        // Only count each submitter once
                        if (submitterId && !submitterMap.has(submitterId)) {
                          submitterMap.set(submitterId, gender);
                        }
                      });

                      // Count genders from unique submitters
                      submitterMap.forEach(gender => {
                        let genderKey = gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase();

                        // Normalize gender values
                        if (!['Male', 'Female', 'Other', 'Prefer not to say'].includes(genderKey)) {
                          if (genderKey === 'Unknown' || !genderKey) {
                            genderKey = 'Unknown';
                          } else {
                            if (genderKey.toLowerCase().includes('female')) genderKey = 'Female';
                            else if (genderKey.toLowerCase().includes('male')) genderKey = 'Male';
                            else genderKey = 'Other';
                          }
                        }

                        genderMap.set(genderKey, (genderMap.get(genderKey) || 0) + 1);
                      });

                      const totalUniqueSubmitters = submitterMap.size;

                      if (totalUniqueSubmitters === 0) {
                        return (
                          <div className="py-4 text-center">
                            <div className="text-2xl font-bold text-gray-300 mb-1">?</div>
                            <div className="text-sm text-muted-foreground">No data</div>
                            <div className="text-xs text-gray-400 mt-2">
                              {globalFilters.process || globalFilters.accountManager ?
                                'No submissions match current filters' :
                                'Awaiting submissions'}
                            </div>
                          </div>
                        );
                      }

                      const genderData = Array.from(genderMap.entries())
                        .map(([gender, count]) => ({
                          gender,
                          count,
                          percentage: Math.round((count / totalUniqueSubmitters) * 100)
                        }))
                        .sort((a, b) => b.count - a.count);

                      const colors = {
                        'Male': '#3b82f6',
                        'Female': '#ec4899',
                        'Other': '#8b5cf6',
                        'Unknown': '#9ca3af',
                        'Prefer not to say': '#10b981'
                      };

                      const size = 90;
                      const radius = 35;
                      const center = size / 2;
                      let cumulativePercentage = 0;
                      const segments = genderData.map(item => {
                        const segment = {
                          ...item,
                          start: cumulativePercentage,
                          end: cumulativePercentage + item.percentage,
                          color: colors[item.gender as keyof typeof colors] || '#9ca3af'
                        };
                        cumulativePercentage += item.percentage;
                        return segment;
                      });

                      return (
                        <div className="flex items-center gap-4">
                          <div className="relative flex-shrink-0">
                            <svg width={size} height={size} className="drop-shadow-sm">
                              {segments.map((segment, index) => {
                                if (segment.percentage === 0) return null;

                                const startAngle = (segment.start / 100) * 360 - 90;
                                const endAngle = (segment.end / 100) * 360 - 90;

                                const startRad = (startAngle * Math.PI) / 180;
                                const endRad = (endAngle * Math.PI) / 180;

                                const x1 = center + radius * Math.cos(startRad);
                                const y1 = center + radius * Math.sin(startRad);
                                const x2 = center + radius * Math.cos(endRad);
                                const y2 = center + radius * Math.sin(endRad);

                                const largeArc = segment.percentage > 50 ? 1 : 0;

                                const pathData = [
                                  `M ${center} ${center}`,
                                  `L ${x1} ${y1}`,
                                  `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
                                  'Z'
                                ].join(' ');

                                return (
                                  <path
                                    key={index}
                                    d={pathData}
                                    fill={segment.color}
                                    stroke="white"
                                    strokeWidth="1.5"
                                  />
                                );
                              })}

                              <circle
                                cx={center}
                                cy={center}
                                r={radius * 0.4}
                                fill="white"
                              />

                              <text
                                x={center}
                                y={center - 4}
                                textAnchor="middle"
                                style={{ fontSize: '10px', fontWeight: '600', fill: '#374151' }}
                              >
                                {totalUniqueSubmitters}
                              </text>
                              <text
                                x={center}
                                y={center + 5}
                                textAnchor="middle"
                                style={{ fontSize: '8px', fill: '#6b7280' }}
                              >
                                Users
                              </text>
                            </svg>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="space-y-2">
                              {genderData.map((item, index) => (
                                <div key={index} className="flex items-center justify-between text-xs">
                                  <div className="flex items-center truncate">
                                    <div
                                      className="w-3 h-3 rounded-full mr-2 flex-shrink-0"
                                      style={{ backgroundColor: colors[item.gender as keyof typeof colors] || '#9ca3af' }}
                                    />
                                    <span className="font-medium truncate">{item.gender}</span>
                                  </div>
                                  <div className="text-right flex-shrink-0 ml-2">
                                    <span className="font-bold">{item.percentage}%</span>
                                    <span className="text-gray-500 ml-1">({item.count})</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                              <div className="flex justify-between">
                                <span>Total diversity score:</span>
                                <span className="font-medium text-gray-700">
                                  {genderData.length > 1 ? Math.max(...genderData.map(g => g.percentage)) - Math.min(...genderData.filter(g => g.percentage > 0).map(g => g.percentage)) : 0}% spread
                                </span>
                              </div>
                              {globalFilters.process || globalFilters.accountManager ? (
                                <div className="mt-1 text-xs text-blue-600">
                                  Filtered by: {globalFilters.process || ''} {(globalFilters.process && globalFilters.accountManager) ? '•' : ''}
                                  {globalFilters.accountManager ? globalFilters.accountManager.split('@')[0] : ''}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              </div>

              {/* Feedback Completion Status - Updated for response-only data */}
              <div className="mb-8">
                <h3 className="text-xl font-bold text-foreground mb-4">Feedback Completion Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Card 1: Incomplete Feedback (1 or 2 managers) */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-yellow-600" />
                        Incomplete Feedback
                      </CardTitle>
                      <CardDescription>
                        Submitters who reviewed 1 or 2 managers
                        {globalFilters.process && ` • Process: ${globalFilters.process}`}
                        {globalFilters.accountManager && ` • Manager: ${globalFilters.accountManager.split('@')[0]}`}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {(() => {
                        const filteredResponses = getFilteredResponses(); // Use filtered responses
                        if (!filteredResponses.length) {
                          return (
                            <div className="text-center py-8">
                              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                              <p className="text-muted-foreground">No data to analyze</p>
                            </div>
                          );
                        }

                        const submitterManagersMap = new Map<string, Set<string>>();

                        filteredResponses.forEach(response => {
                          const submitterId = response['Encrypted Submitter ID'] as string;
                          const managerEmail = response['Management Email ID'] as string;

                          if (submitterId && managerEmail) {
                            if (!submitterManagersMap.has(submitterId)) {
                              submitterManagersMap.set(submitterId, new Set());
                            }
                            submitterManagersMap.get(submitterId)!.add(managerEmail.toLowerCase().trim());
                          }
                        });

                        const incompleteSubmitters = Array.from(submitterManagersMap.entries())
                          .filter(([_, managers]) => managers.size > 0 && managers.size < 3)
                          .map(([submitterId, managers]) => ({
                            submitterId,
                            managerCount: managers.size
                          }));

                        const totalIncompleteCount = incompleteSubmitters.length;
                        const totalPossibleFeedbacks = incompleteSubmitters.reduce((sum, submitter) => sum + submitter.managerCount, 0);
                        const maxPossibleFeedbacks = incompleteSubmitters.length * 3;
                        const completionRate = maxPossibleFeedbacks > 0
                          ? Math.round((totalPossibleFeedbacks / maxPossibleFeedbacks) * 100)
                          : 0;

                        return (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-3xl font-bold text-yellow-600">
                                  {totalIncompleteCount}
                                </div>
                                <div className="text-sm text-muted-foreground">Submitters</div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-medium">Partially completed</div>
                                <div className="text-xs text-muted-foreground">
                                  {completionRate}% completion
                                </div>
                              </div>
                            </div>

                            <div className="space-y-3">
                              <div>
                                <div className="flex justify-between text-sm mb-1">
                                  <span>Feedback Completion</span>
                                  <span className="font-medium">{completionRate}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-yellow-500 h-2 rounded-full"
                                    style={{ width: `${completionRate}%` }}
                                  ></div>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-3 text-xs">
                                <div className="p-2 bg-blue-50 rounded border">
                                  <div className="font-medium">Total Possible</div>
                                  <div className="text-lg font-bold text-blue-700">
                                    {maxPossibleFeedbacks}
                                  </div>
                                  <div className="text-blue-600">Feedback opportunities</div>
                                </div>
                                <div className="p-2 bg-yellow-50 rounded border">
                                  <div className="font-medium">Given</div>
                                  <div className="text-lg font-bold text-yellow-700">
                                    {totalPossibleFeedbacks}
                                  </div>
                                  <div className="text-yellow-600">Feedbacks submitted</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </CardContent>
                  </Card>




                  {/* Card 2: Potential Non-Respondents (calculated from mapping + response) */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        Non-Respondents
                      </CardTitle>
                      <CardDescription>
                        Employees in mapping sheet who haven't submitted feedback
                        {globalFilters.process && ` • Process: ${globalFilters.process}`}
                        {globalFilters.accountManager && ` • Manager: ${globalFilters.accountManager.split('@')[0]}`}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {mappingLoading ? (
                        <div className="flex items-center justify-center py-3">
                          <div className="text-center">
                            <Loader2 className="w-5 h-5 mx-auto animate-spin text-muted-foreground mb-2" />
                            <div className="text-xs text-muted-foreground">Loading mapping data...</div>
                          </div>
                        </div>
                      ) : employeeMappings.length === 0 ? (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="w-5 h-5 text-yellow-500" />
                              <span className="text-sm font-medium text-muted-foreground">Mapping Data Needed</span>
                            </div>
                            <div className="text-2xl font-bold text-gray-300">?</div>
                          </div>
                          <div className="mt-3 space-y-2">
                            <div className="text-xs p-2 bg-yellow-50 border border-yellow-100 rounded">
                              <div className="flex items-start gap-2">
                                <AlertTriangle className="w-3 h-3 text-yellow-600 mt-0.5 flex-shrink-0" />
                                <div>
                                  <div className="font-medium text-yellow-700 text-xs">Load mapping sheet</div>
                                  <div className="text-yellow-600 text-xs mt-0.5">
                                    Click "Refresh Data" to load employee mapping for accurate non-respondent counts
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <AlertTriangle className="w-5 h-5 text-accent" />
                                <span className="text-sm font-medium text-muted-foreground">Non-Respondents</span>
                              </div>
                              <span className="text-2xl font-bold block leading-tight text-red-600">
                                {(() => {
                                  const filteredResponses = getFilteredResponses(); // Use filtered responses

                                  // Each person should submit 3 feedback forms (one for each manager)
                                  // Count unique encrypted submitter IDs that have 3 or more responses
                                  const submitterCounts = new Map<string, number>();

                                  filteredResponses.forEach(response => {
                                    const submitterId = response['Encrypted Submitter ID'] as string;
                                    if (submitterId) {
                                      submitterCounts.set(submitterId, (submitterCounts.get(submitterId) || 0) + 1);
                                    }
                                  });

                                  // Submitters who have completed all 3 feedbacks
                                  const completedSubmitters = Array.from(submitterCounts.entries())
                                    .filter(([_, count]) => count >= 3)
                                    .map(([submitterId]) => submitterId);

                                  // Get filtered employee mappings based on global filters
                                  const filteredEmployeeMappings = getFilteredEmployeeMappings();
                                  const totalFilteredEmployees = filteredEmployeeMappings.length;

                                  // Assuming each completed submitter represents one employee
                                  const estimatedNonRespondents = Math.max(0, totalFilteredEmployees - completedSubmitters.length);

                                  return estimatedNonRespondents;
                                })()}
                              </span>
                            </div>
                            <div className="flex flex-col items-end">
                              <div className="text-xs px-2 py-1 bg-red-50 text-red-700 rounded-full font-medium">
                                Action needed
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {(() => {
                                  const filteredEmployeeMappings = getFilteredEmployeeMappings();
                                  return `${filteredEmployeeMappings.length} filtered employees`;
                                })()}
                              </div>
                            </div>
                          </div>

                          <div className="mt-3 space-y-2">
                            <div className="space-y-1 text-xs">
                              <div className="flex justify-between items-center">
                                <span className="text-gray-500">Participation Rate:</span>
                                <span className="font-medium text-green-600">
                                  {(() => {
                                    const filteredResponses = getFilteredResponses();
                                    const filteredEmployeeMappings = getFilteredEmployeeMappings();

                                    const submitterCounts = new Map<string, number>();

                                    filteredResponses.forEach(response => {
                                      const submitterId = response['Encrypted Submitter ID'] as string;
                                      if (submitterId) {
                                        submitterCounts.set(submitterId, (submitterCounts.get(submitterId) || 0) + 1);
                                      }
                                    });

                                    const completedSubmitters = Array.from(submitterCounts.entries())
                                      .filter(([_, count]) => count >= 3)
                                      .map(([submitterId]) => submitterId);

                                    const participationRate = filteredEmployeeMappings.length > 0
                                      ? Math.round((completedSubmitters.length / filteredEmployeeMappings.length) * 100)
                                      : 0;

                                    return `${participationRate}%`;
                                  })()}
                                </span>
                              </div>
                              <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="bg-green-500 h-1.5 rounded-full transition-all duration-500"
                                  style={{
                                    width: `${(() => {
                                      const filteredResponses = getFilteredResponses();
                                      const filteredEmployeeMappings = getFilteredEmployeeMappings();

                                      const submitterCounts = new Map<string, number>();

                                      filteredResponses.forEach(response => {
                                        const submitterId = response['Encrypted Submitter ID'] as string;
                                        if (submitterId) {
                                          submitterCounts.set(submitterId, (submitterCounts.get(submitterId) || 0) + 1);
                                        }
                                      });

                                      const completedSubmitters = Array.from(submitterCounts.entries())
                                        .filter(([_, count]) => count >= 3)
                                        .map(([submitterId]) => submitterId);

                                      return filteredEmployeeMappings.length > 0
                                        ? Math.min((completedSubmitters.length / filteredEmployeeMappings.length) * 100, 100)
                                        : 0;
                                    })()}%`
                                  }}
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3 text-xs mt-3">
                              <div className="p-2 bg-blue-50 rounded border">
                                <div className="font-medium">Filtered Employees</div>
                                <div className="text-lg font-bold text-blue-700">
                                  {(() => {
                                    const filteredEmployeeMappings = getFilteredEmployeeMappings();
                                    return filteredEmployeeMappings.length;
                                  })()}
                                </div>
                                <div className="text-blue-600">In mapping sheet</div>
                              </div>
                              <div className="p-2 bg-green-50 rounded border">
                                <div className="font-medium">Completed</div>
                                <div className="text-lg font-bold text-green-700">
                                  {(() => {
                                    const filteredResponses = getFilteredResponses();
                                    const submitterCounts = new Map<string, number>();

                                    filteredResponses.forEach(response => {
                                      const submitterId = response['Encrypted Submitter ID'] as string;
                                      if (submitterId) {
                                        submitterCounts.set(submitterId, (submitterCounts.get(submitterId) || 0) + 1);
                                      }
                                    });

                                    return Array.from(submitterCounts.entries())
                                      .filter(([_, count]) => count >= 3)
                                      .length;
                                  })()}
                                </div>
                                <div className="text-green-600">Submitted all 3 feedbacks</div>
                              </div>
                              <div className="p-2 bg-yellow-50 rounded border">
                                <div className="font-medium">Partial</div>
                                <div className="text-lg font-bold text-yellow-700">
                                  {(() => {
                                    const filteredResponses = getFilteredResponses();
                                    const submitterCounts = new Map<string, number>();

                                    filteredResponses.forEach(response => {
                                      const submitterId = response['Encrypted Submitter ID'] as string;
                                      if (submitterId) {
                                        submitterCounts.set(submitterId, (submitterCounts.get(submitterId) || 0) + 1);
                                      }
                                    });

                                    return Array.from(submitterCounts.entries())
                                      .filter(([_, count]) => count > 0 && count < 3)
                                      .length;
                                  })()}
                                </div>
                                <div className="text-yellow-600">Submitted 1-2 feedbacks</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Card 3: Gender Distribution for Non-Respondents - FIXED */}
                  {/* Card 3: Gender Distribution for Non-Respondents - FIXED WITH BETTER MATCHING */}


                  {/* Card 3: Completed Feedback (all 3 managers) */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        Completed Feedback
                      </CardTitle>
                      <CardDescription>
                        Submitters who reviewed 3 or more managers
                        {globalFilters.process && ` • Process: ${globalFilters.process}`}
                        {globalFilters.accountManager && ` • Manager: ${globalFilters.accountManager.split('@')[0]}`}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {(() => {
                        const filteredResponses = getFilteredResponses(); // Use filtered responses
                        if (!filteredResponses.length) {
                          return (
                            <div className="text-center py-8">
                              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                              <p className="text-muted-foreground">No data to analyze</p>
                            </div>
                          );
                        }

                        const submitterManagersMap = new Map<string, Set<string>>();

                        filteredResponses.forEach(response => {
                          const submitterId = response['Encrypted Submitter ID'] as string;
                          const managerEmail = response['Management Email ID'] as string;

                          if (submitterId && managerEmail) {
                            if (!submitterManagersMap.has(submitterId)) {
                              submitterManagersMap.set(submitterId, new Set());
                            }
                            submitterManagersMap.get(submitterId)!.add(managerEmail.toLowerCase().trim());
                          }
                        });

                        const completeSubmitters = Array.from(submitterManagersMap.entries())
                          .filter(([_, managers]) => managers.size >= 3)
                          .map(([submitterId, managers]) => ({
                            submitterId,
                            managerCount: managers.size
                          }));

                        const totalCompleteCount = completeSubmitters.length;
                        const totalSubmitters = submitterManagersMap.size;
                        const totalFeedbacksGiven = completeSubmitters.reduce((sum, submitter) => sum + submitter.managerCount, 0);
                        const completionRate = totalSubmitters > 0
                          ? Math.round((totalCompleteCount / totalSubmitters) * 100)
                          : 0;

                        return (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-3xl font-bold text-green-600">
                                  {totalCompleteCount}
                                </div>
                                <div className="text-sm text-muted-foreground">Submitters</div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-medium">Fully completed</div>
                                <div className="text-xs text-muted-foreground">
                                  {completionRate}% of submitters
                                </div>
                              </div>
                            </div>

                            <div className="space-y-3">
                              <div>
                                <div className="flex justify-between text-sm mb-1">
                                  <span>Completion Rate</span>
                                  <span className="font-medium">{completionRate}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-green-600 h-2 rounded-full"
                                    style={{ width: `${completionRate}%` }}
                                  ></div>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-3 text-xs">
                                <div className="p-2 bg-green-50 rounded border">
                                  <div className="font-medium">With ≥3 Managers</div>
                                  <div className="text-lg font-bold text-green-700">
                                    {totalCompleteCount}
                                  </div>
                                  <div className="text-green-600">Completed submitters</div>
                                </div>
                                <div className="p-2 bg-purple-50 rounded border">
                                  <div className="font-medium">Total Feedback</div>
                                  <div className="text-lg font-bold text-purple-700">
                                    {totalFeedbacksGiven}
                                  </div>
                                  <div className="text-purple-600">Reviews given</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Users className="w-5 h-5 text-secondary" />
                          <span className="text-sm font-medium text-muted-foreground">Non-Respondent Gender</span>
                        </div>
                        <div className="text-xs px-2 py-1 bg-purple-50 text-purple-700 rounded-full font-medium">
                          Pending
                        </div>
                      </div>

                      {(() => {
                        // Get filtered responses and employee mappings
                        const filteredResponses = getFilteredResponses();
                        const filteredEmployeeMappings = getFilteredEmployeeMappings();

                        if (!filteredEmployeeMappings.length || mappingLoading) {
                          return (
                            <div className="py-4 text-center">
                              {mappingLoading ? (
                                <>
                                  <Loader2 className="w-5 h-5 mx-auto animate-spin text-muted-foreground mb-2" />
                                  <div className="text-xs text-muted-foreground">Loading mapping data...</div>
                                </>
                              ) : (
                                <>
                                  <div className="text-2xl font-bold text-gray-300 mb-1">?</div>
                                  <div className="text-sm text-muted-foreground">No mapping data</div>
                                  <div className="text-xs text-gray-400 mt-2">
                                    Load employee mapping data to see non-respondent gender distribution
                                  </div>
                                </>
                              )}
                            </div>
                          );
                        }

                        // Create a map of employee identifiers for easier matching
                        const employeeIdentifierMap = new Map<string, { email: string, gender: string, ldap: string }>();

                        filteredEmployeeMappings.forEach(emp => {
                          const email = (emp.Email as string || '').toLowerCase().trim();
                          const ldap = (emp.Ldap as string || '').toLowerCase().trim();

                          if (email && email.includes('@')) {
                            // Get gender from mapping or default to Unknown
                            const genderFromMapping = (emp.Gender as string)?.trim() || 'Unknown';
                            let gender = genderFromMapping;

                            // Normalize gender
                            let genderKey = gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase();
                            if (!['Male', 'Female', 'Other', 'Prefer not to say', 'Unknown'].includes(genderKey)) {
                              if (genderKey.toLowerCase().includes('female')) genderKey = 'Female';
                              else if (genderKey.toLowerCase().includes('male')) genderKey = 'Male';
                              else genderKey = 'Other';
                            }

                            // Store multiple identifiers for this employee
                            const employeeInfo = {
                              email,
                              gender: genderKey,
                              ldap
                            };

                            // Store by email
                            employeeIdentifierMap.set(email, employeeInfo);

                            // Also store by LDAP if available
                            if (ldap) {
                              employeeIdentifierMap.set(ldap, employeeInfo);
                            }

                            // Store by email local part (without domain)
                            const emailLocalPart = email.split('@')[0];
                            employeeIdentifierMap.set(emailLocalPart, employeeInfo);

                            // Also store common variations (remove dots from email)
                            if (emailLocalPart.includes('.')) {
                              const emailWithoutDots = emailLocalPart.replace(/\./g, '');
                              employeeIdentifierMap.set(emailWithoutDots, employeeInfo);
                            }

                            // Store first 5-8 characters as potential encrypted ID parts
                            for (let i = 5; i <= Math.min(8, emailLocalPart.length); i++) {
                              employeeIdentifierMap.set(emailLocalPart.substring(0, i), employeeInfo);
                            }
                          }
                        });

                        // Track which employees have submitted feedback
                        const respondentEmployees = new Set<string>();

                        filteredResponses.forEach(response => {
                          const encryptedId = (response['Encrypted Submitter ID'] as string || '').toLowerCase().trim();

                          if (encryptedId) {
                            // Try multiple matching strategies
                            let matchedEmployee = null;

                            // 1. Direct match with any identifier
                            if (employeeIdentifierMap.has(encryptedId)) {
                              matchedEmployee = employeeIdentifierMap.get(encryptedId);
                            }
                            // 2. Check if encrypted ID contains any employee identifier
                            else {
                              for (const [identifier, employee] of employeeIdentifierMap.entries()) {
                                if (identifier && encryptedId.includes(identifier)) {
                                  matchedEmployee = employee;
                                  break;
                                }
                              }
                            }

                            // 3. Check if any identifier contains the encrypted ID
                            if (!matchedEmployee) {
                              for (const [identifier, employee] of employeeIdentifierMap.entries()) {
                                if (identifier && identifier.includes(encryptedId)) {
                                  matchedEmployee = employee;
                                  break;
                                }
                              }
                            }

                            if (matchedEmployee) {
                              respondentEmployees.add(matchedEmployee.email);
                            }
                          }
                        });

                        // Count non-respondents by gender
                        const nonRespondentGenderMap = new Map<string, number>();
                        let totalNonRespondents = 0;

                        // Track all unique employees from mapping
                        const uniqueEmployees = new Set<string>();

                        filteredEmployeeMappings.forEach(emp => {
                          const email = (emp.Email as string || '').toLowerCase().trim();
                          if (email && email.includes('@') && !uniqueEmployees.has(email)) {
                            uniqueEmployees.add(email);

                            // Check if this employee is a respondent
                            if (!respondentEmployees.has(email)) {
                              // This is a non-respondent
                              totalNonRespondents++;

                              // Get gender for this employee
                              const employeeInfo = employeeIdentifierMap.get(email);
                              const gender = employeeInfo?.gender || 'Unknown';

                              nonRespondentGenderMap.set(gender,
                                (nonRespondentGenderMap.get(gender) || 0) + 1);
                            }
                          }
                        });

                        const totalEmployees = uniqueEmployees.size;

                        if (totalNonRespondents === 0) {
                          return (
                            <div className="py-4 text-center">
                              <div className="text-2xl font-bold text-green-600 mb-1">0</div>
                              <div className="text-sm text-muted-foreground">All employees responded</div>
                              <div className="text-xs text-gray-400 mt-2">
                                100% participation from {totalEmployees} employees
                              </div>
                            </div>
                          );
                        }

                        // Prepare gender data for display
                        const genderData = Array.from(nonRespondentGenderMap.entries())
                          .map(([gender, count]) => ({
                            gender,
                            count,
                            percentage: totalNonRespondents > 0
                              ? Math.round((count / totalNonRespondents) * 100)
                              : 0
                          }))
                          .sort((a, b) => b.count - a.count);

                        // Add missing gender categories with zero count
                        const allGenderCategories = ['Male', 'Female', 'Other', 'Unknown', 'Prefer not to say'];
                        allGenderCategories.forEach(gender => {
                          if (!genderData.some(g => g.gender === gender)) {
                            genderData.push({ gender, count: 0, percentage: 0 });
                          }
                        });

                        // Sort again after adding missing categories
                        genderData.sort((a, b) => b.count - a.count);

                        const colors = {
                          'Male': '#3b82f6',
                          'Female': '#ec4899',
                          'Other': '#8b5cf6',
                          'Unknown': '#9ca3af',
                          'Prefer not to say': '#10b981',
                          'Other/Unknown': '#8b5cf6'
                        };

                        const size = 90;
                        const radius = 35;
                        const center = size / 2;

                        // Only show segments for non-zero percentages
                        const nonZeroGenderData = genderData.filter(item => item.percentage > 0);
                        let cumulativePercentage = 0;
                        const segments = nonZeroGenderData.map(item => {
                          const segment = {
                            ...item,
                            start: cumulativePercentage,
                            end: cumulativePercentage + item.percentage,
                            color: colors[item.gender as keyof typeof colors] || '#9ca3af'
                          };
                          cumulativePercentage += item.percentage;
                          return segment;
                        });

                        return (
                          <div className="flex items-center gap-4">
                            <div className="relative flex-shrink-0">
                              <svg width={size} height={size} className="drop-shadow-sm">
                                {segments.map((segment, index) => {
                                  if (segment.percentage === 0) return null;

                                  const startAngle = (segment.start / 100) * 360 - 90;
                                  const endAngle = (segment.end / 100) * 360 - 90;

                                  const startRad = (startAngle * Math.PI) / 180;
                                  const endRad = (endAngle * Math.PI) / 180;

                                  const x1 = center + radius * Math.cos(startRad);
                                  const y1 = center + radius * Math.sin(startRad);
                                  const x2 = center + radius * Math.cos(endRad);
                                  const y2 = center + radius * Math.sin(endRad);

                                  const largeArc = segment.percentage > 50 ? 1 : 0;

                                  const pathData = [
                                    `M ${center} ${center}`,
                                    `L ${x1} ${y1}`,
                                    `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
                                    'Z'
                                  ].join(' ');

                                  return (
                                    <path
                                      key={index}
                                      d={pathData}
                                      fill={segment.color}
                                      stroke="white"
                                      strokeWidth="1.5"
                                    />
                                  );
                                })}

                                <circle
                                  cx={center}
                                  cy={center}
                                  r={radius * 0.4}
                                  fill="white"
                                />

                                <text
                                  x={center}
                                  y={center - 4}
                                  textAnchor="middle"
                                  style={{ fontSize: '10px', fontWeight: '600', fill: '#374151' }}
                                >
                                  {totalNonRespondents}
                                </text>
                                <text
                                  x={center}
                                  y={center + 5}
                                  textAnchor="middle"
                                  style={{ fontSize: '8px', fill: '#6b7280' }}
                                >
                                  Pending
                                </text>
                              </svg>
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="space-y-2">
                                {genderData
                                  .filter(item => item.count > 0) // Only show non-zero counts
                                  .map((item, index) => (
                                    <div key={index} className="flex items-center justify-between text-xs">
                                      <div className="flex items-center truncate">
                                        <div
                                          className="w-3 h-3 rounded-full mr-2 flex-shrink-0"
                                          style={{ backgroundColor: colors[item.gender as keyof typeof colors] || '#9ca3af' }}
                                        />
                                        <span className="font-medium truncate">{item.gender}</span>
                                      </div>
                                      <div className="text-right flex-shrink-0 ml-2">
                                        <span className="font-bold">{item.percentage}%</span>
                                        <span className="text-gray-500 ml-1">({item.count})</span>
                                      </div>
                                    </div>
                                  ))}
                              </div>
                              <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                                <div className="flex justify-between">
                                  <span>Total pending:</span>
                                  <span className="font-medium text-gray-700">
                                    {totalNonRespondents} employees
                                  </span>
                                </div>
                                {/* <div className="mt-1 flex justify-between">
                <span>Response rate:</span>
                <span className="font-medium text-green-600">
                  {totalEmployees > 0 
                    ? `${Math.round(((totalEmployees - totalNonRespondents) / totalEmployees) * 100)}%`
                    : '0%'}
                </span>
              </div>
              <div className="mt-1 flex justify-between">
                <span>Matched employees:</span>
                <span className="font-medium text-blue-600">
                  {respondentEmployees.size} of {totalEmployees}
                </span>
              </div> */}
                                {globalFilters.process || globalFilters.accountManager ? (
                                  <div className="mt-1 text-xs text-blue-600">
                                    Filtered by: {globalFilters.process || ''} {(globalFilters.process && globalFilters.accountManager) ? '•' : ''}
                                    {globalFilters.accountManager ? globalFilters.accountManager.split('@')[0] : ''}
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Responses by Quarter & Time Period Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Submission Frequency</CardTitle>
                  <CardDescription>
                    Feedback submission trends across different time periods
                    {globalFilters.process && ` • Process: ${globalFilters.process}`}
                    {globalFilters.accountManager && ` • Manager: ${globalFilters.accountManager.split('@')[0]}`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Weekly, Monthly, Quarterly Section */}
                  <div className="mb-8">
                    <h4 className="text-lg font-medium mb-4">Recent Activity</h4>
                    <div className="grid grid-cols-3 gap-4">
                      {(() => {
                        const calculateFilteredTimePeriodCount = (period: 'week' | 'month' | 'quarter') => {
                          const filteredResponses = getFilteredResponses();
                          if (!filteredResponses.length) return 0;

                          const now = new Date();
                          const startDate = new Date();

                          switch (period) {
                            case 'week':
                              startDate.setDate(now.getDate() - 7);
                              break;
                            case 'month':
                              startDate.setMonth(now.getMonth() - 1);
                              break;
                            case 'quarter':
                              startDate.setMonth(now.getMonth() - 3);
                              break;
                          }

                          return filteredResponses.filter(response => {
                            const timestamp = response.Timestamp as string;
                            if (!timestamp) return false;

                            try {
                              const responseDate = new Date(timestamp);
                              // Handle invalid dates
                              if (isNaN(responseDate.getTime())) return false;
                              return responseDate >= startDate && responseDate <= now;
                            } catch {
                              return false;
                            }
                          }).length;
                        };

                        const weeklyCount = calculateFilteredTimePeriodCount('week');
                        const monthlyCount = calculateFilteredTimePeriodCount('month');
                        const quarterlyCount = calculateFilteredTimePeriodCount('quarter');

                        const timePeriods = [
                          { label: 'This Week', count: weeklyCount, color: 'bg-blue-500', period: 'week' },
                          { label: 'This Month', count: monthlyCount, color: 'bg-green-500', period: 'month' },
                          { label: 'This Quarter', count: quarterlyCount, color: 'bg-purple-500', period: 'quarter' }
                        ];

                        return timePeriods.map((period, index) => {
                          const percentageChange = 0;

                          const getAverageText = (count: number, period: string) => {
                            switch (period) {
                              case 'week':
                                return `${(count / 7).toFixed(1)}/day`;
                              case 'month':
                                return `${(count / 30).toFixed(1)}/day`;
                              case 'quarter':
                                return `${(count / 90).toFixed(1)}/day`;
                              default:
                                return '';
                            }
                          };

                          return (
                            <div key={index} className="text-center p-4 rounded-xl border hover:shadow-md transition-shadow">
                              <div className="flex flex-col items-center">
                                <span className="text-2xl font-bold text-gray-800">{period.count}</span>
                                <p className="text-sm font-medium text-gray-700">{period.label}</p>

                                {percentageChange !== 0 && (
                                  <div className={`mt-1 text-xs px-2 py-0.5 rounded-full ${percentageChange > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {percentageChange > 0 ? '↑' : '↓'} {Math.abs(percentageChange)}%
                                  </div>
                                )}

                                <div className="mt-2 w-full">
                                  <div className="flex justify-between text-xs mb-1">
                                    <span className="text-gray-500">Progress</span>
                                    <span className="font-medium">{getAverageText(period.count, period.period)}</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                      className={`h-2 rounded-full ${period.color}`}
                                      style={{ width: `${Math.min((period.count / Math.max(responses.length, 1)) * 100, 100)}%` }}
                                    ></div>
                                  </div>
                                </div>

                                <div className="mt-2 text-xs text-gray-500">
                                  {period.count > 0 ? (
                                    <>
                                      {Math.round((period.count / Math.max(responses.length, 1)) * 100)}% of total
                                    </>
                                  ) : 'No submissions'}
                                </div>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>

                  {/* Quarterly Distribution Section */}
                  <div>
                    <h4 className="text-lg font-medium mb-4">Quarterly Distribution</h4>
                    <div className="grid grid-cols-4 gap-4">
                      {['Q1', 'Q2', 'Q3', 'Q4'].map(quarter => {
                        const calculateFilteredQuarterlyData = (quarter: string) => {
                          const filteredResponses = getFilteredResponses();
                          return filteredResponses.filter(response => {
                            const quarterFromDate = getQuarterFromDate(response.Timestamp || response.Date || '');
                            return quarterFromDate === quarter;
                          }).length;
                        };

                        const count = calculateFilteredQuarterlyData(quarter);
                        const filteredResponses = getFilteredResponses();
                        const totalFilteredResponses = filteredResponses.length;
                        const percentage = totalFilteredResponses > 0 ? Math.round((count / totalFilteredResponses) * 100) : 0;

                        const currentDate = new Date();
                        const currentMonth = currentDate.getMonth() + 1;
                        const getCurrentQuarter = () => {
                          if (currentMonth >= 1 && currentMonth <= 3) return 'Q1';
                          if (currentMonth >= 4 && currentMonth <= 6) return 'Q2';
                          if (currentMonth >= 7 && currentMonth <= 9) return 'Q3';
                          return 'Q4';
                        };
                        const isCurrentQuarter = quarter === getCurrentQuarter();

                        return (
                          <div key={quarter} className={`text-center p-4 rounded-xl border ${isCurrentQuarter ? 'bg-secondary/10 border-secondary/30' : 'bg-gray-50 border-gray-200'} hover:shadow-md transition-shadow`}>
                            <div className="flex flex-col items-center">
                              <div className="flex items-center justify-center gap-2 mb-1">
                                <span className="text-2xl font-bold text-gray-800">{count}</span>
                                {isCurrentQuarter && (
                                  <span className="text-xs bg-secondary text-white px-2 py-0.5 rounded-full">
                                    Current
                                  </span>
                                )}
                              </div>
                              <p className="text-sm font-medium text-gray-700">{quarter}</p>

                              <div className="mt-2 w-full">
                                <div className="flex justify-between text-xs mb-1">
                                  <span className="text-gray-500">Share</span>
                                  <span className="font-medium">{percentage}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full ${isCurrentQuarter ? 'bg-secondary' : 'bg-gray-400'}`}
                                    style={{ width: `${Math.min(percentage, 100)}%` }}
                                  ></div>
                                </div>
                              </div>

                              <div className="mt-2 text-xs text-gray-500">
                                {count > 0 ? (
                                  <>
                                    {totalFilteredResponses > 0 && `${percentage}% of filtered`}
                                  </>
                                ) : 'No submissions'}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium">Activity Trend</div>
                          <div className="text-xs text-gray-500">
                            {(() => {
                              const calculateFilteredTimePeriodCount = (period: 'week' | 'month' | 'quarter') => {
                                const filteredResponses = getFilteredResponses();
                                if (!filteredResponses.length) return 0;

                                const now = new Date();
                                const startDate = new Date();

                                switch (period) {
                                  case 'week':
                                    startDate.setDate(now.getDate() - 7);
                                    break;
                                  case 'month':
                                    startDate.setMonth(now.getMonth() - 1);
                                    break;
                                  case 'quarter':
                                    startDate.setMonth(now.getMonth() - 3);
                                    break;
                                }

                                return filteredResponses.filter(response => {
                                  const timestamp = response.Timestamp as string;
                                  if (!timestamp) return false;

                                  try {
                                    const responseDate = new Date(timestamp);
                                    if (isNaN(responseDate.getTime())) return false;
                                    return responseDate >= startDate && responseDate <= now;
                                  } catch {
                                    return false;
                                  }
                                }).length;
                              };

                              const weekly = calculateFilteredTimePeriodCount('week');
                              const monthly = calculateFilteredTimePeriodCount('month');

                              const weeklyAvg = weekly / 7;
                              const monthlyAvg = monthly / 30;

                              if (weeklyAvg > monthlyAvg) {
                                return "Submission rate increasing this week";
                              } else if (weeklyAvg < monthlyAvg) {
                                return "Submission rate decreasing this week";
                              } else {
                                return "Steady submission rate";
                              }
                            })()}
                          </div>
                        </div>
                        <div className="text-sm font-medium">
                          {(() => {
                            const filteredResponses = getFilteredResponses();
                            const weeklyCount = (() => {
                              if (!filteredResponses.length) return 0;

                              const now = new Date();
                              const startDate = new Date();
                              startDate.setDate(now.getDate() - 7);

                              return filteredResponses.filter(response => {
                                const timestamp = response.Timestamp as string;
                                if (!timestamp) return false;

                                try {
                                  const responseDate = new Date(timestamp);
                                  if (isNaN(responseDate.getTime())) return false;
                                  return responseDate >= startDate && responseDate <= now;
                                } catch {
                                  return false;
                                }
                              }).length;
                            })();

                            return filteredResponses.length > 0 ?
                              `${((weeklyCount / filteredResponses.length) * 100).toFixed(1)}% of filtered responses this week` :
                              'No filtered data';
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>


              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Feedback Participation by Process</CardTitle>
                  <CardDescription>
                    Percentage of employees who have submitted all 3 required feedbacks for each process
                    {/* <div className="flex flex-wrap gap-4 mt-2 text-sm">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
          <span>Submitted all 3 feedbacks</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-yellow-500 rounded mr-2"></div>
          <span>Submitted 1-2 feedbacks</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-red-500 rounded mr-2"></div>
          <span>Not started</span>
        </div>
      </div> */}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  {(() => {
                    // Define the function inside the IIFE
                    const calculateProcessParticipationFromResponses = () => {
                      // Get filtered employee mappings
                      const filteredEmployeeMappings = getFilteredEmployeeMappings();

                      // Get filtered responses
                      const filteredResponses = getFilteredResponses();

                      // Step 1: Get ALL unique processes from the responses sheet
                      // This is more accurate than mapping sheet because it shows actual submissions
                      const allProcessesFromResponses = new Set<string>();
                      filteredResponses.forEach(response => {
                        const process = response['Process'] as string;
                        if (process && process.trim()) {
                          allProcessesFromResponses.add(process.trim());
                        }
                      });

                      console.log('Processes found in responses:', Array.from(allProcessesFromResponses));

                      // If no responses, return empty
                      if (filteredResponses.length === 0) {
                        return [];
                      }

                      // Step 2: Group responses by process
                      const processResponseCounts = new Map<string, number>();
                      const processUniqueSubmitters = new Map<string, Set<string>>();
                      const processSubmitterDetails = new Map<string, Map<string, number>>(); // process -> submitter -> count

                      filteredResponses.forEach(response => {
                        const process = (response['Process'] as string || 'Unknown').trim();
                        const submitterId = response['Encrypted Submitter ID'] as string;

                        if (submitterId && submitterId.trim()) {
                          const cleanSubmitterId = submitterId.trim();

                          // Count total responses per process
                          processResponseCounts.set(process, (processResponseCounts.get(process) || 0) + 1);

                          // Track unique submitters per process
                          if (!processUniqueSubmitters.has(process)) {
                            processUniqueSubmitters.set(process, new Set());
                          }
                          processUniqueSubmitters.get(process)!.add(cleanSubmitterId);

                          // Track submitter counts per process
                          if (!processSubmitterDetails.has(process)) {
                            processSubmitterDetails.set(process, new Map());
                          }
                          const submitterCounts = processSubmitterDetails.get(process)!;
                          submitterCounts.set(cleanSubmitterId, (submitterCounts.get(cleanSubmitterId) || 0) + 1);
                        }
                      });

                      console.log('Process stats:', {
                        responseCounts: Object.fromEntries(processResponseCounts),
                        uniqueSubmitters: Object.fromEntries(
                          Array.from(processUniqueSubmitters.entries()).map(([k, v]) => [k, v.size])
                        )
                      });

                      // Step 3: Get total employees per process from mapping sheet
                      const processEmployeeCounts = new Map<string, number>();
                      filteredEmployeeMappings.forEach(emp => {
                        const process = emp.Process as string || 'Unknown';
                        processEmployeeCounts.set(process, (processEmployeeCounts.get(process) || 0) + 1);
                      });

                      // Also count employees from responses (as fallback if mapping is missing)
                      const processEmployeeCountsFromResponses = new Map<string, number>();
                      // We'll estimate based on unique submitters for now

                      // Step 4: For each process, count how many submitters have 3+ feedbacks
                      const processCompletedSubmitters = new Map<string, Set<string>>();
                      const processPartialSubmitters = new Map<string, Set<string>>();

                      processSubmitterDetails.forEach((submitterCounts, process) => {
                        const completed = new Set<string>();
                        const partial = new Set<string>();

                        submitterCounts.forEach((count, submitterId) => {
                          if (count >= 3) {
                            completed.add(submitterId);
                          } else if (count >= 1) {
                            partial.add(submitterId);
                          }
                        });

                        processCompletedSubmitters.set(process, completed);
                        processPartialSubmitters.set(process, partial);
                      });

                      // Step 5: Prepare chart data
                      // First, combine all processes we know about (from responses and mapping)
                      const allProcesses = new Set([
                        ...Array.from(allProcessesFromResponses),
                        ...Array.from(processEmployeeCounts.keys())
                      ]);

                      const chartData = Array.from(allProcesses).map(process => {
                        const totalEmployees = processEmployeeCounts.get(process) || 0;
                        const uniqueSubmitters = processUniqueSubmitters.get(process)?.size || 0;
                        const completedCount = processCompletedSubmitters.get(process)?.size || 0;
                        const partialCount = processPartialSubmitters.get(process)?.size || 0;
                        const responseCount = processResponseCounts.get(process) || 0;

                        // Calculate not started
                        const notStarted = Math.max(0, totalEmployees - uniqueSubmitters);

                        // Calculate percentage - use total employees if available, otherwise estimate
                        let percentage = 0;
                        if (totalEmployees > 0) {
                          percentage = Math.round((completedCount / totalEmployees) * 100);
                        } else if (uniqueSubmitters > 0) {
                          // If we don't know total employees, estimate based on unique submitters
                          // Assume each submitter represents one employee
                          percentage = Math.round((completedCount / uniqueSubmitters) * 100);
                        }

                        return {
                          process,
                          completedCount,
                          partialCount,
                          totalEmployees,
                          percentage,
                          pendingCount: notStarted,
                          responseCount,
                          uniqueSubmitters,
                          hasMappingData: totalEmployees > 0,
                          hasResponseData: responseCount > 0
                        };
                      });

                      // Sort by percentage descending, then by response count
                      return chartData.sort((a, b) => {
                        if (b.percentage !== a.percentage) return b.percentage - a.percentage;
                        return b.responseCount - a.responseCount;
                      });
                    };

                    const processParticipationData = calculateProcessParticipationFromResponses();

                    // Summary statistics
                    const totalEmployees = processParticipationData.reduce((sum, item) => sum + item.totalEmployees, 0);
                    const totalCompleted = processParticipationData.reduce((sum, item) => sum + item.completedCount, 0);
                    const totalUniqueSubmitters = processParticipationData.reduce((sum, item) => sum + item.uniqueSubmitters, 0);
                    const totalResponses = processParticipationData.reduce((sum, item) => sum + item.responseCount, 0);
                    const overallPercentage = totalEmployees > 0 ? Math.round((totalCompleted / totalEmployees) * 100) : 0;

                    if (processParticipationData.length === 0) {
                      return (
                        <>
                          <div className="mb-4 p-3 bg-secondary/10 rounded-lg border border-secondary/30">
                            <div className="flex flex-wrap justify-between items-center">
                              <div>
                                <div className="text-sm font-medium text-secondary">No Data Available</div>
                                <div className="text-2xl font-bold text-secondary">0%</div>
                              </div>
                              <div className="text-sm text-secondary">
                                <span className="font-bold">0</span> responses found
                              </div>
                            </div>
                            <div className="mt-2 text-xs text-secondary">
                              Load response data to see participation rates
                            </div>
                          </div>

                          <div className="text-center py-12">
                            <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-muted-foreground">
                              {responses.length === 0
                                ? "No feedback responses found. Load response data first."
                                : "No process participation data available"}
                            </p>
                            <Button
                              onClick={loadAllData}
                              variant="outline"
                              className="mt-4"
                              disabled={loading}
                            >
                              {loading ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : null}
                              Load Response Data
                            </Button>
                          </div>
                        </>
                      );
                    }

                    // Color function based on percentage
                    const getColor = (percentage: number) => {
                      if (percentage >= 80) return '#10b981'; // Green
                      if (percentage >= 50) return '#f59e0b'; // Yellow
                      return '#ef4444'; // Red
                    };

                    // Filter to show only processes with data
                    const filteredData = processParticipationData.filter(item =>
                      item.responseCount > 0 || item.totalEmployees > 0
                    );

                    return (
                      <div className="space-y-6">
                        {/* Summary statistics */}
                        <div className="p-3 bg-secondary/10 rounded-lg border border-secondary/30">
                          <div className="flex flex-wrap justify-between items-center">
                            <div>
                              <div className="text-sm font-medium text-secondary">Overall Participation</div>
                              <div className="text-2xl font-bold text-secondary">{overallPercentage}%</div>
                            </div>
                            <div className="text-sm text-secondary">
                              <span className="font-bold">{totalCompleted}</span> completed • <span className="font-bold">{totalUniqueSubmitters}</span> unique submitters
                            </div>
                          </div>
                          <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                            <div>
                              <span className="text-secondary font-medium">Total Employees:</span> {totalEmployees}
                            </div>
                            <div>
                              <span className="text-secondary font-medium">Total Responses:</span> {totalResponses}
                            </div>
                            <div>
                              <span className="text-secondary font-medium">Avg per Submitter:</span> {totalUniqueSubmitters > 0 ? (totalResponses / totalUniqueSubmitters).toFixed(1) : '0'}
                            </div>
                            <div>
                              <span className="text-secondary font-medium">Processes:</span> {filteredData.length}
                            </div>
                          </div>
                        </div>

                        {/* Bar Chart */}
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={filteredData}
                              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                              <XAxis
                                dataKey="process"
                                angle={-45}
                                textAnchor="end"
                                height={60}
                                interval={0}
                                tick={{ fontSize: 12 }}
                              />
                              <YAxis
                                label={{ value: 'Participation %', angle: -90, position: 'insideLeft' }}
                                domain={[0, 100]}
                                tickFormatter={(value) => `${value}%`}
                              />
                              <Tooltip
                                formatter={(value, name) => {
                                  if (name === 'percentage') return [`${value}%`, 'Completed %'];
                                  if (name === 'completedCount') return [value, 'Completed (3+ feedbacks)'];
                                  if (name === 'partialCount') return [value, 'Partial (1-2 feedbacks)'];
                                  if (name === 'responseCount') return [value, 'Total Responses'];
                                  return [value, name === 'totalEmployees' ? 'Total Employees' : 'Unique Submitters'];
                                }}
                                labelFormatter={(label) => `Process: ${label}`}
                                content={({ active, payload, label }) => {
                                  if (active && payload && payload.length) {
                                    const data = filteredData.find(d => d.process === label);
                                    return (
                                      <div className="bg-white p-3 border rounded-lg shadow-lg">
                                        <p className="font-bold">{label}</p>
                                        <p className="text-sm">
                                          <span className="text-green-600">{data?.completedCount || 0} completed</span> •
                                          <span className="text-yellow-600"> {data?.partialCount || 0} partial</span> •
                                          <span className="text-red-600"> {data?.pendingCount || 0} not started</span>
                                        </p>
                                        <p className="text-sm">Total: {data?.totalEmployees || 0} employees</p>
                                        <p className="text-sm">{data?.responseCount || 0} total responses</p>
                                        <p className="text-sm font-bold">{data?.percentage || 0}% participation</p>
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                              />
                              <Legend />
                              <Bar
                                dataKey="percentage"
                                name="Participation %"
                                radius={[4, 4, 0, 0]}
                              >
                                {filteredData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={getColor(entry.percentage)} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>

                        {/* Process Breakdown Table */}
                        <div className="mt-8">
                          <h4 className="font-medium mb-4">Process Breakdown</h4>
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                              <thead>
                                <tr className="bg-gray-50 border-b">
                                  <th className="text-left py-3 px-4 font-medium text-sm">Process</th>
                                  <th className="text-left py-3 px-4 font-medium text-sm">Completed</th>
                                  <th className="text-left py-3 px-4 font-medium text-sm">Partial</th>
                                  <th className="text-left py-3 px-4 font-medium text-sm">Not Started</th>
                                  <th className="text-left py-3 px-4 font-medium text-sm">Total</th>
                                  <th className="text-left py-3 px-4 font-medium text-sm">Participation</th>
                                  <th className="text-left py-3 px-4 font-medium text-sm">Responses</th>
                                </tr>
                              </thead>
                              <tbody>
                                {filteredData.map((item, index) => (
                                  <tr key={index} className="border-b hover:bg-gray-50">
                                    <td className="py-3 px-4 font-medium">
                                      <div className="flex items-center">
                                        {item.process}
                                        {!item.hasMappingData && (
                                          <span className="ml-2 text-xs px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded">
                                            No mapping
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                    <td className="py-3 px-4">
                                      <span className="font-bold text-green-600">{item.completedCount}</span>
                                    </td>
                                    <td className="py-3 px-4">
                                      <span className="font-bold text-yellow-600">{item.partialCount}</span>
                                    </td>
                                    <td className="py-3 px-4">
                                      <span className="font-bold text-red-600">{item.pendingCount}</span>
                                    </td>
                                    <td className="py-3 px-4 font-bold">{item.totalEmployees || '?'}</td>
                                    <td className="py-3 px-4">
                                      <div className="flex items-center gap-3">
                                        <div className="w-32 bg-gray-200 rounded-full h-3">
                                          <div
                                            className="h-3 rounded-full"
                                            style={{
                                              width: `${item.percentage}%`,
                                              backgroundColor: getColor(item.percentage)
                                            }}
                                          ></div>
                                        </div>
                                        <span className="font-bold min-w-12">{item.percentage}%</span>
                                      </div>
                                    </td>
                                    <td className="py-3 px-4">
                                      <div className="text-sm">
                                        <div className="font-medium">{item.responseCount}</div>
                                        <div className="text-xs text-gray-500">
                                          {item.uniqueSubmitters} submitters
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {/* Data Source Info */}
                          {/* <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start">
                <Info className="w-4 h-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                <div className="text-sm text-blue-700">
                  <span className="font-medium">Data Sources:</span>
                  <ul className="list-disc list-inside mt-1 text-xs">
                    <li>Process names extracted from response sheet "Process" column</li>
                    <li>Employee counts from mapping sheet (if available)</li>
                    <li>"Completed" = submitted 3+ feedbacks for their managers</li>
                    <li>Processes without mapping data show "?" for total employees</li>
                  </ul>
                </div>
              </div>
            </div> */}
                        </div>
                      </div>
                    );
                  })()}
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
                    {selectedLeader === 'all'
                      ? 'Global overview of all leaders. Select a leader for individual insights.'
                      : `Viewing insights for ${emailToName(selectedLeader)}`}
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
                        <option value="all">Global Overview (All Leaders)</option>
                        {getUniqueLeaders().map(leader => (
                          <option key={leader.email} value={leader.email}>
                            {leader.name} ({leader.feedbackCount} feedbacks)
                          </option>
                        ))}
                      </select>
                      <Button
                        onClick={() => {
                          setSelectedLeader('all');
                          toast({
                            title: 'Filters Cleared',
                            description: 'Returned to global overview',
                          });
                        }}
                        variant="outline"
                        className="whitespace-nowrap"
                      >
                        Clear Filter
                      </Button>
                    </div>

                    {selectedLeader !== 'all' && (
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex justify-between items-center">
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
                            ← Back to Global Overview
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* INDIVIDUAL LEADER VIEW */}
              {selectedLeader !== 'all' ? (
                <div>
                  {(() => {
                    const leaderData = calculateLeaderAnalyticsByPerson().find(l => l.email === selectedLeader);
                    if (!leaderData) {
                      return (
                        <div className="text-center py-12 border rounded-lg">
                          <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-xl font-medium mb-2">No data available for this leader</h3>
                          <p className="text-muted-foreground mb-4">
                            This leader doesn't have any feedback data yet.
                          </p>
                        </div>
                      );
                    }

                    // Calculate individual leader's analytics
                    const individualResponses = responses.filter(r =>
                      (r['Management Email ID'] as string)?.toLowerCase() === selectedLeader.toLowerCase()
                    );

                    return (
                      <div className="space-y-6">
                        {/* Leader Key Metrics */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <Card>
                            <CardContent className="pt-6">
                              <div className="text-center">
                                <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                                <span className="text-3xl font-bold text-blue-600">
                                  {leaderData.feedbackCount || 0}
                                </span>
                                <span className="text-sm text-muted-foreground block">Total Feedbacks</span>
                                <span className="text-xs text-gray-500">
                                  {leaderData.uniqueRespondents || 0} unique respondents
                                </span>
                              </div>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardContent className="pt-6">
                              <div className="text-center">
                                <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
                                <span className={`text-3xl font-bold ${leaderData.avgScore >= 4 ? 'text-green-600' :
                                  leaderData.avgScore >= 3 ? 'text-yellow-600' : 'text-red-600'
                                  }`}>
                                  {leaderData.avgScore?.toFixed(1) || '0.0'}
                                </span>
                                <span className="text-sm text-muted-foreground block">Average Score</span>
                                <span className="text-xs text-gray-500">Out of 5.0</span>
                              </div>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardContent className="pt-6">
                              <div className="text-center">
                                <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                                <span className="text-3xl font-bold text-red-600">
                                  {leaderData.sdQuestionCount || 0}
                                </span>
                                <span className="text-sm text-muted-foreground block">Strongly Disagree</span>
                                <span className="text-xs text-gray-500">
                                  {leaderData.sdQuestionPercent?.toFixed(1) || 0}% of questions
                                </span>
                              </div>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardContent className="pt-6">
                              <div className="text-center">
                                <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
                                <span className="text-3xl font-bold text-green-600">
                                  {leaderData.saQuestionCount || 0}
                                </span>
                                <span className="text-sm text-muted-foreground block">Strongly Agree</span>
                                <span className="text-xs text-gray-500">
                                  {leaderData.saQuestionPercent?.toFixed(1) || 0}% of questions
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        </div>

                        {/* Question Distribution for Individual */}
                        <Card>
                          <CardHeader>
                            <CardTitle>Question Response Distribution</CardTitle>
                            <CardDescription>
                              How respondents answered questions for {emailToName(selectedLeader)}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              {[
                                { key: 'saQuestion', label: 'Strongly Agree', color: 'bg-green-600', textColor: 'text-green-600' },
                                { key: 'aQuestion', label: 'Agree', color: 'bg-green-400', textColor: 'text-green-400' },
                                { key: 'nQuestion', label: 'Neutral', color: 'bg-yellow-400', textColor: 'text-yellow-600' },
                                { key: 'dQuestion', label: 'Disagree', color: 'bg-orange-400', textColor: 'text-orange-600' },
                                { key: 'sdQuestion', label: 'Strongly Disagree', color: 'bg-red-500', textColor: 'text-red-600' },
                              ].map((responseType) => {
                                const percent = leaderData[`${responseType.key}Percent`] || 0;
                                const count = leaderData[`${responseType.key}Count`] || 0;

                                return (
                                  <div key={responseType.key} className="flex items-center gap-4">
                                    <div className="w-32 text-sm font-medium">{responseType.label}</div>
                                    <div className="flex-1">
                                      <div className="flex justify-between text-sm mb-1">
                                        <span className={responseType.textColor}>
                                          {percent.toFixed(1)}%
                                        </span>
                                        <span className="text-gray-600">{count} questions</span>
                                      </div>
                                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                        <div
                                          className={`h-3 rounded-full ${responseType.color}`}
                                          style={{ width: `${Math.min(percent, 100)}%` }}
                                        ></div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            <div className="mt-4 text-sm text-muted-foreground text-center">
                              Total: {leaderData.totalQuestionResponses || 0} question responses from {leaderData.feedbackCount} feedbacks
                            </div>
                          </CardContent>
                        </Card>

                        {/* Question Performance Analysis for Individual */}
                        <Card>
                          <CardHeader>
                            <CardTitle>Question Performance Analysis</CardTitle>
                            <CardDescription>
                              Mean scores for questions answered about {emailToName(selectedLeader)}
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
                                  </tr>
                                </thead>
                                <tbody>
                                  {(() => {
                                    // Calculate question metrics for this specific leader
                                    const questionMap = new Map();

                                    individualResponses.forEach(response => {
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

                                    return Array.from(questionMap.values())
                                      .map(q => {
                                        const mean = q.count > 0 ? q.sum / q.count : 0;
                                        const variance = q.count > 0 ? (q.sumSq / q.count) - (mean * mean) : 0;
                                        const stdDev = Math.sqrt(Math.max(0, variance));

                                        return {
                                          question: q.question,
                                          meanScore: parseFloat(mean.toFixed(2)),
                                          stdDev: parseFloat(stdDev.toFixed(2)),
                                          count: q.count
                                        };
                                      })
                                      .sort((a, b) => b.meanScore - a.meanScore)
                                      .map((metric, idx) => (
                                        <tr key={idx} className="border-b hover:bg-muted/50">
                                          <td className="py-3 font-medium max-w-xs truncate">
                                            {metric.question}
                                          </td>
                                          <td className="py-3">
                                            <span className={`font-bold ${metric.meanScore >= 4 ? 'text-green-600' :
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
                                        </tr>
                                      ));
                                  })()}
                                </tbody>
                              </table>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Demographic Analysis for Individual */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* <Card>
                            <CardHeader>
                              <CardTitle>Gender Analysis</CardTitle>
                              <CardDescription>
                                Response distribution by submitter gender for {emailToName(selectedLeader)}
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              {(() => {
                                // Calculate gender analysis for this specific leader
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

                                individualResponses.forEach(response => {
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
                                      switch (val) {
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

                                const totalPeople = individualResponses.length;

                                return (
                                  <div className="space-y-4">
                                    {Object.entries(result).map(([gender, data]) => {
                                      const peopleCount = data.peopleCount || 0;
                                      const percentageOfTotal = totalPeople > 0
                                        ? (peopleCount / totalPeople) * 100
                                        : 0;

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
                                          <div className="flex justify-between items-center mb-2">
                                            <span className="font-medium">{gender}</span>
                                            <div className="text-right">
                                              <div className="text-sm font-bold">{peopleCount} people</div>
                                              <div className="text-xs text-muted-foreground">
                                                {percentageOfTotal.toFixed(1)}% of respondents
                                              </div>
                                            </div>
                                          </div>

                                          <div className="mb-3">
                                            <div className="flex justify-between text-xs mb-1">
                                              <span>Average response distribution</span>
                                              <span className={`font-medium ${avgScore >= 4 ? 'text-green-600' :
                                                avgScore >= 3 ? 'text-yellow-600' : 'text-red-600'
                                                }`}>
                                                Avg: {avgScore.toFixed(1)}/5
                                              </span>
                                            </div>
                                            <div className="w-full rounded-full h-2 overflow-hidden flex border border-gray-300">
                                              <div
                                                className="bg-red-500 h-full"
                                                style={{ width: `${Math.min(responsePercentages.sd, 100)}%` }}
                                              ></div>
                                              <div
                                                className="bg-orange-400 h-full"
                                                style={{ width: `${Math.min(responsePercentages.d, 100)}%` }}
                                              ></div>
                                              <div
                                                className="bg-yellow-400 h-full"
                                                style={{ width: `${Math.min(responsePercentages.n, 100)}%` }}
                                              ></div>
                                              <div
                                                className="bg-green-400 h-full"
                                                style={{ width: `${Math.min(responsePercentages.a, 100)}%` }}
                                              ></div>
                                              <div
                                                className="bg-green-600 h-full"
                                                style={{ width: `${Math.min(responsePercentages.sa, 100)}%` }}
                                              ></div>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                );
                              })()}

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
                          </Card> */}

                          {/* Gender Analysis for Individual */}
                          {/* Gender Analysis for Individual */}
                          <Card>
                            <CardHeader>
                              <CardTitle>Gender Analysis</CardTitle>
                              <CardDescription>
                                Response distribution by submitter gender for {emailToName(selectedLeader)}
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                {(() => {
                                  const genderData = calculateGenderAnalysisByPerson();
                                  const totalPeople = stats.totalResponses;

                                  return Object.entries(genderData).map(([gender, data]) => {
                                    const peopleCount = data.peopleCount || 0;
                                    const percentageOfTotal = totalPeople > 0
                                      ? (peopleCount / totalPeople) * 100
                                      : 0;

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
                                        <div className="flex justify-between items-center mb-2">
                                          <span className="font-medium">{gender}</span>
                                          <div className="text-right">
                                            <div className="text-sm font-bold">{peopleCount} people</div>
                                          </div>
                                        </div>

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

                                        <div className="mb-3">
                                          <div className="flex justify-between text-xs mb-1">
                                            <span>Average response distribution</span>
                                            <span className={`font-medium ${avgScore >= 4 ? 'text-green-600' :
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

                                        <div className="mt-2 text-xs text-muted-foreground text-center">
                                          Avg questions per person: {data.avgQuestionsPerPerson?.toFixed(1) || 0}
                                        </div>
                                      </div>
                                    );
                                  });
                                })()}
                              </div>

                              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                                <div className="text-sm font-medium mb-1">Summary</div>
                                <div className="text-xs text-muted-foreground">
                                  Based on {stats.totalResponses} individual respondents, not question counts.
                                </div>
                              </div>

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

                          {/* Tenure Analysis for Individual */}
                          {/* Tenure Analysis for Individual */}
                          <Card>
                            <CardHeader>
                              <CardTitle>Tenure Analysis</CardTitle>
                              <CardDescription>
                                Response distribution by submitter tenure for {emailToName(selectedLeader)}
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                {(() => {
                                  const tenureData = calculateTenureAnalysisByPerson();
                                  const totalPeople = stats.totalResponses;

                                  return Object.entries(tenureData).map(([tenure, data]) => {
                                    const peopleCount = data.peopleCount || 0;
                                    const percentageOfTotal = totalPeople > 0
                                      ? (peopleCount / totalPeople) * 100
                                      : 0;

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
                                        <div className="flex justify-between items-center mb-2">
                                          <span className="font-medium">{tenure}</span>
                                          <div className="text-right">
                                            <div className="text-sm font-bold">{peopleCount} people</div>
                                          </div>
                                        </div>

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

                                        <div className="mb-3">
                                          <div className="flex justify-between text-xs mb-1">
                                            <span>Average response distribution</span>
                                            <span className={`font-medium ${avgScore >= 4 ? 'text-green-600' :
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

                                        <div className="mt-2 text-xs text-muted-foreground text-center">
                                          Avg questions per person: {data.avgQuestionsPerPerson?.toFixed(1) || 0}
                                        </div>
                                      </div>
                                    );
                                  });
                                })()}
                              </div>

                              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                                <div className="text-sm font-medium mb-1">Summary</div>
                                <div className="text-xs text-muted-foreground">
                                  Based on {stats.totalResponses} individual respondents, not question counts.
                                </div>
                              </div>

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

                        {/* Comment Sentiment Analysis for Individual */}
                        <Card>
                          <CardHeader>
                            <CardTitle>Comment Sentiment Analysis</CardTitle>
                            <CardDescription>
                              Sentiment analysis of written comments about {emailToName(selectedLeader)}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            {(() => {
                              const comments = individualResponses
                                .map(r => r['Additional Comments'] as string)
                                .filter(comment => comment && comment.trim().length > 10);

                              let positive = 0, negative = 0, neutral = 0;

                              comments.forEach(comment => {
                                const lowerComment = comment.toLowerCase();
                                const positiveWords = ['good', 'great', 'excellent', 'helpful', 'supportive', 'positive', 'thanks', 'thank', 'appreciate'];
                                const negativeWords = ['bad', 'poor', 'issue', 'problem', 'negative', 'difficult', 'concern', 'worry', 'stress'];

                                const posCount = positiveWords.filter(word => lowerComment.includes(word)).length;
                                const negCount = negativeWords.filter(word => lowerComment.includes(word)).length;

                                if (posCount > negCount) positive++;
                                else if (negCount > posCount) negative++;
                                else neutral++;
                              });

                              const total = comments.length || 1;

                              const sentimentData = [
                                { type: 'Positive', count: positive, percentage: Math.round((positive / total) * 100), color: 'bg-green-600', textColor: 'text-green-600' },
                                { type: 'Neutral', count: neutral, percentage: Math.round((neutral / total) * 100), color: 'bg-yellow-500', textColor: 'text-yellow-600' },
                                { type: 'Negative', count: negative, percentage: Math.round((negative / total) * 100), color: 'bg-red-600', textColor: 'text-red-600' }
                              ];

                              return (
                                <>
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {sentimentData.map((sentiment, idx) => (
                                      <div key={idx} className="text-center p-4 rounded-lg border">
                                        <div className={`text-2xl font-bold mb-2 ${sentiment.textColor}`}>
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
                                    Total comments analyzed: {comments.length}
                                  </div>
                                </>
                              );
                            })()}
                          </CardContent>
                        </Card>

                        {/* Risk Analysis Dashboard for Individual */}
                        <Card>
                          <CardHeader>
                            <CardTitle>Risk Analysis Dashboard</CardTitle>
                            <small><i>The Risk Score is a "concern meter" for leaders. It goes up when people strongly disagree with them (bad sign) and goes down a little when people strongly agree with them (good sign). <b>Higher score = more problems</b> with that leader's management style.</i></small>
                            <CardDescription>
                              Risk assessment for {emailToName(selectedLeader)}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="mb-6">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">Individual Risk Score</span>
                                <span className={`text-2xl font-bold ${leaderData.riskLevel === 'High' ? 'text-red-600' :
                                  leaderData.riskLevel === 'Medium' ? 'text-yellow-600' : 'text-green-600'
                                  }`}>
                                  {leaderData.riskScore || 0}/100
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-4">
                                <div
                                  className={`h-4 rounded-full ${leaderData.riskLevel === 'High' ? 'bg-red-500' :
                                    leaderData.riskLevel === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'
                                    }`}
                                  style={{ width: `${Math.min(leaderData.riskScore || 0, 100)}%` }}
                                ></div>
                              </div>
                              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                <span>Low Risk</span>
                                <span>Medium Risk</span>
                                <span>High Risk</span>
                              </div>
                            </div>

                            <div className="p-4 bg-gray-50 rounded-lg border mb-6">
                              <h5 className="font-medium mb-2 text-gray-700">Risk Factors</h5>
                              <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm">Strongly Disagree Responses</span>
                                  <span className={`font-bold ${leaderData.sdQuestionCount > 10 ? 'text-red-600' :
                                    leaderData.sdQuestionCount > 5 ? 'text-yellow-600' : 'text-green-600'
                                    }`}>
                                    {leaderData.sdQuestionCount} ({leaderData.sdQuestionPercent?.toFixed(1)}%)
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm">Strongly Agree Responses</span>
                                  <span className={`font-bold ${leaderData.saQuestionCount < 10 ? 'text-yellow-600' : 'text-green-600'}`}>
                                    {leaderData.saQuestionCount} ({leaderData.saQuestionPercent?.toFixed(1)}%)
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm">Average Score</span>
                                  <span className={`font-bold ${leaderData.avgScore >= 4 ? 'text-green-600' :
                                    leaderData.avgScore >= 3 ? 'text-yellow-600' : 'text-red-600'
                                    }`}>
                                    {leaderData.avgScore?.toFixed(1)}/5.0
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm">Risk Level</span>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${leaderData.riskLevel === 'High' ? 'bg-red-100 text-red-800' :
                                    leaderData.riskLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-green-100 text-green-800'
                                    }`}>
                                    {leaderData.riskLevel || 'Low'} Risk
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                              <h5 className="font-medium mb-2 text-blue-700">Recommended Actions</h5>
                              <ul className="space-y-2 text-sm">
                                {leaderData.riskLevel === 'High' && (
                                  <>
                                    <li className="flex items-start">
                                      <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
                                      <span>Immediate one-on-one meetings with {leaderData.sdQuestionCount} respondents</span>
                                    </li>
                                    <li className="flex items-start">
                                      <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
                                      <span>HR intervention and coaching sessions required</span>
                                    </li>
                                    <li className="flex items-start">
                                      <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
                                      <span>Consider temporary management support</span>
                                    </li>
                                  </>
                                )}
                                {leaderData.riskLevel === 'Medium' && (
                                  <>
                                    <li className="flex items-start">
                                      <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
                                      <span>Schedule feedback review session with manager</span>
                                    </li>
                                    <li className="flex items-start">
                                      <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
                                      <span>Provide leadership development resources</span>
                                    </li>
                                    <li className="flex items-start">
                                      <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
                                      <span>Follow-up survey in 30 days</span>
                                    </li>
                                  </>
                                )}
                                {leaderData.riskLevel === 'Low' && (
                                  <>
                                    <li className="flex items-start">
                                      <TrendingUp className="w-4 h-4 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                                      <span>Continue current leadership practices</span>
                                    </li>
                                    <li className="flex items-start">
                                      <TrendingUp className="w-4 h-4 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                                      <span>Share positive feedback with team</span>
                                    </li>
                                    <li className="flex items-start">
                                      <TrendingUp className="w-4 h-4 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                                      <span>Consider as mentor for other leaders</span>
                                    </li>
                                  </>
                                )}
                              </ul>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                /* GLOBAL OVERVIEW VIEW (Default when 'all' is selected) */
                <div className="space-y-6">
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
                            </tr>
                          </thead>
                          <tbody>
                            {calculateQuestionMetrics().map((metric, idx) => (
                              <tr key={idx} className="border-b hover:bg-muted/50">
                                <td className="py-3 font-medium max-w-xs truncate">
                                  {metric.question}
                                </td>
                                <td className="py-3">
                                  <span className={`font-bold ${metric.meanScore >= 4 ? 'text-green-600' :
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
                            const genderData = calculateGenderAnalysisByPerson();
                            const totalPeople = stats.totalResponses;

                            return Object.entries(genderData).map(([gender, data]) => {
                              const peopleCount = data.peopleCount || 0;
                              const percentageOfTotal = totalPeople > 0
                                ? (peopleCount / totalPeople) * 100
                                : 0;

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
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="font-medium">{gender}</span>
                                    <div className="text-right">
                                      <div className="text-sm font-bold">{peopleCount} people</div>
                                    </div>
                                  </div>

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

                                  <div className="mb-3">
                                    <div className="flex justify-between text-xs mb-1">
                                      <span>Average response distribution</span>
                                      <span className={`font-medium ${avgScore >= 4 ? 'text-green-600' :
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

                                  <div className="mt-2 text-xs text-muted-foreground text-center">
                                    Avg questions per person: {data.avgQuestionsPerPerson?.toFixed(1) || 0}
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>

                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm font-medium mb-1">Summary</div>
                          <div className="text-xs text-muted-foreground">
                            Based on {stats.totalResponses} individual respondents, not question counts.
                          </div>
                        </div>

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

                    {/* Tenure Analysis */}
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
                            const tenureData = calculateTenureAnalysisByPerson();
                            const totalPeople = stats.totalResponses;

                            return Object.entries(tenureData).map(([tenure, data]) => {
                              const peopleCount = data.peopleCount || 0;
                              const percentageOfTotal = totalPeople > 0
                                ? (peopleCount / totalPeople) * 100
                                : 0;

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
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="font-medium">{tenure}</span>
                                    <div className="text-right">
                                      <div className="text-sm font-bold">{peopleCount} people</div>
                                    </div>
                                  </div>

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

                                  <div className="mb-3">
                                    <div className="flex justify-between text-xs mb-1">
                                      <span>Average response distribution</span>
                                      <span className={`font-medium ${avgScore >= 4 ? 'text-green-600' :
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

                                  <div className="mt-2 text-xs text-muted-foreground text-center">
                                    Avg questions per person: {data.avgQuestionsPerPerson?.toFixed(1) || 0}
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>

                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm font-medium mb-1">Summary</div>
                          <div className="text-xs text-muted-foreground">
                            Based on {stats.totalResponses} individual respondents, not question counts.
                          </div>
                        </div>

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
                            <div className={`text-2xl font-bold mb-2 ${sentiment.type === 'Positive' ? 'text-green-600' :
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

                  {/* Risk Analysis Dashboard */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Risk Analysis Dashboard</CardTitle>
                      <small><i>The Risk Score is a "concern meter" for leaders. It goes up when people strongly disagree with them (bad sign) and goes down a little when people strongly agree with them (good sign). <b>Higher score = more problems</b> with that leader's management style.</i></small>

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
                            className={`h-4 rounded-full ${calculateGlobalRiskScore() > 70 ? 'bg-red-500' :
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
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${leader.actionNeeded === 'High' ? 'bg-red-100 text-red-800' :
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
              )}
            </div>
          </TabsContent>

          {/* Logs Tab - COMPLETELY UNCHANGED from your original code */}
          <TabsContent value="logs" className="space-y-6">
            <div className="animate-fade-in">
              <h2 className="text-2xl font-bold text-foreground mb-4">Complete Response Data</h2>

              <Card>
                <CardContent className="pt-6">
                  {/* Enhanced Filter Controls */}
                  <div className="flex flex-col gap-6 mb-6">
                    {/* Top controls bar */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex items-center gap-2">
                        <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                          {filteredResponses.length} records
                        </div>
                        <div className="text-sm text-muted-foreground">
                          72 columns • Page {currentPage} of {totalPages}
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {/* Add Filter Button for Mobile */}
                        <div className="sm:hidden">
                          <Button variant="outline" size="sm">
                            <Filter className="w-4 h-4 mr-2" />
                            Filters ({Object.values(filters).filter(f => f !== '').length})
                          </Button>
                        </div>

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
                          onClick={loadAllData}
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

                    {/* Filter Grid - Only show on desktop or when expanded */}
                    <div className="hidden sm:grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 p-4 bg-muted/30 rounded-lg border">
                      {/* Role Reviewed Filter */}
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">
                          Role Reviewed
                        </label>
                        <select
                          value={filters.role}
                          onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
                          className="w-full px-3 py-1.5 text-sm border rounded-md bg-background"
                        >
                          <option value="">All Roles</option>
                          {Array.from(new Set(responses.map(r => r['Role Reviewed']).filter(Boolean)))
                            .sort()
                            .map(role => (
                              <option key={role as string} value={role as string}>
                                {role as string}
                              </option>
                            ))}
                        </select>
                      </div>

                      {/* Gender Filter */}
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">
                          Gender
                        </label>
                        <select
                          value={filters.gender}
                          onChange={(e) => setFilters(prev => ({ ...prev, gender: e.target.value }))}
                          className="w-full px-3 py-1.5 text-sm border rounded-md bg-background"
                        >
                          <option value="">All Genders</option>
                          {Array.from(new Set(responses.map(r => r['Gender']).filter(Boolean)))
                            .sort()
                            .map(gender => (
                              <option key={gender as string} value={gender as string}>
                                {gender as string}
                              </option>
                            ))}
                        </select>
                      </div>

                      {/* Tenure Filter */}
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">
                          Tenure
                        </label>
                        <select
                          value={filters.tenure}
                          onChange={(e) => setFilters(prev => ({ ...prev, tenure: e.target.value }))}
                          className="w-full px-3 py-1.5 text-sm border rounded-md bg-background"
                        >
                          <option value="">All Tenures</option>
                          <option value="0-1">0-1 Year</option>
                          <option value="1-3">1-3 Years</option>
                          <option value="3-5">3-5 Years</option>
                          <option value="5+">5+ Years</option>
                          <option value="unknown">Unknown</option>
                        </select>
                      </div>

                      {/* Designation/Level Filter */}
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">
                          Designation/Level
                        </label>
                        <select
                          value={filters.designation}
                          onChange={(e) => setFilters(prev => ({ ...prev, designation: e.target.value }))}
                          className="w-full px-3 py-1.5 text-sm border rounded-md bg-background"
                        >
                          <option value="">All Levels</option>
                          {Array.from(new Set(responses.map(r => r['Designation/Level']).filter(Boolean)))
                            .sort()
                            .map(level => (
                              <option key={level as string} value={level as string}>
                                {level as string}
                              </option>
                            ))}
                        </select>
                      </div>

                      {/* Age Filter */}
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">
                          Age
                        </label>
                        <select
                          value={filters.age}
                          onChange={(e) => setFilters(prev => ({ ...prev, age: e.target.value }))}
                          className="w-full px-3 py-1.5 text-sm border rounded-md bg-background"
                        >
                          <option value="">All Ages</option>
                          {Array.from(new Set(responses.map(r => r['Age']).filter(Boolean)))
                            .sort((a, b) => Number(a) - Number(b))
                            .map(age => (
                              <option key={age as string} value={age as string}>
                                {age as string}
                              </option>
                            ))}
                        </select>
                      </div>

                      {/* Rating Filter */}
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">
                          Rating
                        </label>
                        <select
                          value={filters.rating}
                          onChange={(e) => setFilters(prev => ({ ...prev, rating: e.target.value }))}
                          className="w-full px-3 py-1.5 text-sm border rounded-md bg-background"
                        >
                          <option value="">All Ratings</option>
                          <option value="1">1 - Very Poor</option>
                          <option value="2">2 - Poor</option>
                          <option value="3">3 - Average</option>
                          <option value="4">4 - Good</option>
                          <option value="5">5 - Excellent</option>
                        </select>
                      </div>

                      {/* Process Filter */}
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">
                          Process
                        </label>
                        <select
                          value={filters.process}
                          onChange={(e) => setFilters(prev => ({ ...prev, process: e.target.value }))}
                          className="w-full px-3 py-1.5 text-sm border rounded-md bg-background"
                        >
                          <option value="">All Processes</option>
                          {Array.from(new Set(responses.map(r => r['Process']).filter(Boolean)))
                            .sort()
                            .map(process => (
                              <option key={process as string} value={process as string}>
                                {process as string}
                              </option>
                            ))}
                        </select>
                      </div>

                      {/* Gender of the user Filter */}
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">
                          Gender of User
                        </label>
                        <select
                          value={filters.genderOfUser}
                          onChange={(e) => setFilters(prev => ({ ...prev, genderOfUser: e.target.value }))}
                          className="w-full px-3 py-1.5 text-sm border rounded-md bg-background"
                        >
                          <option value="">All</option>
                          {Array.from(new Set(responses.map(r => r['Gender of the user']).filter(Boolean)))
                            .sort()
                            .map(gender => (
                              <option key={gender as string} value={gender as string}>
                                {gender as string}
                              </option>
                            ))}
                        </select>
                      </div>

                      {/* Management Email Filter */}
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">
                          Management Email
                        </label>
                        <select
                          value={filters.managementEmail}
                          onChange={(e) => setFilters(prev => ({ ...prev, managementEmail: e.target.value }))}
                          className="w-full px-3 py-1.5 text-sm border rounded-md bg-background"
                        >
                          <option value="">All Managers</option>
                          {Array.from(new Set(responses.map(r => r['Management Email ID']).filter(Boolean)))
                            .sort()
                            .map(email => (
                              <option key={email as string} value={email as string}>
                                {(email as string).split('@')[0]}
                              </option>
                            ))}
                        </select>
                      </div>

                      {/* Time Period Filter */}
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">
                          Time Period
                        </label>
                        <select
                          value={filters.timePeriod}
                          onChange={(e) => setFilters(prev => ({ ...prev, timePeriod: e.target.value }))}
                          className="w-full px-3 py-1.5 text-sm border rounded-md bg-background"
                        >
                          <option value="">All Time</option>
                          <option value="today">Today</option>
                          <option value="week">This Week</option>
                          <option value="month">This Month</option>
                          <option value="quarter">This Quarter</option>
                          <option value="year">This Year</option>
                        </select>
                      </div>

                      {/* Clear Filters Button */}
                      <div className="lg:col-span-5 flex justify-end items-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setFilters({
                            role: '',
                            gender: '',
                            tenure: '',
                            designation: '',
                            age: '',
                            rating: '',
                            process: '',
                            genderOfUser: '',
                            managementEmail: '',
                            timePeriod: ''
                          })}
                          className="text-xs"
                        >
                          Clear All Filters
                        </Button>
                      </div>
                    </div>

                    {/* Active Filters Display */}
                    {Object.values(filters).some(f => f !== '') && (
                      <div className="flex flex-wrap gap-2 items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <span className="text-sm font-medium text-blue-700">Active Filters:</span>
                        {Object.entries(filters).map(([key, value]) => {
                          if (!value) return null;

                          let displayValue = value;
                          if (key === 'managementEmail' && value) {
                            displayValue = value.split('@')[0];
                          } else if (key === 'tenure') {
                            const tenureMap: Record<string, string> = {
                              '0-1': '0-1 Year',
                              '1-3': '1-3 Years',
                              '3-5': '3-5 Years',
                              '5+': '5+ Years',
                              'unknown': 'Unknown Tenure'
                            };
                            displayValue = tenureMap[value] || value;
                          } else if (key === 'timePeriod') {
                            const timeMap: Record<string, string> = {
                              'today': 'Today',
                              'week': 'This Week',
                              'month': 'This Month',
                              'quarter': 'This Quarter',
                              'year': 'This Year'
                            };
                            displayValue = timeMap[value] || value;
                          } else if (key === 'rating') {
                            const ratingMap: Record<string, string> = {
                              '1': 'Rating: 1',
                              '2': 'Rating: 2',
                              '3': 'Rating: 3',
                              '4': 'Rating: 4',
                              '5': 'Rating: 5'
                            };
                            displayValue = ratingMap[value] || `Rating: ${value}`;
                          }

                          const filterLabels: Record<string, string> = {
                            'role': 'Role',
                            'gender': 'Gender',
                            'tenure': 'Tenure',
                            'designation': 'Designation',
                            'age': 'Age',
                            'rating': 'Rating',
                            'process': 'Process',
                            'genderOfUser': 'User Gender',
                            'managementEmail': 'Manager',
                            'timePeriod': 'Time Period'
                          };

                          return (
                            <div
                              key={key}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                            >
                              <span className="font-medium">{filterLabels[key]}:</span>
                              <span>{displayValue}</span>
                              <button
                                onClick={() => setFilters(prev => ({ ...prev, [key]: '' }))}
                                className="ml-1 text-blue-600 hover:text-blue-800"
                              >
                                ×
                              </button>
                            </div>
                          );
                        })}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setFilters({
                            role: '',
                            gender: '',
                            tenure: '',
                            designation: '',
                            age: '',
                            rating: '',
                            process: '',
                            genderOfUser: '',
                            managementEmail: '',
                            timePeriod: ''
                          })}
                          className="ml-auto text-xs h-7"
                        >
                          Clear All
                        </Button>
                      </div>
                    )}
                  </div>

                  {filteredResponses.length === 0 ? (
                    <div className="text-center py-12 border rounded-lg">
                      <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No data available</h3>
                      <p className="text-muted-foreground mb-4">
                        {responses.length === 0
                          ? "No response data found in Google Sheets"
                          : "No records match your filters"}
                      </p>
                      <Button onClick={loadAllData}>
                        Load Data
                      </Button>
                      {Object.values(filters).some(f => f !== '') && (
                        <Button
                          variant="outline"
                          onClick={() => setFilters({
                            role: '',
                            gender: '',
                            tenure: '',
                            designation: '',
                            age: '',
                            rating: '',
                            process: '',
                            genderOfUser: '',
                            managementEmail: '',
                            timePeriod: ''
                          })}
                          className="mt-2 sm:mt-0"
                        >
                          Clear Filters
                        </Button>
                      )}
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
                              {currentLogs.map((response, rowIndex) => (
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
                                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs ${typeof response['Rating'] === 'number'
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
                          Showing {Math.min(itemsPerPage, filteredResponses.length - (currentPage - 1) * itemsPerPage)} of {filteredResponses.length} rows
                          {responses.length !== filteredResponses.length && (
                            <span className="text-blue-600 ml-2">
                              (Filtered from {responses.length} total)
                            </span>
                          )}
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
                    {pendingUsers} employees haven't submitted feedback yet.
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