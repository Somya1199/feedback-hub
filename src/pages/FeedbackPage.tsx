// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { ArrowLeft, ChevronRight, Loader2, AlertCircle, CheckCircle2, RefreshCw, User } from 'lucide-react';
// import { Button } from '@/components/ui/button';
// import { Textarea } from '@/components/ui/textarea';
// import { Progress } from '@/components/ui/progress';
// import { useToast } from '@/hooks/use-toast';
// import { fetchSurveyQuestions, fetchManagementMapping, submitFeedback, getCurrentUserEmail, checkBackendHealth } from '@/services/sheetsApi';
// import {
//   saveFeedbackSubmission,
//   canSubmitFeedback,
//   getCooldownEndDate,
//   formatCooldownMessage,
//   clearOldSubmissions
// } from '@/utils/feedbackStorage';

// interface Question {
//   question_id: string;
//   question_text: string;
//   question_type: string;
//   options: string[];
//   category: string;
//   required: boolean;
// }

// interface FeedbackTarget {
//   email: string;
//   name: string;
//   process: string;
//   role: string;
// }

// interface FeedbackTargets {
//   [key: string]: FeedbackTarget[];
// }

// interface MappingData {
//   Ldap: string;
//   Email: string;
//   Process: string;
//   POC: string;
//   Manager: string;
//   'Account manager': string;
// }

// interface UserData {
//   email: string;
//   name: string;
//   process: string;
//   ldap?: string;
// }

// type FeedbackStep = 'loading' | 'select-target' | 'questions' | 'success';

// const FeedbackPage = () => {
//   const navigate = useNavigate();
//   const { toast } = useToast();

//   const [step, setStep] = useState<FeedbackStep>('loading');
//   const [targets, setTargets] = useState<FeedbackTargets>({});
//   const [questions, setQuestions] = useState<Question[]>([]);
//   const [error, setError] = useState<string | null>(null);

//   // User data state
//   const [userData, setUserData] = useState<UserData | null>(null);

//   const [selectedRole, setSelectedRole] = useState('');
//   const [selectedTarget, setSelectedTarget] = useState<FeedbackTarget | null>(null);
//   const [answers, setAnswers] = useState<Record<string, string>>({});
//   const [comments, setComments] = useState('');
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   // Function to get user's display name from email
//  const getDisplayName = (email: string): string => {
//   if (!email.includes('@')) return email;

//   const namePart = email.split('@')[0];
//   return namePart
//     .replace(/\./g, ' ')
//     .replace(/_/g, ' ')
//     .replace(/\b\w/g, l => l.toUpperCase());
// };

// // Use only one of these useEffect hooks:

// // Option 1: Using async/await inside useEffect
// useEffect(() => {
//   const loadData = async () => {
//     await identifyUserAndLoadData();
//   };

//   loadData();
// }, []);

// // Option 2: Simpler version if identifyUserAndLoadData returns a promise
// // useEffect(() => {
// //   identifyUserAndLoadData();
// // }, []);

//   // Function to get color classes for rating buttons
//   const getRatingButtonClasses = (option: string, isSelected: boolean) => {
//     const baseClasses = 'px-4 py-2 rounded border font-medium transition-all duration-200';
//     const selectedClasses = 'ring-2 ring-offset-1 scale-105 shadow-md';

//     switch (option) {
//       case 'Strongly Disagree':
//         return `${baseClasses} ${isSelected 
//           ? `${selectedClasses} bg-red-600 text-white border-red-700 ring-red-500 hover:bg-red-700` 
//           : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100 hover:border-red-300'}`;

//       case 'Disagree':
//         return `${baseClasses} ${isSelected 
//           ? `${selectedClasses} bg-orange-500 text-white border-orange-600 ring-orange-400 hover:bg-orange-600` 
//           : 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100 hover:border-orange-300'}`;

//       case 'Neutral':
//         return `${baseClasses} ${isSelected 
//           ? `${selectedClasses} bg-yellow-500 text-white border-yellow-600 ring-yellow-400 hover:bg-yellow-600` 
//           : 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100 hover:border-yellow-300'}`;

//       case 'Agree':
//         return `${baseClasses} ${isSelected 
//           ? `${selectedClasses} bg-green-500 text-white border-green-600 ring-green-400 hover:bg-green-600` 
//           : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:border-green-300'}`;

//       case 'Strongly Agree':
//         return `${baseClasses} ${isSelected 
//           ? `${selectedClasses} bg-emerald-600 text-white border-emerald-700 ring-emerald-500 hover:bg-emerald-700` 
//           : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300'}`;

//       default:
//         return `${baseClasses} ${isSelected 
//           ? `${selectedClasses} bg-primary text-primary-foreground border-primary` 
//           : 'bg-background border-input hover:bg-accent'}`;
//     }
//   };

//   const getCategoryForQuestion = (questionText: string): string => {
//     const text = questionText.toLowerCase();

//     if (text.includes('support') || text.includes('guidance') || text.includes('well-being') || text.includes('work-life')) {
//       return 'Support & Approachability';
//     } else if (text.includes('workload') || text.includes('task') || text.includes('deadline') || text.includes('capacity')) {
//       return 'Workload & Task Management';
//     } else if (text.includes('leadership') || text.includes('direction') || text.includes('decision') || text.includes('motivation')) {
//       return 'Leadership & Direction';
//     } else if (text.includes('feedback') || text.includes('performance') || text.includes('recognition') || text.includes('goal')) {
//       return 'Feedback & Performance Management';
//     } else if (text.includes('fair') || text.includes('respect') || text.includes('favoritism') || text.includes('inclusion')) {
//       return 'Fairness & Respect';
//     } else if (text.includes('team') || text.includes('culture') || text.includes('collaboration') || text.includes('trust')) {
//       return 'Team Culture & Environment';
//     } else if (text.includes('problem') || text.includes('roadblock') || text.includes('issue') || text.includes('analytical')) {
//       return 'Problem-Solving & Decision Support';
//     } else if (text.includes('accountability') || text.includes('responsibility') || text.includes('commitment') || text.includes('ownership')) {
//       return 'Accountability';
//     } else if (text.includes('overall') || text.includes('experience') || text.includes('satisfaction')) {
//       return 'Overall Experience';
//     }

//     return 'General';
//   };

//   const transformQuestionsData = (data: any[]): Question[] => {
//     if (!data || data.length === 0) {
//       console.log('No data received from Google Sheets');
//       return [];
//     }

//     console.log('📊 Processing questions from Google Sheets...');
//     console.log('Total rows received:', data.length);

//     const questionsList: Question[] = [];
//     let currentCategory = 'General';
//     let questionCount = 0;

//     // The key for the column (might vary)
//     const columnKey = Object.keys(data[0] || {})[0] || 'Topic: Support & Approachability';
//     console.log(`Using column key: "${columnKey}"`);

//     // Process each row
//     data.forEach((row, rowIndex) => {
//       const cellValue = row[columnKey] || '';
//       if (typeof cellValue !== 'string') return;

//       const text = cellValue.trim();
//       if (!text) return;

//       // Check if this is a topic header
//       if (text.toLowerCase().startsWith('topic:')) {
//         currentCategory = text.replace('Topic:', '').trim();
//         console.log(`  → Category set to: ${currentCategory}`);
//         return;
//       }

//       // Skip rating options (they should be in separate columns, not rows)
//       if (text === 'Strongly disagree' ||
//         text === 'disagree' ||
//         text === 'neutral' ||
//         text === 'agree' ||
//         text === 'Strongly agree' ||
//         text.toLowerCase().includes('strongly disagree') ||
//         text.toLowerCase().includes('strongly agree')) {
//         return;
//       }

//       // Skip section headers and demographics
//       if (text.toLowerCase().includes('about you') ||
//         text.toLowerCase().includes('your role') ||
//         text.toLowerCase().includes('overall rating') ||
//         text.toLowerCase().includes('gender') ||
//         text.toLowerCase().includes('tenure') ||
//         text.toLowerCase().includes('designation') ||
//         text.toLowerCase().includes('level') ||
//         text.toLowerCase().includes('age') ||
//         text.length < 5) {
//         return;
//       }

//       if (text.length >= 10 && !text.toLowerCase().startsWith('topic:')) {
//         questionCount++;
//         questionsList.push({
//           question_id: `q${questionCount}`,
//           question_text: text,
//           question_type: 'rating',
//           options: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'],
//           category: currentCategory,
//           required: true
//         });
//       }
//     });

//     console.log(`\n✅ Successfully extracted ${questionsList.length} questions`);
//     return questionsList;
//   };

//   // const transformMappingData = (data: any[], userEmail: string): { targets: FeedbackTargets, userData: UserData | null } => {
//   //   const targetsData: FeedbackTargets = {
//   //     'POC': [],
//   //     'Manager': [],
//   //     'Account Manager': []
//   //   };

//   //   let userMapping: MappingData | null = null;

//   //   // Find user in mapping data
//   //   data.forEach((item) => {
//   //     // Check both Email and Ldap columns (case-insensitive)
//   //     const itemEmail = item.Email || '';
//   //     const itemLdap = item.Ldap || '';
//   //     const userEmailLower = userEmail.toLowerCase();

//   //     if (itemEmail.toLowerCase() === userEmailLower || 
//   //         itemLdap.toLowerCase() === userEmailLower ||
//   //         `${itemLdap}@${userEmail.split('@')[1]}`.toLowerCase() === userEmailLower) {
//   //       userMapping = item;
//   //     }
//   //   });

//   //   console.log('User mapping found:', userMapping);

//   //   if (!userMapping) {
//   //     console.warn(`No mapping found for user: ${userEmail}`);
//   //     return { targets: targetsData, userData: null };
//   //   }

//   //   // Extract user data
//   //   const userProcess = userMapping.Process || 'General';
//   //   const userEmailFromMapping = userMapping.Email || userEmail;
//   //   const userDisplayName = getDisplayName(userEmailFromMapping);

//   //   const userDataResult: UserData = {
//   //     email: userEmailFromMapping,
//   //     name: userDisplayName,
//   //     process: userProcess,
//   //     ldap: userMapping.Ldap || undefined
//   //   };

//   //   // Only add targets that exist for this user
//   //   if (userMapping.POC && userMapping.POC.includes('@')) {
//   //     targetsData['POC'].push({
//   //       email: userMapping.POC,
//   //       name: getDisplayName(userMapping.POC),
//   //       process: userProcess,
//   //       role: 'POC'
//   //     });
//   //   }

//   //   if (userMapping.Manager && userMapping.Manager.includes('@')) {
//   //     targetsData['Manager'].push({
//   //       email: userMapping.Manager,
//   //       name: getDisplayName(userMapping.Manager),
//   //       process: userProcess,
//   //       role: 'Manager'
//   //     });
//   //   }

//   //   if (userMapping['Account manager'] && userMapping['Account manager'].includes('@')) {
//   //     targetsData['Account Manager'].push({
//   //       email: userMapping['Account manager'],
//   //       name: getDisplayName(userMapping['Account manager']),
//   //       process: userProcess,
//   //       role: 'Account Manager'
//   //     });
//   //   }

//   //   console.log('Transformed targets for user:', {
//   //     user: userDataResult,
//   //     POC: targetsData['POC'].map(t => ({ name: t.name, email: t.email })),
//   //     Manager: targetsData['Manager'].map(t => ({ name: t.name, email: t.email })),
//   //     AccountManager: targetsData['Account Manager'].map(t => ({ name: t.name, email: t.email }))
//   //   });

//   //   return { targets: targetsData, userData: userDataResult };
//   // };

//   // const identifyUserAndLoadData = async () => {
//   //   setStep('loading');

//   //   try {
//   //     console.log('Starting user identification and data load...');

//   //     // Step 1: Get current user's email from Google
//   //     const userResult = await getGoogleUserInfo();
//   //     console.log('Google User API result:', userResult);

//   //     if (!userResult.success || !userResult.email) {
//   //       console.log('Trying alternative method to get user email...');

//   //       // Alternative method: Get from Google Script
//   //       try {
//   //         const scriptResponse = await fetch('https://script.google.com/macros/s/AKfycbwT2q8gVx5KHf5R8x-3-7Gz4Lp5Vq3v9Q6m8W9d/exec?action=getUserInfo');
//   //         if (scriptResponse.ok) {
//   //           const scriptData = await scriptResponse.json();
//   //           if (scriptData.email) {
//   //             userResult.email = scriptData.email;
//   //             userResult.success = true;
//   //           }
//   //         }
//   //       } catch (scriptError) {
//   //         console.log('Google Script method failed:', scriptError);
//   //       }

//   //       if (!userResult.success) {
//   //         // If all methods fail, show a message but continue
//   //         console.warn('Could not automatically get user email. Using fallback method.');
//   //         toast({
//   //           title: 'Info',
//   //           description: 'Could not identify your Google account. Showing all available targets.',
//   //           variant: 'default',
//   //         });

//   //         // Load data without user filtering
//   //         await loadDataWithoutUserFilter();
//   //         return;
//   //       }
//   //     }

//   //     const userEmail = userResult.email;
//   //     console.log('Identified user email:', userEmail);

//   //     if (!userEmail || !userEmail.includes('@')) {
//   //       throw new Error('Invalid user email format. Please contact administrator.');
//   //     }

//   //     // Step 2: Load questions
//   //     const questionsResult = await fetchSurveyQuestions();
//   //     console.log('Questions API result:', questionsResult);

//   //     if (questionsResult.success && questionsResult.data) {
//   //       const transformedQuestions = transformQuestionsData(questionsResult.data);
//   //       console.log('Transformed questions:', transformedQuestions.length);
//   //       setQuestions(transformedQuestions);
//   //     } else {
//   //       console.error('Questions API error:', questionsResult.error);
//   //       throw new Error(questionsResult.error || 'Failed to load questions');
//   //     }

//   //     // Step 3: Load mapping and filter for current user
//   //     const mappingResult = await fetchManagementMapping();
//   //     console.log('Mapping result:', mappingResult);

//   //     if (mappingResult.success && mappingResult.data) {
//   //       const { targets: filteredTargets, userData: userDataResult } = transformMappingData(mappingResult.data, userEmail);

//   //       if (!userDataResult) {
//   //         // User not found in mapping - show all targets with a warning
//   //         console.log(`User ${userEmail} not found in mapping. Showing all targets.`);
//   //         toast({
//   //           title: 'Info',
//   //           description: 'Your email was not found in the system. Showing all available targets.',
//   //           variant: 'default',
//   //         });

//   //         // Show all targets
//   //         const allTargets = getAllTargets(mappingResult.data);
//   //         setTargets(allTargets);
//   //         setUserData({
//   //           email: userEmail,
//   //           name: getDisplayName(userEmail),
//   //           process: 'General'
//   //         });
//   //       } else {
//   //         // User found - show filtered targets
//   //         setTargets(filteredTargets);
//   //         setUserData(userDataResult);
//   //       }

//   //       setStep('select-target');
//   //     } else {
//   //       throw new Error(mappingResult.error || 'Failed to load management data');
//   //     }
//   //   } catch (err) {
//   //     console.error('Error loading data:', err);
//   //     setError(err instanceof Error ? err.message : 'Failed to load feedback data');
//   //     toast({
//   //       title: 'Data Load Error',
//   //       description: `Error: ${err instanceof Error ? err.message : 'Unknown error'}`,
//   //       variant: 'destructive',
//   //     });
//   //   }
//   // };

//   // SIMPLE VERSION - Add this function to FeedbackPage.tsx

// // const identifyUserAndLoadData = async () => {
// //   setStep('loading');

// //   try {
// //     console.log('Starting user identification and data load...');

// //     // SIMPLE METHOD: Get user from URL or localStorage
// //     let userEmail = '';

// //     // Method 1: Try to get from URL (if you pass it from another page)
// //     const urlParams = new URLSearchParams(window.location.search);
// //     const emailFromUrl = urlParams.get('userEmail') || urlParams.get('email');
// //     if (emailFromUrl && emailFromUrl.includes('@')) {
// //       userEmail = emailFromUrl;
// //       console.log('Got email from URL:', userEmail);
// //       localStorage.setItem('userEmail', userEmail);
// //     }

// //     // Method 2: Try localStorage
// //     if (!userEmail) {
// //       userEmail = localStorage.getItem('userEmail') || '';
// //       console.log('Got email from localStorage:', userEmail);
// //     }

// //     // Method 3: If still no email, ask for it (but store for next time)
// //     if (!userEmail || !userEmail.includes('@')) {
// //       // For testing, set a default user from your mapping sheet
// //       userEmail = 'somya@highspring.in'; // Change to your test user
// //       console.log('Using default test email:', userEmail);
// //       localStorage.setItem('userEmail', userEmail);

// //       // OR uncomment this to ask user once, then remember:
// //       // const enteredEmail = prompt('Please enter your email address:');
// //       // if (enteredEmail && enteredEmail.includes('@')) {
// //       //   userEmail = enteredEmail;
// //       //   localStorage.setItem('userEmail', userEmail);
// //       //   console.log('User entered email:', userEmail);
// //       // } else {
// //       //   throw new Error('Please enter a valid email address');
// //       // }
// //     }

// //     console.log('Final user email:', userEmail);

// //     // Rest of your loading logic...
// //     const questionsResult = await fetchSurveyQuestions();
// //     // ... continue with your existing loading logic

// //   } catch (err) {
// //     console.error('Error loading data:', err);
// //     setError(err instanceof Error ? err.message : 'Failed to load feedback data');
// //     toast({
// //       title: 'Data Load Error',
// //       description: `Error: ${err instanceof Error ? err.message : 'Unknown error'}`,
// //       variant: 'destructive',
// //     });
// //   }
// // };

// // const identifyUserAndLoadData = async () => {
// //   setStep('loading');

// //   try {
// //     console.log('Starting user identification and data load...');

// //     // SIMPLE METHOD: Get user from URL or localStorage
// //     let userEmail = '';

// //     // Method 1: Try to get from URL (if you pass it from another page)
// //     const urlParams = new URLSearchParams(window.location.search);
// //     const emailFromUrl = urlParams.get('userEmail') || urlParams.get('email');
// //     if (emailFromUrl && emailFromUrl.includes('@')) {
// //       userEmail = emailFromUrl;
// //       console.log('Got email from URL:', userEmail);
// //       localStorage.setItem('userEmail', userEmail);
// //     }

// //     // Method 2: Try localStorage
// //     if (!userEmail) {
// //       userEmail = localStorage.getItem('userEmail') || '';
// //       console.log('Got email from localStorage:', userEmail);
// //     }

// //     // Method 3: If still no email, use a default for testing
// //     if (!userEmail || !userEmail.includes('@')) {
// //       // Use the first user from your mapping sheet as default
// //       userEmail = 'somya@highspring.in';
// //       console.log('Using default test email:', userEmail);
// //       localStorage.setItem('userEmail', userEmail);
// //     }

// //     console.log('Final user email:', userEmail);

// //     // Step 1: Load questions
// //     console.log('Loading questions...');
// //     const questionsResult = await fetchSurveyQuestions();
// //     console.log('Questions API result:', questionsResult);

// //     if (questionsResult.success && questionsResult.data) {
// //       const transformedQuestions = transformQuestionsData(questionsResult.data);
// //       console.log('Transformed questions count:', transformedQuestions.length);
// //       console.log('Sample questions:', transformedQuestions.slice(0, 3));
// //       setQuestions(transformedQuestions);

// //       if (transformedQuestions.length === 0) {
// //         console.warn('No questions were extracted from the data');
// //         toast({
// //           title: 'Warning',
// //           description: 'No questions found in the survey data.',
// //           variant: 'destructive',
// //         });
// //       }
// //     } else {
// //       console.error('Questions API error:', questionsResult.error);
// //       throw new Error(questionsResult.error || 'Failed to load questions');
// //     }

// //     // Step 2: Load mapping and filter for current user
// //     console.log('Loading management mapping...');
// //     const mappingResult = await fetchManagementMapping();
// //     console.log('Mapping API result:', mappingResult);

// //     if (mappingResult.success && mappingResult.data) {
// //       console.log('Mapping data received, rows:', mappingResult.data.length);
// //       console.log('First few mapping rows:', mappingResult.data.slice(0, 3));

// //       const { targets: filteredTargets, userData: userDataResult } = transformMappingData(mappingResult.data, userEmail);

// //       console.log('Transformation result:', {
// //         hasUserData: !!userDataResult,
// //         userData: userDataResult,
// //         pocCount: filteredTargets['POC']?.length || 0,
// //         managerCount: filteredTargets['Manager']?.length || 0,
// //         accountManagerCount: filteredTargets['Account Manager']?.length || 0
// //       });

// //       if (!userDataResult) {
// //         // User not found in mapping - show all targets
// //         console.log(`User ${userEmail} not found in mapping. Showing all targets.`);
// //         toast({
// //           title: 'Info',
// //           description: 'Your email was not found in the system. Showing all available targets.',
// //           variant: 'default',
// //         });

// //         // Show all targets
// //         const allTargets = getAllTargets(mappingResult.data);
// //         console.log('All targets:', {
// //           pocCount: allTargets['POC']?.length || 0,
// //           managerCount: allTargets['Manager']?.length || 0,
// //           accountManagerCount: allTargets['Account Manager']?.length || 0
// //         });

// //         setTargets(allTargets);
// //         setUserData({
// //           email: userEmail,
// //           name: getDisplayName(userEmail),
// //           process: 'General'
// //         });
// //       } else {
// //         // User found - show filtered targets
// //         console.log('Setting filtered targets for user:', userDataResult.name);
// //         setTargets(filteredTargets);
// //         setUserData(userDataResult);
// //       }

// //       // Move to next step
// //       console.log('Moving to select-target step...');
// //       setStep('select-target');

// //     } else {
// //       console.error('Mapping API error:', mappingResult.error);
// //       throw new Error(mappingResult.error || 'Failed to load management data');
// //     }

// //   } catch (err) {
// //     console.error('Error in identifyUserAndLoadData:', err);
// //     setError(err instanceof Error ? err.message : 'Failed to load feedback data');

// //     // Try to load without user filter as fallback
// //     console.log('Trying fallback: load data without user filter...');
// //     try {
// //       await loadDataWithoutUserFilter();
// //     } catch (fallbackError) {
// //       console.error('Fallback also failed:', fallbackError);
// //       toast({
// //         title: 'Data Load Error',
// //         description: `Error: ${err instanceof Error ? err.message : 'Unknown error'}`,
// //         variant: 'destructive',
// //       });
// //     }
// //   }
// // };

// const transformMappingData = (data: any[], userEmail: string): { targets: FeedbackTargets, userData: UserData | null } => {
//   console.log('transformMappingData called with:', {
//     dataLength: data.length,
//     userEmail
//   });

//   const targetsData: FeedbackTargets = {
//     'POC': [],
//     'Manager': [],
//     'Account Manager': []
//   };

//   let userMapping: MappingData | null = null;

//   // Find user in mapping data
//   console.log('Searching for user in mapping data...');
//   data.forEach((item, index) => {
//     // Check both Email and Ldap columns (case-insensitive)
//     const itemEmail = item.Email || '';
//     const itemLdap = item.Ldap || '';
//     const userEmailLower = userEmail.toLowerCase();

//     console.log(`Row ${index}:`, {
//       itemEmail,
//       itemLdap,
//       matchesEmail: itemEmail.toLowerCase() === userEmailLower,
//       matchesLdap: itemLdap.toLowerCase() === userEmailLower
//     });

//     if (itemEmail.toLowerCase() === userEmailLower || 
//         itemLdap.toLowerCase() === userEmailLower) {
//       userMapping = item;
//       console.log('Found matching user at row', index, ':', item);
//     }
//   });

//   console.log('User mapping found:', userMapping);

//   if (!userMapping) {
//     console.warn(`No mapping found for user: ${userEmail}`);
//     return { targets: targetsData, userData: null };
//   }

//   // Extract user data
//   const userProcess = userMapping.Process || 'General';
//   const userEmailFromMapping = userMapping.Email || userEmail;
//   const userDisplayName = getDisplayName(userEmailFromMapping);

//   const userDataResult: UserData = {
//     email: userEmailFromMapping,
//     name: userDisplayName,
//     process: userProcess,
//     ldap: userMapping.Ldap || undefined
//   };

//   console.log('Creating targets for user...');

//   // Only add targets that exist for this user
//   if (userMapping.POC && userMapping.POC.includes('@')) {
//     console.log('Adding POC:', userMapping.POC);
//     targetsData['POC'].push({
//       email: userMapping.POC,
//       name: getDisplayName(userMapping.POC),
//       process: userProcess,
//       role: 'POC'
//     });
//   }

//   if (userMapping.Manager && userMapping.Manager.includes('@')) {
//     console.log('Adding Manager:', userMapping.Manager);
//     targetsData['Manager'].push({
//       email: userMapping.Manager,
//       name: getDisplayName(userMapping.Manager),
//       process: userProcess,
//       role: 'Manager'
//     });
//   }

//   if (userMapping['Account manager'] && userMapping['Account manager'].includes('@')) {
//     console.log('Adding Account Manager:', userMapping['Account manager']);
//     targetsData['Account Manager'].push({
//       email: userMapping['Account manager'],
//       name: getDisplayName(userMapping['Account manager']),
//       process: userProcess,
//       role: 'Account Manager'
//     });
//   }

//   console.log('Final transformed data:', {
//     user: userDataResult,
//     POC: targetsData['POC'].map(t => ({ name: t.name, email: t.email })),
//     Manager: targetsData['Manager'].map(t => ({ name: t.name, email: t.email })),
//     AccountManager: targetsData['Account Manager'].map(t => ({ name: t.name, email: t.email }))
//   });

//   return { targets: targetsData, userData: userDataResult };
// };
// // const identifyUserAndLoadData = async () => {
// //   setStep('loading');

// //   try {
// //     console.log('Starting user identification and data load...');

// //     // SIMPLE METHOD: Get user from URL or localStorage
// //     let userEmail = '';

// //     // Method 1: Try to get from URL (if you pass it from another page)
// //     const urlParams = new URLSearchParams(window.location.search);
// //     const emailFromUrl = urlParams.get('userEmail') || urlParams.get('email');
// //     if (emailFromUrl && emailFromUrl.includes('@')) {
// //       userEmail = emailFromUrl;
// //       console.log('Got email from URL:', userEmail);
// //       localStorage.setItem('userEmail', userEmail);
// //     }

// //     // Method 2: Try localStorage
// //     if (!userEmail) {
// //       userEmail = localStorage.getItem('userEmail') || '';
// //       console.log('Got email from localStorage:', userEmail);
// //     }

// //     // Method 3: If still no email, use a default for testing
// //     if (!userEmail || !userEmail.includes('@')) {
// //       // Use the first user from your mapping sheet as default
// //       userEmail = 'somya@highspring.in';
// //       console.log('Using default test email:', userEmail);
// //       localStorage.setItem('userEmail', userEmail);
// //     }

// //     console.log('Final user email:', userEmail);

// //     // Step 1: Load questions
// //     console.log('Loading questions...');
// //     const questionsResult = await fetchSurveyQuestions();
// //     console.log('Questions API result:', questionsResult);

// //     if (questionsResult.success && questionsResult.data) {
// //       const transformedQuestions = transformQuestionsData(questionsResult.data);
// //       console.log('Transformed questions count:', transformedQuestions.length);
// //       console.log('Sample questions:', transformedQuestions.slice(0, 3));
// //       setQuestions(transformedQuestions);

// //       if (transformedQuestions.length === 0) {
// //         console.warn('No questions were extracted from the data');
// //         toast({
// //           title: 'Warning',
// //           description: 'No questions found in the survey data.',
// //           variant: 'destructive',
// //         });
// //       }
// //     } else {
// //       console.error('Questions API error:', questionsResult.error);
// //       throw new Error(questionsResult.error || 'Failed to load questions');
// //     }

// //     // Step 2: Load mapping and filter for current user
// //     console.log('Loading management mapping...');
// //     const mappingResult = await fetchManagementMapping();
// //     console.log('Mapping API result:', mappingResult);

// //     if (mappingResult.success && mappingResult.data) {
// //       console.log('Mapping data received, rows:', mappingResult.data.length);
// //       console.log('First few mapping rows:', mappingResult.data.slice(0, 3));

// //       const { targets: filteredTargets, userData: userDataResult } = transformMappingData(mappingResult.data, userEmail);

// //       console.log('Transformation result:', {
// //         hasUserData: !!userDataResult,
// //         userData: userDataResult,
// //         pocCount: filteredTargets['POC']?.length || 0,
// //         managerCount: filteredTargets['Manager']?.length || 0,
// //         accountManagerCount: filteredTargets['Account Manager']?.length || 0
// //       });

// //       if (!userDataResult) {
// //         // User not found in mapping - show all targets
// //         console.log(`User ${userEmail} not found in mapping. Showing all targets.`);
// //         toast({
// //           title: 'Info',
// //           description: 'Your email was not found in the system. Showing all available targets.',
// //           variant: 'default',
// //         });

// //         // Show all targets
// //         const allTargets = getAllTargets(mappingResult.data);
// //         console.log('All targets:', {
// //           pocCount: allTargets['POC']?.length || 0,
// //           managerCount: allTargets['Manager']?.length || 0,
// //           accountManagerCount: allTargets['Account Manager']?.length || 0
// //         });

// //         setTargets(allTargets);
// //         setUserData({
// //           email: userEmail,
// //           name: getDisplayName(userEmail),
// //           process: 'General'
// //         });
// //       } else {
// //         // User found - show filtered targets
// //         console.log('Setting filtered targets for user:', userDataResult.name);
// //         setTargets(filteredTargets);
// //         setUserData(userDataResult);
// //       }

// //       // Move to next step
// //       console.log('Moving to select-target step...');
// //       setStep('select-target');

// //     } else {
// //       console.error('Mapping API error:', mappingResult.error);
// //       throw new Error(mappingResult.error || 'Failed to load management data');
// //     }

// //   } catch (err) {
// //     console.error('Error in identifyUserAndLoadData:', err);
// //     setError(err instanceof Error ? err.message : 'Failed to load feedback data');

// //     // Try to load without user filter as fallback
// //     console.log('Trying fallback: load data without user filter...');
// //     try {
// //       await loadDataWithoutUserFilter();
// //     } catch (fallbackError) {
// //       console.error('Fallback also failed:', fallbackError);
// //       toast({
// //         title: 'Data Load Error',
// //         description: `Error: ${err instanceof Error ? err.message : 'Unknown error'}`,
// //         variant: 'destructive',
// //       });
// //     }
// //   }
// // };

// // Add this fallback function if not already present
// // const loadDataWithoutUserFilter = async () => {
// //   console.log('Loading data without user filter...');

// //   try {
// //     // Load questions
// //     const questionsResult = await fetchSurveyQuestions();

// //     if (questionsResult.success && questionsResult.data) {
// //       const transformedQuestions = transformQuestionsData(questionsResult.data);
// //       console.log('Loaded questions:', transformedQuestions.length);
// //       setQuestions(transformedQuestions);
// //     } else {
// //       throw new Error(questionsResult.error || 'Failed to load questions');
// //     }

// //     // Load all targets
// //     const mappingResult = await fetchManagementMapping();

// //     if (mappingResult.success && mappingResult.data) {
// //       const allTargets = getAllTargets(mappingResult.data);
// //       console.log('Loaded all targets:', {
// //         pocCount: allTargets['POC']?.length || 0,
// //         managerCount: allTargets['Manager']?.length || 0,
// //         accountManagerCount: allTargets['Account Manager']?.length || 0
// //       });

// //       setTargets(allTargets);

// //       // Set default user data
// //       const defaultEmail = localStorage.getItem('userEmail') || 'user@unknown.com';
// //       setUserData({
// //         email: defaultEmail,
// //         name: getDisplayName(defaultEmail),
// //         process: 'General'
// //       });

// //       console.log('Moving to select-target step...');
// //       setStep('select-target');
// //     } else {
// //       throw new Error(mappingResult.error || 'Failed to load management data');
// //     }
// //   } catch (err) {
// //     console.error('Error in loadDataWithoutUserFilter:', err);
// //     throw err;
// //   }
// // };

// // Add this fallback function if not already present
// const loadDataWithoutUserFilter = async () => {
//   console.log('Loading data without user filter...');

//   try {
//     // Load questions
//     const questionsResult = await fetchSurveyQuestions();

//     if (questionsResult.success && questionsResult.data) {
//       const transformedQuestions = transformQuestionsData(questionsResult.data);
//       console.log('Loaded questions:', transformedQuestions.length);
//       setQuestions(transformedQuestions);
//     } else {
//       throw new Error(questionsResult.error || 'Failed to load questions');
//     }

//     // Load all targets
//     const mappingResult = await fetchManagementMapping();

//     if (mappingResult.success && mappingResult.data) {
//       const allTargets = getAllTargets(mappingResult.data);
//       console.log('Loaded all targets:', {
//         pocCount: allTargets['POC']?.length || 0,
//         managerCount: allTargets['Manager']?.length || 0,
//         accountManagerCount: allTargets['Account Manager']?.length || 0
//       });

//       setTargets(allTargets);

//       // Set default user data
//       const defaultEmail = localStorage.getItem('userEmail') || 'user@unknown.com';
//       setUserData({
//         email: defaultEmail,
//         name: getDisplayName(defaultEmail),
//         process: 'General'
//       });

//       console.log('Moving to select-target step...');
//       setStep('select-target');
//     } else {
//       throw new Error(mappingResult.error || 'Failed to load management data');
//     }
//   } catch (err) {
//     console.error('Error in loadDataWithoutUserFilter:', err);
//     throw err;
//   }
// };

//   const getAllTargets = (data: any[]): FeedbackTargets => {
//     const targetsData: FeedbackTargets = {
//       'POC': [],
//       'Manager': [],
//       'Account Manager': []
//     };

//     const seenEmails = new Set<string>();

//     data.forEach((item) => {
//       // For POC
//       if (item.POC && item.POC.includes('@') && !seenEmails.has(item.POC.toLowerCase())) {
//         targetsData['POC'].push({
//           email: item.POC,
//           name: getDisplayName(item.POC),
//           process: item.Process || 'General',
//           role: 'POC'
//         });
//         seenEmails.add(item.POC.toLowerCase());
//       }

//       // For Manager
//       if (item.Manager && item.Manager.includes('@') && !seenEmails.has(item.Manager.toLowerCase())) {
//         targetsData['Manager'].push({
//           email: item.Manager,
//           name: getDisplayName(item.Manager),
//           process: item.Process || 'General',
//           role: 'Manager'
//         });
//         seenEmails.add(item.Manager.toLowerCase());
//       }

//       // For Account Manager
//       if (item['Account manager'] && item['Account manager'].includes('@') && !seenEmails.has(item['Account manager'].toLowerCase())) {
//         targetsData['Account Manager'].push({
//           email: item['Account manager'],
//           name: getDisplayName(item['Account manager']),
//           process: item.Process || 'General',
//           role: 'Account Manager'
//         });
//         seenEmails.add(item['Account manager'].toLowerCase());
//       }
//     });

//     return targetsData;
//   };
// const identifyUserAndLoadData = async () => {
//   setStep('loading');

//   try {
//     console.log('🚀 Starting data load...');

//     // Step 1: Check backend health
//     const isBackendHealthy = await checkBackendHealth();
//     if (!isBackendHealthy) {
//       throw new Error('Backend server is not responding. Please make sure it is running on http://localhost:5000');
//     }

//     // Step 2: Get user email
//     const userEmail = getCurrentUserEmail();
//     console.log('👤 User email:', userEmail);

//     // Step 3: Load questions
//     console.log('📋 Loading questions...');
//     const questionsResult = await fetchSurveyQuestions();

//     if (!questionsResult.success) {
//       throw new Error(questionsResult.error || 'Failed to load questions');
//     }

//     if (!questionsResult.data || questionsResult.data.length === 0) {
//       console.warn('No questions data received');
//     }

//     const transformedQuestions = transformQuestionsData(questionsResult.data);
//     console.log(`✅ Transformed ${transformedQuestions.length} questions`);
//     setQuestions(transformedQuestions);

//     // Step 4: Load mapping for user
//     console.log('📋 Loading mapping for user:', userEmail);
//     const mappingResult = await fetchManagementMapping(userEmail);

//     if (!mappingResult.success) {
//       throw new Error(mappingResult.error || 'Failed to load mapping data');
//     }

//     const { targets, userData } = transformMappingData(mappingResult.data, userEmail);

//     if (userData) {
//       console.log('✅ User found in mapping:', userData.name);
//       setTargets(targets);
//       setUserData(userData);
//     } else {
//       console.log('⚠️ User not found in mapping, showing all targets');
//       // Get all mappings without filter
//       const allMappingResult = await fetchManagementMapping();
//       if (allMappingResult.success) {
//         const allTargets = getAllTargets(allMappingResult.data);
//         setTargets(allTargets);
//         setUserData({
//           email: userEmail,
//           name: getDisplayName(userEmail),
//           process: 'General'
//         });
//       }
//     }

//     console.log('🎉 Moving to select-target step');
//     setStep('select-target');

//   } catch (error) {
//     console.error('❌ Error loading data:', error);
//     setError(error instanceof Error ? error.message : 'Failed to load feedback data');

//     toast({
//       title: 'Data Load Error',
//       description: error instanceof Error ? error.message : 'Unknown error',
//       variant: 'destructive',
//     });
//   }
// };


//   const selectTarget = (role: string, target: FeedbackTarget) => {
//     setSelectedRole(role);
//     setSelectedTarget(target);
//     setStep('questions');
//   };

//   const handleAnswer = (questionId: string, value: string) => {
//     setAnswers(prev => ({ ...prev, [questionId]: value }));
//   };

//   const getProgress = () => {
//     if (questions.length === 0) return 0;
//     return Math.round((Object.keys(answers).length / questions.length) * 100);
//   };

//   const canSubmit = () => {
//     // Check if all questions are answered
//     return questions.every(q =>
//       answers[q.question_id] !== undefined && answers[q.question_id] !== ''
//     ) && selectedTarget !== null;
//   };

//   // const handleSubmit = async () => {
//   //   if (!canSubmit() || !selectedTarget) {
//   //     toast({
//   //       title: 'Incomplete Form',
//   //       description: 'Please answer all questions before submitting.',
//   //       variant: 'destructive',
//   //     });
//   //     return;
//   //   }

//   //   setIsSubmitting(true);
//   //   try {
//   //     // Prepare feedback data
//   //     const feedbackData: Record<string, any> = {
//   //       'Timestamp': new Date().toISOString(),
//   //       'Reviewer Email': userData?.email || 'Unknown', // Auto-store user's email
//   //       'Reviewer Name': userData?.name || 'Anonymous', // Auto-store user's name
//   //       'Reviewer Process': userData?.process || 'General', // Auto-store user's process
//   //       'Role Reviewed': selectedRole,
//   //       'Process': selectedTarget?.process || '',
//   //       'Management Email ID': selectedTarget?.email || '',
//   //       'Management Name': selectedTarget?.name || '',
//   //       'Additional Comments': comments
//   //     };

//   //     // Add LDAP if available
//   //     if (userData?.ldap) {
//   //       feedbackData['Reviewer LDAP'] = userData.ldap;
//   //     }

//   //     console.log('Submitting feedback with these details:', {
//   //       reviewerEmail: userData?.email,
//   //       reviewerName: userData?.name,
//   //       reviewerLdap: userData?.ldap,
//   //       managementEmail: selectedTarget?.email,
//   //       managementName: selectedTarget?.name,
//   //       role: selectedRole
//   //     });

//   //     // Add all question answers
//   //     questions.forEach((q) => {
//   //       const columnName = q.question_text;
//   //       const answerValue = answers[q.question_id];
//   //       const ratingValue = answerValue ? parseInt(answerValue) : '';
//   //       feedbackData[columnName] = ratingValue;
//   //     });

//   //     console.log('Full submission data:', feedbackData);

//   //     // Submit to Google Sheets
//   //     const result = await submitFeedback(feedbackData);

//   //     if (result.success) {
//   //       setStep('success');
//   //       toast({
//   //         title: 'Success!',
//   //         description: `Your feedback for ${selectedTarget?.name} has been submitted.`,
//   //       });
//   //     } else {
//   //       throw new Error(result.error || 'Submission failed');
//   //     }
//   //   } catch (err) {
//   //     console.error('Submission error:', err);
//   //     toast({
//   //       title: 'Submission Failed',
//   //       description: err instanceof Error ? err.message : 'Please try again later.',
//   //       variant: 'destructive',
//   //     });
//   //   } finally {
//   //     setIsSubmitting(false);
//   //   }
//   // };
// const handleSubmit = async () => {
//   if (!canSubmit() || !selectedTarget || !userData) {
//     toast({
//       title: 'Incomplete Form',
//       description: 'Please answer all questions before submitting.',
//       variant: 'destructive',
//     });
//     return;
//   }

//   // Check if user has already submitted feedback for this target recently
//   if (!canSubmitFeedback(selectedTarget.email, userData.email)) {
//     const cooldownEnd = getCooldownEndDate(selectedTarget.email, userData.email);
//     const message = cooldownEnd ? 
//       `You've already submitted feedback for ${selectedTarget.name} recently. You can submit again on ${cooldownEnd.toLocaleDateString()}.` :
//       `You've already submitted feedback for ${selectedTarget.name} recently. Please wait 6 months before submitting again.`;

//     toast({
//       title: 'Feedback Already Submitted',
//       description: message,
//       variant: 'destructive',
//     });
//     return;
//   }

//   setIsSubmitting(true);
//   try {
//     // Prepare feedback data (existing code)
//     const feedbackData: Record<string, any> = {
//       'Timestamp': new Date().toISOString(),
//       'Reviewer Email': userData.email,
//       'Reviewer Name': userData.name,
//       'Reviewer Process': userData.process,
//       'Role Reviewed': selectedRole,
//       'Process': selectedTarget?.process || '',
//       'Management Email ID': selectedTarget?.email || '',
//       'Management Name': selectedTarget?.name || '',
//       'Additional Comments': comments
//     };

//     if (userData.ldap) {
//       feedbackData['Reviewer LDAP'] = userData.ldap;
//     }

//     // Add all question answers (existing code)
//     questions.forEach((q) => {
//       const columnName = q.question_text;
//       const answerValue = answers[q.question_id];
//       const ratingValue = answerValue ? parseInt(answerValue) : '';
//       feedbackData[columnName] = ratingValue;
//     });

//     // Submit to Google Sheets
//     const result = await submitFeedback(feedbackData);

//     if (result.success) {
//       // Save to local storage to track cooldown
//       saveFeedbackSubmission(
//         selectedTarget.email,
//         userData.email,
//         selectedRole
//       );

//       setStep('success');
//       toast({
//         title: 'Success!',
//         description: `Your feedback for ${selectedTarget?.name} has been submitted.`,
//       });
//     } else {
//       throw new Error(result.error || 'Submission failed');
//     }
//   } catch (err) {
//     console.error('Submission error:', err);
//     toast({
//       title: 'Submission Failed',
//       description: err instanceof Error ? err.message : 'Please try again later.',
//       variant: 'destructive',
//     });
//   } finally {
//     setIsSubmitting(false);
//   }
// };
//   const resetAndGiveMore = () => {
//     setAnswers({});
//     setComments('');
//     setSelectedRole('');
//     setSelectedTarget(null);
//     setStep('select-target');
//   };

//   const groupedQuestions = questions.reduce((acc: Record<string, Question[]>, q: Question) => {
//     const category = q.category || 'General';
//     if (!acc[category]) {
//       acc[category] = [];
//     }
//     acc[category].push(q);
//     return acc;
//   }, {});

//   // Loading state
//   if (step === 'loading') {
//   //   return (
//   //     <div className="min-h-screen bg-gradient-to-b from-muted to-background flex items-center justify-center p-4">
//   //       <div className="vox-card max-w-lg w-full p-12 text-center animate-fade-in">
//   //         <Loader2 className="w-12 h-12 text-secondary animate-spin mx-auto mb-6" />
//   //         <h2 className="text-2xl font-bold text-foreground mb-2">
//   //           Loading Feedback Form
//   //         </h2>
//   //         <p className="text-muted-foreground">Preparing your feedback experience...</p>
//   //       </div>
//   //     </div>
//   //   );
//   // }
//    return (
//     <div className="min-h-screen bg-gradient-to-b from-muted to-background flex items-center justify-center p-4">
//       <div className="vox-card max-w-lg w-full p-12 text-center animate-fade-in">
//         <Loader2 className="w-12 h-12 text-secondary animate-spin mx-auto mb-6" />
//         <h2 className="text-2xl font-bold text-foreground mb-2">
//           Loading Feedback Form
//         </h2>
//         <p className="text-muted-foreground mb-6">Preparing your feedback experience...</p>

//         {/* Debug button */}
//         <Button 
//           variant="outline" 
//           size="sm"
//           onClick={() => {
//             console.log('Debug Info:', {
//               step,
//               userEmail: localStorage.getItem('userEmail'),
//               questionsCount: questions.length,
//               targetsCount: Object.values(targets).flat().length,
//               userData,
//               error
//             });

//             // Try to force load without filter
//             loadDataWithoutUserFilter();
//           }}
//         >
//           Debug / Skip
//         </Button>
//       </div>
//     </div>
//   );
// }

//   if (error && step !== 'select-target' && step !== 'questions') {
//     return (
//       <div className="min-h-screen bg-gradient-to-b from-muted to-background flex items-center justify-center p-4">
//         <div className="vox-card max-w-lg w-full p-12 text-center animate-fade-in">
//           <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-6" />
//           <h2 className="text-2xl font-bold text-foreground mb-2">Error Loading Data</h2>
//           <p className="text-muted-foreground mb-6">{error}</p>
//           <div className="flex gap-4 justify-center">
//             <Button onClick={identifyUserAndLoadData} variant="default">
//               <RefreshCw className="w-4 h-4 mr-2" />
//               Try Again
//             </Button>
//             <Button onClick={() => navigate('/')} variant="outline">
//               Return Home
//             </Button>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   // if (step === 'success') {
//   //   return (
//   //     <div className="min-h-screen bg-gradient-to-b from-muted to-background flex items-center justify-center p-4">
//   //       <div className="vox-card max-w-lg w-full p-12 text-center animate-fade-in">
//   //         <div className="w-24 h-24 mx-auto mb-6 bg-success/10 rounded-full flex items-center justify-center">
//   //           <CheckCircle2 className="w-12 h-12 text-success" />
//   //         </div>
//   //         <h2 className="text-3xl font-bold text-foreground mb-4">Feedback Submitted!</h2>
//   //         <p className="text-muted-foreground mb-8">
//   //           Your feedback has been saved to Google Sheets. Thank you for your valuable input.
//   //         </p>
//   //         <div className="flex flex-col sm:flex-row gap-4 justify-center">
//   //           <Button onClick={resetAndGiveMore} className="vox-btn-primary">
//   //             Give More Feedback
//   //           </Button>
//   //           <Button onClick={() => navigate('/')} variant="outline">
//   //             Back to Home
//   //           </Button>
//   //         </div>
//   //       </div>
//   //     </div>
//   //   );
//   // }
//   // Replace the success section (around line 1135-1161) with this code:

// if (step === 'success') {
//   // Get remaining targets for the current user
//   const remainingTargets = userData ? 
//     Object.entries(targets)
//       .flatMap(([role, roleTargets]) => 
//         roleTargets.filter(target => 
//           target.email !== selectedTarget?.email // Exclude just submitted target
//         ).map(target => ({
//           ...target,
//           role
//         }))
//       ) : [];

//   return (
//     <div className="min-h-screen bg-gradient-to-b from-muted to-background py-8 px-4">
//       <div className="vox-card max-w-3xl mx-auto animate-fade-in">
//         <div className="p-8 md:p-12">
//           <div className="w-24 h-24 mx-auto mb-6 bg-success/10 rounded-full flex items-center justify-center">
//             <CheckCircle2 className="w-12 h-12 text-success" />
//           </div>

//           <h2 className="text-3xl font-bold text-foreground mb-4">Feedback Submitted!</h2>

//           <div className="mb-6 p-4 bg-success/5 rounded-lg border border-success/20">
//             <p className="text-center text-foreground">
//               Your feedback for <span className="font-semibold">{selectedTarget?.name}</span> has been successfully submitted to Google Sheets.
//             </p>
//             <p className="text-center text-muted-foreground mt-2">
//               Thank you for your valuable input!
//             </p>
//           </div>

//           {/* Pending Feedback Section */}
//           {remainingTargets.length > 0 && (
//             <div className="mt-8 mb-8">
//               <h3 className="text-lg font-semibold text-secondary mb-4 flex items-center gap-2">
//                 📋 Pending Feedback
//                 <span className="text-sm text-muted-foreground font-normal">
//                   ({remainingTargets.length} remaining)
//                 </span>
//               </h3>

//               <p className="text-muted-foreground mb-4">
//                 You can also provide feedback for these other leaders:
//               </p>

//               <div className="space-y-3">
//                 {remainingTargets.map((target, index) => (
//                   <div
//                     key={`${target.email}-${index}`}
//                     className="p-4 bg-card rounded-lg border flex items-center justify-between hover:bg-accent/5 transition-colors"
//                   >
//                     <div className="flex items-center gap-3">
//                       <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
//                         {target.role === 'POC' ? '👤' : 
//                          target.role === 'Manager' ? '👔' : '📊'}
//                       </div>
//                       <div>
//                         <h4 className="font-semibold text-foreground">
//                           {target.name}
//                         </h4>
//                         <p className="text-sm text-muted-foreground">
//                           {target.role} • {target.process}
//                         </p>
//                         <p className="text-xs text-muted-foreground">
//                           {target.email}
//                         </p>
//                       </div>
//                     </div>

//                     <Button
//                       onClick={() => {
//                         setSelectedRole(target.role);
//                         setSelectedTarget(target);
//                         setAnswers({});
//                         setComments('');
//                         setStep('questions');
//                       }}
//                       className="vox-btn-primary"
//                       size="sm"
//                     >
//                       Give Feedback
//                     </Button>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           )}

//           {/* Completion Message if no pending feedback */}
//           {remainingTargets.length === 0 && userData && (
//             <div className="mt-8 mb-8 p-4 bg-primary/5 rounded-lg border border-primary/20">
//               <div className="flex items-center gap-3 mb-3">
//                 <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
//                   <CheckCircle2 className="w-5 h-5 text-primary" />
//                 </div>
//                 <div>
//                   <h4 className="font-semibold text-foreground">All Feedback Complete! 🎉</h4>
//                   <p className="text-sm text-muted-foreground">
//                     You have provided feedback for all your assigned leaders.
//                   </p>
//                 </div>
//               </div>
//               <p className="text-sm text-muted-foreground pl-13">
//                 Your contributions help improve leadership across the organization.
//               </p>
//             </div>
//           )}

//           {/* Action Buttons */}
//           <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
//             {remainingTargets.length > 0 ? (
//               <>
//                 <Button onClick={resetAndGiveMore} className="vox-btn-primary">
//                   Give More Feedback
//                 </Button>
//                 <Button onClick={() => navigate('/')} variant="outline">
//                   Finish for Now
//                 </Button>
//               </>
//             ) : (
//               <>
//                 <Button onClick={() => navigate('/')} className="vox-btn-primary">
//                   Return to Dashboard
//                 </Button>
//                 <Button 
//                   onClick={() => {
//                     // Reset for fresh start
//                     setAnswers({});
//                     setComments('');
//                     setSelectedRole('');
//                     setSelectedTarget(null);
//                     setStep('select-target');
//                   }} 
//                   variant="outline"
//                 >
//                   Review Feedback
//                 </Button>
//               </>
//             )}
//           </div>

//           {/* Summary Stats */}
//           <div className="mt-8 pt-6 border-t border-border">
//             <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
//               <div className="p-3 bg-muted rounded-lg">
//                 <p className="text-2xl font-bold text-foreground">
//                   {Object.keys(targets).reduce((sum, role) => sum + targets[role].length, 0)}
//                 </p>
//                 <p className="text-sm text-muted-foreground">Total Leaders</p>
//               </div>
//               <div className="p-3 bg-muted rounded-lg">
//                 <p className="text-2xl font-bold text-foreground">
//                   {Object.keys(targets).reduce((sum, role) => sum + targets[role].length, 0) - remainingTargets.length}
//                 </p>
//                 <p className="text-sm text-muted-foreground">Feedback Submitted</p>
//               </div>
//               <div className="p-3 bg-muted rounded-lg">
//                 <p className="text-2xl font-bold text-foreground">
//                   {remainingTargets.length}
//                 </p>
//                 <p className="text-sm text-muted-foreground">Remaining</p>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

//   if (step === 'select-target') {
//     const totalTargets = Object.values(targets).flat().length;

//     return (
//       <div className="min-h-screen bg-gradient-to-b from-muted to-background py-8 px-4">
//         <div className="vox-card max-w-3xl mx-auto animate-fade-in">
//           <div className="p-8 md:p-12">
//             <Button
//               variant="ghost"
//               onClick={() => navigate('/')}
//               className="mb-6 text-muted-foreground hover:text-foreground"
//             >
//               <ArrowLeft className="w-4 h-4 mr-2" />
//               Back to Home
//             </Button>

//             {/* User Info Display */}
//             {userData && (
//               <div className="mb-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
//                 <div className="flex items-center gap-3">
//                   <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
//                     <User className="w-5 h-5 text-primary" />
//                   </div>
//                   <div>
//                     <p className="font-medium text-foreground">{userData.name}</p>
//                     <p className="text-sm text-muted-foreground">
//                       {userData.email} • {userData.process}
//                       {userData.ldap && ` • LDAP: ${userData.ldap}`}
//                     </p>
//                   </div>
//                 </div>
//                 {!userData.email.includes('@') || userData.email === 'user@unknown.com' ? (
//                   <p className="mt-2 text-sm text-amber-600">
//                     Note: You are viewing all available targets. For personalized targets, ensure you are signed into Google.
//                   </p>
//                 ) : null}
//               </div>
//             )}

//             {/* Add this to your FeedbackPage component, near the user info section */}
// <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
//   <p className="text-sm text-blue-700 mb-2">
//     <strong>Testing Mode:</strong> Select a test user
//   </p>
//   <div className="flex flex-wrap gap-2">
//     <Button 
//       size="sm" 
//       variant="outline"
//       onClick={() => {
//         localStorage.setItem('userEmail', 'somya@highspring.in');
//         window.location.reload();
//       }}
//     >
//       Somya
//     </Button>
//     <Button 
//       size="sm" 
//       variant="outline"
//       onClick={() => {
//         localStorage.setItem('userEmail', 'nick@vacobinary.com');
//         window.location.reload();
//       }}
//     >
//       Nick
//     </Button>
//     <Button 
//       size="sm" 
//       variant="outline"
//       onClick={() => {
//         localStorage.setItem('userEmail', 'victor@vacobinary.com');
//         window.location.reload();
//       }}
//     >
//       Victor
//     </Button>
//     <Button 
//       size="sm" 
//       variant="outline"
//       onClick={() => {
//         localStorage.removeItem('userEmail');
//         window.location.reload();
//       }}
//     >
//       Clear
//     </Button>
//   </div>
// </div>

//             <h2 className="text-3xl font-bold text-foreground mb-2">Leadership Feedback</h2>
//             <p className="text-muted-foreground mb-8">
//               Select a leader to provide feedback for
//             </p>

//             {totalTargets > 0 ? (
//               Object.entries(targets).map(([role, roleTargets]) => (
//                 roleTargets.length > 0 && (
//                   <div key={role} className="mb-8">
//                     <h3 className="text-lg font-semibold text-secondary mb-4 flex items-center gap-2">
//                       {role === 'POC' ? '👤 Point of Contact' :
//                         role === 'Manager' ? '👔 Manager' : '📊 Account Manager'}
//                       <span className="text-sm text-muted-foreground font-normal">
//                         ({roleTargets.length} {roleTargets.length === 1 ? 'person' : 'people'})
//                       </span>
//                     </h3>

//                     {roleTargets.map((target, index) => (
//                       <div
//                         key={`${target.email}-${index}`}
//                         className="vox-target-card"
//                       >
//                         <div>
//                           <h4 className="font-semibold text-foreground">
//                             {target.name}
//                           </h4>
//                           <p className="text-sm text-muted-foreground">
//                             {target.process} • {target.email}
//                           </p>
//                         </div>

//                         <Button
//                           onClick={() => selectTarget(role, target)}
//                           className="vox-btn-primary"
//                         >
//                           Select
//                           <ChevronRight className="w-4 h-4 ml-1" />
//                         </Button>
//                       </div>
//                     ))}
//                   </div>
//                 )
//               ))
//             ) : (
//               <div className="text-center py-12">
//                 <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
//                 <p className="text-muted-foreground mb-2">No management data found.</p>
//                 <p className="text-sm text-muted-foreground mb-4">
//                   Please contact your administrator to add management data to the system.
//                 </p>
//                 <div className="flex gap-4 justify-center">
//                   <Button onClick={identifyUserAndLoadData} variant="outline">
//                     <RefreshCw className="w-4 h-4 mr-2" />
//                     Reload Data
//                   </Button>
//                   <Button onClick={() => navigate('/')} variant="outline">
//                     Return Home
//                   </Button>
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-b from-muted to-background py-8 px-4">
//       <div className="vox-card max-w-3xl mx-auto animate-fade-in">
//         <div className="p-8 md:p-12">
//           <Button
//             variant="ghost"
//             onClick={() => setStep('select-target')}
//             className="mb-6 text-muted-foreground hover:text-foreground"
//           >
//             <ArrowLeft className="w-4 h-4 mr-2" />
//             Change Selection
//           </Button>

//           {/* Header with User Info */}
//           <div className="mb-8">
//             <div className="flex items-start justify-between mb-4">
//               <div>
//                 <h2 className="text-3xl font-bold text-foreground mb-2">
//                   Feedback for {selectedTarget?.name}
//                 </h2>
//                 <p className="text-muted-foreground">
//                   {selectedRole} • {selectedTarget?.process}
//                 </p>
//                 <p className="text-sm text-muted-foreground mt-1">{selectedTarget?.email}</p>
//               </div>
//               {userData && (
//                 <div className="text-right">
//                   <p className="text-sm text-muted-foreground">Submitted by</p>
//                   <p className="font-medium text-foreground">{userData.name}</p>
//                   <p className="text-xs text-muted-foreground">{userData.process}</p>
//                 </div>
//               )}
//             </div>
//           </div>

//           {/* Progress Bar */}
//           <div className="mb-8">
//             <div className="flex justify-between text-sm text-muted-foreground mb-2">
//               <span>Progress</span>
//               <span>{getProgress()}% Complete</span>
//             </div>
//             <Progress value={getProgress()} className="h-3" />
//           </div>

//           {/* Questions by Category */}
//           {questions.length > 0 ? (
//             Object.entries(groupedQuestions).map(([category, categoryQuestions]) => (
//               <div key={category} className="mb-8">
//                 <h3 className="text-lg font-semibold text-secondary mb-4 pb-2 border-b border-border">
//                   {category}
//                 </h3>

//                 {categoryQuestions.map((question, idx) => (
//                   <div key={question.question_id} className="mb-6 p-4 bg-card rounded-lg border">
//                     <p className="font-medium text-foreground mb-4">
//                       {idx + 1}. {question.question_text}
//                       <span className="text-red-500 ml-1">*</span>
//                     </p>

//                     <div className="flex gap-2 flex-wrap">
//                       {question.options.map((option, optIdx) => {
//                         const isSelected = answers[question.question_id] === (optIdx + 1).toString();
//                         return (
//                           <button
//                             key={optIdx}
//                             type="button"
//                             onClick={() => handleAnswer(question.question_id, (optIdx + 1).toString())}
//                             className={getRatingButtonClasses(option, isSelected)}
//                           >
//                             {option}
//                           </button>
//                         );
//                       })}
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             ))
//           ) : (
//             <div className="text-center py-8">
//               <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
//               <p className="text-muted-foreground">No feedback questions loaded.</p>
//               <Button onClick={identifyUserAndLoadData} variant="outline" className="mt-4">
//                 <RefreshCw className="w-4 h-4 mr-2" />
//                 Reload Questions
//               </Button>
//             </div>
//           )}

//           {/* Comments Section */}
//           <div className="mb-8">
//             <h3 className="text-lg font-semibold text-secondary mb-4">Additional Comments (Optional)</h3>
//             <Textarea
//               value={comments}
//               onChange={(e) => setComments(e.target.value)}
//               placeholder="Share any additional feedback or context..."
//               className="w-full"
//               rows={4}
//             />
//           </div>

//           {/* Submit Button */}
//           <div className="flex flex-col sm:flex-row gap-4">
//             <Button
//               onClick={handleSubmit}
//               disabled={!canSubmit() || isSubmitting}
//               className="vox-btn-primary flex-1"
//               size="lg"
//             >
//               {isSubmitting ? (
//                 <>
//                   <Loader2 className="w-5 h-5 mr-2 animate-spin" />
//                   Submitting to Google Sheets...
//                 </>
//               ) : (
//                 'Submit Feedback'
//               )}
//             </Button>
//             <Button
//               variant="outline"
//               onClick={() => setStep('select-target')}
//               className="flex-1"
//               size="lg"
//             >
//               Cancel
//             </Button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default FeedbackPage;






// src/pages/FeedbackPage.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Loader2, AlertCircle, CheckCircle2, RefreshCw, User, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { fetchSurveyQuestions, fetchManagementMapping, submitFeedback, getCurrentUserEmail, checkBackendHealth } from '@/services/sheetsApi';

// Storage utilities for cooldown management
const STORAGE_KEY = 'vox_feedback_submissions';
const COOLDOWN_DAYS = 180; // 6 months in days

interface FeedbackSubmission {
  targetEmail: string;
  reviewerEmail: string;
  submittedAt: string;
  role: string;
  targetName: string;
}

const saveFeedbackSubmission = (
  targetEmail: string,
  reviewerEmail: string,
  role: string,
  targetName: string
): void => {
  const submissions = getFeedbackSubmissions();

  // Check if submission already exists for this target
  const existingIndex = submissions.findIndex(
    sub => sub.targetEmail.toLowerCase() === targetEmail.toLowerCase() &&
      sub.reviewerEmail.toLowerCase() === reviewerEmail.toLowerCase()
  );

  if (existingIndex !== -1) {
    // Update existing submission
    submissions[existingIndex] = {
      targetEmail: targetEmail.toLowerCase(),
      reviewerEmail: reviewerEmail.toLowerCase(),
      submittedAt: new Date().toISOString(),
      role,
      targetName
    };
  } else {
    // Add new submission
    submissions.push({
      targetEmail: targetEmail.toLowerCase(),
      reviewerEmail: reviewerEmail.toLowerCase(),
      submittedAt: new Date().toISOString(),
      role,
      targetName
    });
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(submissions));
  console.log(`Feedback submission saved for ${targetName}`);
};

const getFeedbackSubmissions = (): FeedbackSubmission[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error reading feedback submissions:', error);
    return [];
  }
};

const canSubmitFeedback = (
  targetEmail: string,
  reviewerEmail: string
): boolean => {
  const submissions = getFeedbackSubmissions();
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setDate(sixMonthsAgo.getDate() - COOLDOWN_DAYS);

  const recentSubmission = submissions.find(sub =>
    sub.targetEmail.toLowerCase() === targetEmail.toLowerCase() &&
    sub.reviewerEmail.toLowerCase() === reviewerEmail.toLowerCase() &&
    new Date(sub.submittedAt) > sixMonthsAgo
  );

  return !recentSubmission;
};

const getCooldownEndDate = (
  targetEmail: string,
  reviewerEmail: string
): Date | null => {
  const submissions = getFeedbackSubmissions();
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setDate(sixMonthsAgo.getDate() - COOLDOWN_DAYS);

  const recentSubmission = submissions.find(sub =>
    sub.targetEmail.toLowerCase() === targetEmail.toLowerCase() &&
    sub.reviewerEmail.toLowerCase() === reviewerEmail.toLowerCase() &&
    new Date(sub.submittedAt) > sixMonthsAgo
  );

  if (recentSubmission) {
    const cooldownEnd = new Date(recentSubmission.submittedAt);
    cooldownEnd.setDate(cooldownEnd.getDate() + COOLDOWN_DAYS);
    return cooldownEnd;
  }

  return null;
};

const formatCooldownMessage = (cooldownEnd: Date): string => {
  const now = new Date();
  const diffMs = cooldownEnd.getTime() - now.getTime();

  if (diffMs <= 0) return 'Available now';

  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (diffDays > 30) {
    const months = Math.floor(diffDays / 30);
    const remainingDays = diffDays % 30;
    return `${months} month${months !== 1 ? 's' : ''}${remainingDays > 0 ? ` ${remainingDays} day${remainingDays !== 1 ? 's' : ''}` : ''}`;
  } else if (diffDays > 0) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
  } else {
    return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}`;
  }
};

const clearOldSubmissions = (): void => {
  const submissions = getFeedbackSubmissions();
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setDate(sixMonthsAgo.getDate() - COOLDOWN_DAYS);

  const recentSubmissions = submissions.filter(
    sub => new Date(sub.submittedAt) > sixMonthsAgo
  );

  localStorage.setItem(STORAGE_KEY, JSON.stringify(recentSubmissions));
};

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

interface MappingData {
  Ldap: string;
  Email: string;
  Process: string;
  POC: string;
  Manager: string;
  'Account manager': string;
  Gender: string;
  Tenure: number;
  Designation: string;
  Age: number;
}

// interface UserData {
//   email: string;
//   name: string;
//   process: string;
//   ldap?: string;
// }
interface UserData {
  email: string;
  name: string;
  process: string;
  ldap?: string;
  gender?: string;          // Add these optional properties
  tenure?: string | number;
  designation?: string;
  age?: string | number;
  genderOfManagement?: string;
}
type FeedbackStep = 'loading' | 'select-target' | 'questions' | 'success';

const FeedbackPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState<FeedbackStep>('loading');
  const [targets, setTargets] = useState<FeedbackTargets>({});
  const [questions, setQuestions] = useState<Question[]>([]);
  const [error, setError] = useState<string | null>(null);

  // User data state
  const [userData, setUserData] = useState<UserData | null>(null);

  const [selectedRole, setSelectedRole] = useState('');
  const [selectedTarget, setSelectedTarget] = useState<FeedbackTarget | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Function to get user's display name from email
  const getDisplayName = (email: string): string => {
    if (!email.includes('@')) return email;

    const namePart = email.split('@')[0];
    return namePart
      .replace(/\./g, ' ')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  useEffect(() => {
    // Clear submissions older than 6 months on component mount
    clearOldSubmissions();

    const loadData = async () => {
      await identifyUserAndLoadData();
    };

    loadData();
  }, []);

  // Function to get color classes for rating buttons
  const getRatingButtonClasses = (option: string, isSelected: boolean) => {
    const baseClasses = 'px-4 py-2 rounded border font-medium transition-all duration-200';
    const selectedClasses = 'ring-2 ring-offset-1 scale-105 shadow-md';

    switch (option) {
      case 'Strongly Disagree':
        return `${baseClasses} ${isSelected
          ? `${selectedClasses} bg-red-600 text-white border-red-700 ring-red-500 hover:bg-red-700`
          : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100 hover:border-red-300'}`;

      case 'Disagree':
        return `${baseClasses} ${isSelected
          ? `${selectedClasses} bg-orange-500 text-white border-orange-600 ring-orange-400 hover:bg-orange-600`
          : 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100 hover:border-orange-300'}`;

      case 'Neutral':
        return `${baseClasses} ${isSelected
          ? `${selectedClasses} bg-yellow-500 text-white border-yellow-600 ring-yellow-400 hover:bg-yellow-600`
          : 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100 hover:border-yellow-300'}`;

      case 'Agree':
        return `${baseClasses} ${isSelected
          ? `${selectedClasses} bg-green-500 text-white border-green-600 ring-green-400 hover:bg-green-600`
          : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:border-green-300'}`;

      case 'Strongly Agree':
        return `${baseClasses} ${isSelected
          ? `${selectedClasses} bg-emerald-600 text-white border-emerald-700 ring-emerald-500 hover:bg-emerald-700`
          : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300'}`;

      default:
        return `${baseClasses} ${isSelected
          ? `${selectedClasses} bg-primary text-primary-foreground border-primary`
          : 'bg-background border-input hover:bg-accent'}`;
    }
  };

  const transformQuestionsData = (data: any[]): Question[] => {
    if (!data || data.length === 0) {
      console.log('No data received from Google Sheets');
      return [];
    }

    console.log('📊 Processing questions from Google Sheets...');
    console.log('Total rows received:', data.length);

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

      // Check if this is a topic header
      if (text.toLowerCase().startsWith('topic:')) {
        currentCategory = text.replace('Topic:', '').trim();
        console.log(`  → Category set to: ${currentCategory}`);
        return;
      }

      // Skip rating options
      if (text === 'Strongly disagree' ||
        text === 'disagree' ||
        text === 'neutral' ||
        text === 'agree' ||
        text === 'Strongly agree' ||
        text.toLowerCase().includes('strongly disagree') ||
        text.toLowerCase().includes('strongly agree')) {
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
        return;
      }

      if (text.length >= 10 && !text.toLowerCase().startsWith('topic:')) {
        questionCount++;
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
    return questionsList;
  };

  // const transformMappingData = (data: any[], userEmail: string): { targets: FeedbackTargets, userData: UserData | null } => {
  //   console.log('transformMappingData called with:', {
  //     dataLength: data.length,
  //     userEmail
  //   });

  //   const targetsData: FeedbackTargets = {
  //     'POC': [],
  //     'Manager': [],
  //     'Account Manager': []
  //   };

  //   let userMapping: MappingData | null = null;

  //   // Find user in mapping data
  //   console.log('Searching for user in mapping data...');
  //   data.forEach((item, index) => {
  //     // Check both Email and Ldap columns (case-insensitive)
  //     const itemEmail = item.Email || '';
  //     const itemLdap = item.Ldap || '';
  //     const userEmailLower = userEmail.toLowerCase();

  //     if (itemEmail.toLowerCase() === userEmailLower || 
  //         itemLdap.toLowerCase() === userEmailLower) {
  //       userMapping = item;
  //       console.log('Found matching user at row', index, ':', item);
  //     }
  //   });

  //   console.log('User mapping found:', userMapping);

  //   if (!userMapping) {
  //     console.warn(`No mapping found for user: ${userEmail}`);
  //     return { targets: targetsData, userData: null };
  //   }

  //   // Extract user data
  //   const userProcess = userMapping.Process || 'General';
  //   const userEmailFromMapping = userMapping.Email || userEmail;
  //   const userDisplayName = getDisplayName(userEmailFromMapping);

  //   const userDataResult: UserData = {
  //     email: userEmailFromMapping,
  //     name: userDisplayName,
  //     process: userProcess,
  //     ldap: userMapping.Ldap || undefined
  //   };

  //   console.log('Creating targets for user...');

  //   // Only add targets that exist for this user
  //   if (userMapping.POC && userMapping.POC.includes('@')) {
  //     console.log('Adding POC:', userMapping.POC);
  //     targetsData['POC'].push({
  //       email: userMapping.POC,
  //       name: getDisplayName(userMapping.POC),
  //       process: userProcess,
  //       role: 'POC'
  //     });
  //   }

  //   if (userMapping.Manager && userMapping.Manager.includes('@')) {
  //     console.log('Adding Manager:', userMapping.Manager);
  //     targetsData['Manager'].push({
  //       email: userMapping.Manager,
  //       name: getDisplayName(userMapping.Manager),
  //       process: userProcess,
  //       role: 'Manager'
  //     });
  //   }

  //   if (userMapping['Account manager'] && userMapping['Account manager'].includes('@')) {
  //     console.log('Adding Account Manager:', userMapping['Account manager']);
  //     targetsData['Account Manager'].push({
  //       email: userMapping['Account manager'],
  //       name: getDisplayName(userMapping['Account manager']),
  //       process: userProcess,
  //       role: 'Account Manager'
  //     });
  //   }

  //   console.log('Final transformed data:', {
  //     user: userDataResult,
  //     POC: targetsData['POC'].map(t => ({ name: t.name, email: t.email })),
  //     Manager: targetsData['Manager'].map(t => ({ name: t.name, email: t.email })),
  //     AccountManager: targetsData['Account Manager'].map(t => ({ name: t.name, email: t.email }))
  //   });

  //   return { targets: targetsData, userData: userDataResult };
  // };
  // In your FeedbackPage.tsx - Update the transformMappingData function
  const transformMappingData = (data: any[], userEmail: string): { targets: FeedbackTargets, userData: UserData | null } => {
    console.log('transformMappingData called with:', {
      dataLength: data.length,
      userEmail
    });

    const targetsData: FeedbackTargets = {
      'POC': [],
      'Manager': [],
      'Account Manager': []
    };

    let userMapping: MappingData | null = null;

    // Find user in mapping data
    data.forEach((item, index) => {
      const itemEmail = item.Email || '';
      const itemLdap = item.Ldap || '';
      const userEmailLower = userEmail.toLowerCase();

      if (itemEmail.toLowerCase() === userEmailLower ||
        itemLdap.toLowerCase() === userEmailLower) {
        userMapping = item;
        console.log('Found matching user at row', index, ':', item);
      }
    });

    if (!userMapping) {
      return { targets: targetsData, userData: null };
    }

    // Extract user data with demographics
    const userProcess = userMapping.Process || 'General';
    const userEmailFromMapping = userMapping.Email || userEmail;
    const userDisplayName = getDisplayName(userEmailFromMapping);

    const userDataResult: UserData = {
      email: userEmailFromMapping,
      name: userDisplayName,
      process: userProcess,
      ldap: userMapping.Ldap || undefined,
      // Add demographic fields
      gender: userMapping.Gender || '',
      tenure: userMapping.Tenure || '',
      designation: userMapping.Designation || userMapping['Designation/Level'] || '',
      age: userMapping.Age || '',
      genderOfManagement: userMapping['Gender of Management'] || userMapping['Gender of the management'] || ''
    };

    // Create targets
    if (userMapping.POC && userMapping.POC.includes('@')) {
      targetsData['POC'].push({
        email: userMapping.POC,
        name: getDisplayName(userMapping.POC),
        process: userProcess,
        role: 'POC'
      });
    }

    if (userMapping.Manager && userMapping.Manager.includes('@')) {
      targetsData['Manager'].push({
        email: userMapping.Manager,
        name: getDisplayName(userMapping.Manager),
        process: userProcess,
        role: 'Manager'
      });
    }

    if (userMapping['Account manager'] && userMapping['Account manager'].includes('@')) {
      targetsData['Account Manager'].push({
        email: userMapping['Account manager'],
        name: getDisplayName(userMapping['Account manager']),
        process: userProcess,
        role: 'Account Manager'
      });
    }

    return { targets: targetsData, userData: userDataResult };
  };
  const getAllTargets = (data: any[]): FeedbackTargets => {
    const targetsData: FeedbackTargets = {
      'POC': [],
      'Manager': [],
      'Account Manager': []
    };

    const seenEmails = new Set<string>();

    data.forEach((item) => {
      // For POC
      if (item.POC && item.POC.includes('@') && !seenEmails.has(item.POC.toLowerCase())) {
        targetsData['POC'].push({
          email: item.POC,
          name: getDisplayName(item.POC),
          process: item.Process || 'General',
          role: 'POC'
        });
        seenEmails.add(item.POC.toLowerCase());
      }

      // For Manager
      if (item.Manager && item.Manager.includes('@') && !seenEmails.has(item.Manager.toLowerCase())) {
        targetsData['Manager'].push({
          email: item.Manager,
          name: getDisplayName(item.Manager),
          process: item.Process || 'General',
          role: 'Manager'
        });
        seenEmails.add(item.Manager.toLowerCase());
      }

      // For Account Manager
      if (item['Account manager'] && item['Account manager'].includes('@') && !seenEmails.has(item['Account manager'].toLowerCase())) {
        targetsData['Account Manager'].push({
          email: item['Account manager'],
          name: getDisplayName(item['Account manager']),
          process: item.Process || 'General',
          role: 'Account Manager'
        });
        seenEmails.add(item['Account manager'].toLowerCase());
      }
    });

    return targetsData;
  };

  const identifyUserAndLoadData = async () => {
    setStep('loading');

    try {
      console.log('🚀 Starting data load...');

      // Step 1: Check backend health
      const isBackendHealthy = await checkBackendHealth();
      if (!isBackendHealthy) {
        throw new Error('Backend server is not responding. Please make sure it is running on http://localhost:5000');
      }

      // Step 2: Get user email
      const userEmail = getCurrentUserEmail();
      console.log('👤 User email:', userEmail);

      // Step 3: Load questions
      console.log('📋 Loading questions...');
      const questionsResult = await fetchSurveyQuestions();

      if (!questionsResult.success) {
        throw new Error(questionsResult.error || 'Failed to load questions');
      }

      if (!questionsResult.data || questionsResult.data.length === 0) {
        console.warn('No questions data received');
      }

      const transformedQuestions = transformQuestionsData(questionsResult.data);
      console.log(`✅ Transformed ${transformedQuestions.length} questions`);
      setQuestions(transformedQuestions);

      // Step 4: Load mapping for user
      console.log('📋 Loading mapping for user:', userEmail);
      const mappingResult = await fetchManagementMapping(userEmail);

      if (!mappingResult.success) {
        throw new Error(mappingResult.error || 'Failed to load mapping data');
      }

      const { targets, userData } = transformMappingData(mappingResult.data, userEmail);

      if (userData) {
        console.log('✅ User found in mapping:', userData.name);
        setTargets(targets);
        setUserData(userData);
      } else {
        console.log('⚠️ User not found in mapping, showing all targets');
        // Get all mappings without filter
        const allMappingResult = await fetchManagementMapping();
        if (allMappingResult.success) {
          const allTargets = getAllTargets(allMappingResult.data);
          setTargets(allTargets);
          setUserData({
            email: userEmail,
            name: getDisplayName(userEmail),
            process: 'General'
          });
        }
      }

      console.log('🎉 Moving to select-target step');
      setStep('select-target');

    } catch (error) {
      console.error('❌ Error loading data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load feedback data');

      toast({
        title: 'Data Load Error',
        description: error instanceof Error ? error.message : 'Unknown error',
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

  // In FeedbackPage.tsx - Updated handleSubmit function
  // const handleSubmit = async () => {
  //   if (!canSubmit() || !selectedTarget || !userData) {
  //     toast({
  //       title: 'Incomplete Form',
  //       description: 'Please answer all questions before submitting.',
  //       variant: 'destructive',
  //     });
  //     return;
  //   }

  //   // Check if user has already submitted feedback for this target recently
  //   if (!canSubmitFeedback(selectedTarget.email, userData.email)) {
  //     const cooldownEnd = getCooldownEndDate(selectedTarget.email, userData.email);
  //     const message = cooldownEnd ? 
  //       `You've already submitted feedback for ${selectedTarget.name} recently. You can submit again on ${cooldownEnd.toLocaleDateString()}.` :
  //       `You've already submitted feedback for ${selectedTarget.name} recently. Please wait 6 months before submitting again.`;

  //     toast({
  //       title: 'Feedback Already Submitted',
  //       description: message,
  //       variant: 'destructive',
  //     });
  //     return;
  //   }

  //   setIsSubmitting(true);
  //   try {
  //     // Generate Encrypted Submitter ID (16-character hash)
  //     const generateEncryptedId = (email: string, name: string): string => {
  //       const salt = 'vox-feedback-2024'; // Add a salt for more security
  //       const data = `${email}-${name}-${new Date().toISOString().split('T')[0]}`;

  //       // Simple hash function (you can use crypto library for stronger)
  //       let hash = 0;
  //       for (let i = 0; i < data.length; i++) {
  //         const char = data.charCodeAt(i);
  //         hash = ((hash << 5) - hash) + char;
  //         hash = hash & hash; // Convert to 32bit integer
  //       }

  //       // Convert to hex and take first 16 characters
  //       const hexString = Math.abs(hash).toString(16).padStart(32, '0');
  //       return hexString.substring(0, 16).toUpperCase();
  //     };

  //     // Generate the encrypted ID
  //     const encryptedId = generateEncryptedId(userData.email, userData.name);

  //     // Prepare feedback data with TEXT values
  //     const feedbackData: Record<string, any> = {
  //       'Timestamp': new Date().toISOString(),
  //       'Reviewer Email': userData.email,
  //       'Reviewer Name': userData.name,
  //       'Reviewer Process': userData.process,
  //       'Encrypted Submitter ID': encryptedId, // This will now populate
  //       'Role Reviewed': selectedRole,
  //       'Process': selectedTarget.process || '',
  //       'Management Email ID': selectedTarget.email || '',
  //       'Management Name': selectedTarget.name || '',
  //       'Additional Comments': comments
  //     };

  //     // Add LDAP if available
  //     if (userData.ldap) {
  //       feedbackData['Reviewer LDAP'] = userData.ldap;
  //     }

  //     console.log('Submitting feedback with these details:', {
  //       reviewerEmail: userData.email,
  //       reviewerName: userData.name,
  //       encryptedId: encryptedId,
  //       managementEmail: selectedTarget.email,
  //       managementName: selectedTarget.name,
  //       role: selectedRole
  //     });

  //     // Convert numerical answers (1-5) back to TEXT values for Google Sheets
  //     const ratingTextMap: Record<string, string> = {
  //       '1': 'Strongly Disagree',
  //       '2': 'Disagree', 
  //       '3': 'Neutral',
  //       '4': 'Agree',
  //       '5': 'Strongly Agree'
  //     };

  //     // Add all question answers as TEXT values
  //     questions.forEach((q) => {
  //       const columnName = q.question_text;
  //       const answerValue = answers[q.question_id];

  //       if (answerValue) {
  //         // Convert numerical value (1-5) to text rating
  //         const textValue = ratingTextMap[answerValue] || answerValue;
  //         feedbackData[columnName] = textValue;
  //       } else {
  //         feedbackData[columnName] = ''; // Empty if no answer
  //       }
  //     });

  //     console.log('Full submission data (sample):', {
  //       encryptedId: feedbackData['Encrypted Submitter ID'],
  //       ratings: Object.keys(feedbackData)
  //         .filter(key => questions.some(q => q.question_text === key))
  //         .slice(0, 3)
  //         .reduce((obj, key) => {
  //           obj[key] = feedbackData[key];
  //           return obj;
  //         }, {} as Record<string, any>)
  //     });

  //     // Submit to Google Sheets
  //     const result = await submitFeedback(feedbackData);

  //     if (result.success) {
  //       // Save to local storage to track cooldown
  //       saveFeedbackSubmission(
  //         selectedTarget.email,
  //         userData.email,
  //         selectedRole,
  //         selectedTarget.name
  //       );

  //       setStep('success');
  //       toast({
  //         title: 'Success!',
  //         description: `Your feedback for ${selectedTarget.name} has been submitted.`,
  //       });
  //     } else {
  //       throw new Error(result.error || 'Submission failed');
  //     }
  //   } catch (err) {
  //     console.error('Submission error:', err);

  //     // Provide user-friendly error message
  //     let errorMessage = 'Failed to submit feedback. ';
  //     if (err instanceof Error) {
  //       if (err.message.includes('403') || err.message.includes('permission')) {
  //         errorMessage = 'Permission denied by Google Sheets. Please contact administrator.';
  //       } else if (err.message.includes('Encrypted Submitter ID')) {
  //         errorMessage = 'Error generating encrypted ID. Please try again.';
  //       } else {
  //         errorMessage += err.message;
  //       }
  //     }

  //     toast({
  //       title: 'Submission Failed',
  //       description: errorMessage,
  //       variant: 'destructive',
  //     });
  //   } finally {
  //     setIsSubmitting(false);
  //   }
  // };
  // In FeedbackPage.tsx - Complete handleSubmit function with SHA-256 hashing
  // const handleSubmit = async () => {
  //   if (!canSubmit() || !selectedTarget || !userData) {
  //     toast({
  //       title: 'Incomplete Form',
  //       description: 'Please answer all questions before submitting.',
  //       variant: 'destructive',
  //     });
  //     return;
  //   }

  //   if (!canSubmitFeedback(selectedTarget.email, userData.email)) {
  //     const cooldownEnd = getCooldownEndDate(selectedTarget.email, userData.email);
  //     const message = cooldownEnd ? 
  //       `You've already submitted feedback for ${selectedTarget.name} recently. You can submit again on ${cooldownEnd.toLocaleDateString()}.` :
  //       `You've already submitted feedback for ${selectedTarget.name} recently. Please wait 6 months before submitting again.`;

  //     toast({
  //       title: 'Feedback Already Submitted',
  //       description: message,
  //       variant: 'destructive',
  //     });
  //     return;
  //   }

  //   setIsSubmitting(true);
  //   try {
  //     // Function to hash email (returns Promise<string>)
  //     const hashEmail = async (email: string): Promise<string> => {
  //       const normalizedEmail = email.trim().toLowerCase();

  //       // Try Web Crypto API first
  //       if (typeof crypto !== 'undefined' && crypto.subtle) {
  //         try {
  //           const encoder = new TextEncoder();
  //           const data = encoder.encode(normalizedEmail);
  //           const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  //           const hashArray = Array.from(new Uint8Array(hashBuffer));
  //           return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  //         } catch (error) {
  //           console.warn('Web Crypto error, using fallback:', error);
  //         }
  //       }

  //       // Fallback: deterministic hash
  //       let hash = 0;
  //       for (let i = 0; i < normalizedEmail.length; i++) {
  //         hash = ((hash << 5) - hash) + normalizedEmail.charCodeAt(i);
  //         hash = hash & hash; // Convert to 32-bit integer
  //       }

  //       // Create 64-character hex string
  //       const baseHex = Math.abs(hash).toString(16).padStart(8, '0');
  //       // Repeat pattern to get 64 characters
  //       return baseHex.repeat(8).substring(0, 64);
  //     };

  //     // Generate hashes (await both)
  //     const [reviewerEmailHash, managementEmailHash] = await Promise.all([
  //       hashEmail(userData.email),
  //       hashEmail(selectedTarget.email)
  //     ]);

  //     // Prepare feedback data
  //     const feedbackData: Record<string, any> = {
  //       'Timestamp': new Date().toISOString(),
  //       'Reviewer Email': reviewerEmailHash, // SHA-256 hash
  //       'Reviewer Name': userData.name,
  //       'Reviewer Process': userData.process,
  //       'Role Reviewed': selectedRole,
  //       'Process': selectedTarget.process || '',
  //       'Management Email ID': managementEmailHash, // SHA-256 hash
  //       'Management Name': selectedTarget.name || '',
  //       'Additional Comments': comments
  //     };

  //     if (userData.ldap) {
  //       feedbackData['Reviewer LDAP'] = userData.ldap;
  //     }

  //     // Convert numerical ratings to text
  //     const ratingTextMap: Record<string, string> = {
  //       '1': 'Strongly Disagree',
  //       '2': 'Disagree', 
  //       '3': 'Neutral',
  //       '4': 'Agree',
  //       '5': 'Strongly Agree'
  //     };

  //     questions.forEach((q) => {
  //       const columnName = q.question_text;
  //       const answerValue = answers[q.question_id];

  //       if (answerValue) {
  //         feedbackData[columnName] = ratingTextMap[answerValue] || answerValue;
  //       } else {
  //         feedbackData[columnName] = '';
  //       }
  //     });

  //     // Submit to Google Sheets
  //     const result = await submitFeedback(feedbackData);

  //     if (result.success) {
  //       saveFeedbackSubmission(
  //         selectedTarget.email,
  //         userData.email,
  //         selectedRole,
  //         selectedTarget.name
  //       );

  //       setStep('success');
  //       toast({
  //         title: 'Success!',
  //         description: `Your feedback for ${selectedTarget.name} has been submitted.`,
  //       });
  //     } else {
  //       throw new Error(result.error || 'Submission failed');
  //     }
  //   } catch (err) {
  //     console.error('Submission error:', err);
  //     toast({
  //       title: 'Submission Failed',
  //       description: err instanceof Error ? err.message : 'Please try again later.',
  //       variant: 'destructive',
  //     });
  //   } finally {
  //     setIsSubmitting(false);
  //   }
  // };
  // const handleSubmit = async () => {
  //   if (!canSubmit() || !selectedTarget || !userData) {
  //     toast({
  //       title: 'Incomplete Form',
  //       description: 'Please answer all questions before submitting.',
  //       variant: 'destructive',
  //     });
  //     return;
  //   }

  //   // Check if user has already submitted feedback for this target recently
  //   if (!canSubmitFeedback(selectedTarget.email, userData.email)) {
  //     const cooldownEnd = getCooldownEndDate(selectedTarget.email, userData.email);
  //     const message = cooldownEnd ? 
  //       `You've already submitted feedback for ${selectedTarget.name} recently. You can submit again on ${cooldownEnd.toLocaleDateString()}.` :
  //       `You've already submitted feedback for ${selectedTarget.name} recently. Please wait 6 months before submitting again.`;

  //     toast({
  //       title: 'Feedback Already Submitted',
  //       description: message,
  //       variant: 'destructive',
  //     });
  //     return;
  //   }

  //   setIsSubmitting(true);
  //   try {
  //     // Function to generate SHA-256 hash of email
  //     const generateSHA256Hash = async (email: string): Promise<string> => {
  //       const normalizedEmail = email.trim().toLowerCase();

  //       // Web Crypto API (modern browsers)
  //       if (typeof crypto !== 'undefined' && crypto.subtle) {
  //         try {
  //           const encoder = new TextEncoder();
  //           const data = encoder.encode(normalizedEmail);
  //           const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  //           const hashArray = Array.from(new Uint8Array(hashBuffer));
  //           return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  //         } catch (error) {
  //           console.warn('Web Crypto failed, using fallback:', error);
  //         }
  //       }

  //       // Fallback hash function (deterministic 64-char hex)
  //       let hash = 0;
  //       for (let i = 0; i < normalizedEmail.length; i++) {
  //         const char = normalizedEmail.charCodeAt(i);
  //         hash = ((hash << 5) - hash) + char;
  //         hash = hash & hash;
  //       }

  //       // Create consistent 64-character hex string
  //       const baseHex = Math.abs(hash).toString(16).padStart(8, '0');
  //       return baseHex.repeat(8).substring(0, 64);
  //     };

  //     // Hash ONLY the submitter's email (person giving feedback)
  //     const reviewerEmailHash = await generateSHA256Hash(userData.email);

  //     // DO NOT hash management email - keep it plain text
  //     const managementEmailPlain = selectedTarget.email;

  //     // Prepare feedback data
  //     const feedbackData: Record<string, any> = {
  //       'Timestamp': new Date().toISOString(),
  //       'Reviewer Email': reviewerEmailHash, // SHA-256 hash (anonymous)
  //       'Reviewer Name': userData.name,
  //       'Reviewer Process': userData.process,
  //       'Role Reviewed': selectedRole,
  //       'Process': selectedTarget.process || '',
  //       'Management Email ID': managementEmailPlain, // PLAIN TEXT (not hashed)
  //       'Management Name': selectedTarget.name || '',
  //       'Additional Comments': comments
  //     };

  //     // Add LDAP if available
  //     if (userData.ldap) {
  //       feedbackData['Reviewer LDAP'] = userData.ldap;
  //     }

  //     console.log('Submitting feedback (submitter anonymous, management identifiable):', {
  //       reviewerHash: `${reviewerEmailHash.substring(0, 16)}...`,
  //       reviewerOriginal: userData.email, // For debugging only
  //       managementEmail: managementEmailPlain, // Plain text
  //       managementName: selectedTarget.name,
  //       role: selectedRole
  //     });

  //     // Convert numerical answers to TEXT values
  //     const ratingTextMap: Record<string, string> = {
  //       '1': 'Strongly Disagree',
  //       '2': 'Disagree', 
  //       '3': 'Neutral',
  //       '4': 'Agree',
  //       '5': 'Strongly Agree'
  //     };

  //     // Add all question answers as TEXT values
  //     questions.forEach((q) => {
  //       const columnName = q.question_text;
  //       const answerValue = answers[q.question_id];

  //       if (answerValue) {
  //         const textValue = ratingTextMap[answerValue] || answerValue;
  //         feedbackData[columnName] = textValue;
  //       } else {
  //         feedbackData[columnName] = '';
  //       }
  //     });

  //     // Submit to Google Sheets
  //     const result = await submitFeedback(feedbackData);

  //     if (result.success) {
  //       // Save to local storage (using original emails for cooldown tracking)
  //       saveFeedbackSubmission(
  //         selectedTarget.email, // Plain management email
  //         userData.email, // Original reviewer email for cooldown
  //         selectedRole,
  //         selectedTarget.name
  //       );

  //       setStep('success');
  //       toast({
  //         title: 'Success!',
  //         description: `Your anonymous feedback for ${selectedTarget.name} has been submitted.`,
  //       });
  //     } else {
  //       throw new Error(result.error || 'Submission failed');
  //     }
  //   } catch (err) {
  //     console.error('Submission error:', err);

  //     // Provide user-friendly error message
  //     let errorMessage = 'Failed to submit feedback. ';
  //     if (err instanceof Error) {
  //       if (err.message.includes('403') || err.message.includes('permission')) {
  //         errorMessage = 'Permission denied by Google Sheets. Please contact administrator.';
  //       } else {
  //         errorMessage += err.message;
  //       }
  //     }

  //     toast({
  //       title: 'Submission Failed',
  //       description: errorMessage,
  //       variant: 'destructive',
  //     });
  //   } finally {
  //     setIsSubmitting(false);
  //   }
  // };
  const handleSubmit = async () => {
    if (!canSubmit() || !selectedTarget || !userData) {
      toast({
        title: 'Incomplete Form',
        description: 'Please answer all questions before submitting.',
        variant: 'destructive',
      });
      return;
    }

    if (!canSubmitFeedback(selectedTarget.email, userData.email)) {
      const cooldownEnd = getCooldownEndDate(selectedTarget.email, userData.email);
      const message = cooldownEnd ?
        `You've already submitted feedback for ${selectedTarget.name} recently. You can submit again on ${cooldownEnd.toLocaleDateString()}.` :
        `You've already submitted feedback for ${selectedTarget.name} recently. Please wait 6 months before submitting again.`;

      toast({
        title: 'Feedback Already Submitted',
        description: message,
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Function to generate SHA-256 hash
      const generateSHA256Hash = async (email: string): Promise<string> => {
        const normalizedEmail = email.trim().toLowerCase();

        if (typeof crypto !== 'undefined' && crypto.subtle) {
          try {
            const encoder = new TextEncoder();
            const data = encoder.encode(normalizedEmail);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
          } catch (error) {
            console.warn('Web Crypto failed, using fallback:', error);
          }
        }

        // Fallback
        let hash = 0;
        for (let i = 0; i < normalizedEmail.length; i++) {
          const char = normalizedEmail.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash;
        }

        const baseHex = Math.abs(hash).toString(16).padStart(8, '0');
        return baseHex.repeat(8).substring(0, 64);
      };

      // Hash the submitter's email
      const encryptedSubmitterId = await generateSHA256Hash(userData.email);

      // Prepare feedback data - MATCH EXACT COLUMN NAMES FROM YOUR SHEET
      // const feedbackData: Record<string, any> = {
      //   'Timestamp': new Date().toISOString(),
      //   'Encrypted Submitter ID': encryptedSubmitterId, // ✅ CORRECT COLUMN NAME
      //   'Role Reviewed': selectedRole,
      //   'Process': selectedTarget.process || '',
      //   'Management Email ID': selectedTarget.email, // Plain text

      //   // Demographic fields (you might want to collect these separately)
      //   'Gender': '', // You'll need to collect this
      //   'Tenure': '', // You'll need to collect this
      //   'Designation/Level': '', // You'll need to collect this
      //   'Age': '', // You'll need to collect this
      //   'Gender of the user': '', // You'll need to collect this

      //   // Add question answers
      //   'Additional Comments': comments
      // };
      // In handleSubmit function, the feedbackData object should include:
      const feedbackData: Record<string, any> = {
        'Timestamp': new Date().toISOString(),
        'Encrypted Submitter ID': encryptedSubmitterId,
        'Role Reviewed': selectedRole,
        'Process': selectedTarget.process || '',
        'Management Email ID': selectedTarget.email,

        // Demographic fields - pulled from userData
        'Gender': userData.gender || '',
        'Tenure': userData.tenure || '',
        'Designation/Level': userData.designation || '',
        'Age': userData.age || '',
        'Gender of the user': userData.genderOfManagement || '', // This might be different field

        'Additional Comments': comments
      };

      console.log('Submitting with encrypted ID:', {
        encryptedId: encryptedSubmitterId,
        length: encryptedSubmitterId.length,
        columnName: 'Encrypted Submitter ID',
        managementEmail: selectedTarget.email
      });

      // Convert numerical answers to TEXT values and map to your sheet columns
      const ratingTextMap: Record<string, string> = {
        '1': 'Strongly Disagree',
        '2': 'Disagree',
        '3': 'Neutral',
        '4': 'Agree',
        '5': 'Strongly Agree'
      };

      // Map your questions to the exact column names in your sheet
      // You need to match each question to its exact column name
      questions.forEach((q) => {
        const columnName = q.question_text; // This should match your sheet column names

        // Debug: Log the column name
        console.log('Processing question:', {
          questionId: q.question_id,
          questionText: q.question_text,
          columnName: columnName
        });

        const answerValue = answers[q.question_id];

        if (answerValue) {
          const textValue = ratingTextMap[answerValue] || answerValue;
          feedbackData[columnName] = textValue;
        } else {
          feedbackData[columnName] = '';
        }
      });

      // Debug: Check if encrypted ID is in the data
      console.log('Final data check - Encrypted Submitter ID exists?',
        'Encrypted Submitter ID' in feedbackData,
        'Value:', feedbackData['Encrypted Submitter ID']
      );

      // Submit to Google Sheets
      const result = await submitFeedback(feedbackData);

      if (result.success) {
        saveFeedbackSubmission(
          selectedTarget.email,
          userData.email,
          selectedRole,
          selectedTarget.name
        );

        setStep('success');
        toast({
          title: 'Success!',
          description: `Your feedback for ${selectedTarget.name} has been submitted.`,
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

  // Loading state
  if (step === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-muted to-background flex items-center justify-center p-4">
        <div className="vox-card max-w-lg w-full p-12 text-center animate-fade-in">
          <Loader2 className="w-12 h-12 text-secondary animate-spin mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Loading Feedback Form
          </h2>
          {/* <p className="text-muted-foreground mb-6">Preparing your feedback experience...</p> */}
        </div>
      </div>
    );
  }

  if (error && step !== 'select-target' && step !== 'questions') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-muted to-background flex items-center justify-center p-4">
        <div className="vox-card max-w-lg w-full p-12 text-center animate-fade-in">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Error Loading Data</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <div className="flex gap-4 justify-center">
            <Button onClick={identifyUserAndLoadData} variant="default">
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
    // Get remaining targets for the current user
    const remainingTargets = userData ?
      Object.entries(targets)
        .flatMap(([role, roleTargets]) =>
          roleTargets.filter(target =>
            canSubmitFeedback(target.email, userData.email) // Only show targets that can be submitted
          ).map(target => ({
            ...target,
            role
          }))
        ) : [];

    // Calculate statistics
    const totalTargets = Object.values(targets).flat().length;
    const submittedTargets = userData ?
      totalTargets - remainingTargets.length : 0;

    return (
      <div className="min-h-screen bg-gradient-to-b from-muted to-background py-8 px-4">
        <div className="vox-card max-w-3xl mx-auto animate-fade-in">
          <div className="p-8 md:p-12">
            <div className="w-24 h-24 mx-auto mb-6 bg-success/10 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-success" />
            </div>

            <h2 className="text-3xl font-bold text-foreground mb-4">Feedback Submitted!</h2>

            <div className="mb-6 p-4 bg-success/5 rounded-lg border border-success/20">
              <p className="text-center text-foreground">
                Your feedback for <span className="font-semibold">{selectedTarget?.name}</span> has been successfully submitted to Google Sheets.
              </p>
              <p className="text-center text-muted-foreground mt-2">
                Thank you for your valuable input!
              </p>
            </div>

            {/* Cooldown Information */}
            {userData && selectedTarget && (
              <div className="mt-6 mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-800">Feedback Cooldown Period</h4>
                    <p className="text-sm text-blue-600">
                      You can submit feedback for <span className="font-semibold">{selectedTarget.name}</span> again in 6 months.
                    </p>
                    <p className="text-xs text-blue-500 mt-1">
                      Next available: {
                        (() => {
                          const cooldownEnd = new Date();
                          cooldownEnd.setMonth(cooldownEnd.getMonth() + 6);
                          return cooldownEnd.toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          });
                        })()
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Pending Feedback Section */}
            {remainingTargets.length > 0 && (
              <div className="mt-8 mb-8">
                <h3 className="text-lg font-semibold text-secondary mb-4 flex items-center gap-2">
                  📋 Available Feedback
                  <span className="text-sm text-muted-foreground font-normal">
                    ({remainingTargets.length} available)
                  </span>
                </h3>

                <p className="text-muted-foreground mb-4">
                  You can also provide feedback for these other leaders:
                </p>

                <div className="space-y-3">
                  {remainingTargets.map((target, index) => (
                    <div
                      key={`${target.email}-${index}`}
                      className="p-4 bg-card rounded-lg border flex items-center justify-between hover:bg-accent/5 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          {target.role === 'POC' ? '👤' :
                            target.role === 'Manager' ? '👔' : '📊'}
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground">
                            {target.name}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {target.role} • {target.process}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {target.email}
                          </p>
                        </div>
                      </div>

                      <Button
                        onClick={() => {
                          setSelectedRole(target.role);
                          setSelectedTarget(target);
                          setAnswers({});
                          setComments('');
                          setStep('questions');
                        }}
                        className="vox-btn-primary"
                        size="sm"
                      >
                        Give Feedback
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Completion Message if no pending feedback */}
            {remainingTargets.length === 0 && userData && (
              <div className="mt-8 mb-8 p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">All Feedback Complete! 🎉</h4>
                    <p className="text-sm text-muted-foreground">
                      You have provided feedback for all your assigned leaders.
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground pl-13">
                  Your contributions help improve leadership across the organization.
                </p>
              </div>
            )}

            {/* Summary Stats */}
            <div className="mt-8 pt-6 border-t border-border">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-2xl font-bold text-foreground">
                    {totalTargets}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Leaders</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-2xl font-bold text-foreground">
                    {submittedTargets}
                  </p>
                  <p className="text-sm text-muted-foreground">Feedback Submitted</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-2xl font-bold text-foreground">
                    {remainingTargets.length}
                  </p>
                  <p className="text-sm text-muted-foreground">Available Now</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              {remainingTargets.length > 0 ? (
                <>
                  <Button onClick={resetAndGiveMore} className="vox-btn-primary">
                    Give More Feedback
                  </Button>
                  <Button onClick={() => navigate('/')} variant="outline">
                    Finish for Now
                  </Button>
                </>
              ) : (
                <>
                  <Button onClick={() => navigate('/')} className="vox-btn-primary">
                    Return to Dashboard
                  </Button>
                  <Button
                    onClick={() => {
                      setAnswers({});
                      setComments('');
                      setSelectedRole('');
                      setSelectedTarget(null);
                      setStep('select-target');
                    }}
                    variant="outline"
                  >
                    Review Feedback
                  </Button>
                </>
              )}
            </div>

            {/* Manage Feedback History */}
            <div className="mt-8 pt-6 border-t border-border">
              <details className="group">
                <summary className="flex items-center justify-between cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                  <span>View your feedback history</span>
                  <ChevronRight className="w-4 h-4 transition-transform group-open:rotate-90" />
                </summary>
                <div className="mt-3 p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">
                    Your feedback history is stored locally in your browser. This helps track your 6-month cooldown periods.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      localStorage.removeItem(STORAGE_KEY);
                      toast({
                        title: 'History Cleared',
                        description: 'Your feedback history has been cleared locally. Cooldown timers have been reset.',
                      });
                      setTimeout(() => window.location.reload(), 1000);
                    }}
                  >
                    Clear Local History
                  </Button>
                </div>
              </details>
            </div>
          </div>
        </div>
      </div>
    );
  }

if (step === 'select-target') {
  const totalTargets = Object.values(targets).flat().length;

  // Calculate statistics for each role
  const roleStats = Object.entries(targets).map(([role, roleTargets]) => {
    const submittedCount = userData ?
      roleTargets.filter(target => !canSubmitFeedback(target.email, userData.email)).length : 0;
    const availableCount = roleTargets.length - submittedCount;

    return {
      role,
      submittedCount,
      availableCount,
      totalCount: roleTargets.length
    };
  });

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

          {/* User Info Display with Demographics */}
          {/* {userData && (
            <div className="mb-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{userData.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {userData.email} • {userData.process}
                    {userData.ldap && ` • LDAP: ${userData.ldap}`}
                  </p>
                </div>
              </div>

              {(userData.gender || userData.tenure || userData.designation || userData.age) && (
                <div className="mt-3 pt-3 border-t border-primary/10">
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Your Demographics</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {userData.gender && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Gender:</span>
                        <span className="font-medium">{userData.gender}</span>
                      </div>
                    )}
                    {userData.tenure && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tenure:</span>
                        <span className="font-medium">{userData.tenure}</span>
                      </div>
                    )}
                    {userData.designation && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Designation:</span>
                        <span className="font-medium">{userData.designation}</span>
                      </div>
                    )}
                    {userData.age && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Age:</span>
                        <span className="font-medium">{userData.age}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    This information will be included anonymously with your feedback.
                  </p>
                </div>
              )}

              {!userData.email.includes('@') || userData.email === 'user@unknown.com' ? (
                <p className="mt-2 text-sm text-amber-600">
                  Note: You are viewing all available targets. For personalized targets, ensure you are signed into Google.
                </p>
              ) : null}
            </div>
          )} */}

          <h2 className="text-3xl font-bold text-foreground mb-2">Leadership Feedback</h2>
          <p className="text-muted-foreground mb-8">
            Select a leader to provide feedback for
          </p>

          {totalTargets > 0 ? (
            Object.entries(targets).map(([role, roleTargets]) => (
              roleTargets.length > 0 && (
                <div key={role} className="mb-8">
                  <h3 className="text-lg font-semibold text-secondary mb-4 flex items-center gap-2">
                    {role === 'POC' ? '👤 Point of Contact' :
                      role === 'Manager' ? '👔 Manager' : '📊 Account Manager'}
                    <span className="text-sm text-muted-foreground font-normal">
                      ({roleTargets.length} {roleTargets.length === 1 ? 'person' : 'people'})
                    </span>
                  </h3>

                  {roleTargets.map((target, index) => {
                    // Check if user can submit feedback for this target
                    const canSubmitTarget = userData ? 
                      canSubmitFeedback(target.email, userData.email) : true;
                    
                    // Get cooldown message if applicable
                    const cooldownEnd = userData ? 
                      getCooldownEndDate(target.email, userData.email) : null;
                    
                    const cooldownMessage = cooldownEnd ? 
                      formatCooldownMessage(cooldownEnd) : '';

                    return (
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
                          {/* Show cooldown status */}
                          {!canSubmitTarget && userData && (
                            <div className="mt-2 flex items-center gap-2 text-xs text-amber-600">
                              <Calendar className="w-3 h-3" />
                              <span>Feedback submitted. Available again in {cooldownMessage.toLowerCase()}</span>
                            </div>
                          )}
                        </div>

                        <Button
                          onClick={() => selectTarget(role, target)}
                          className="vox-btn-primary"
                          disabled={!canSubmitTarget}
                          title={!canSubmitTarget ? 
                            `Feedback submitted. Available again in ${cooldownMessage.toLowerCase()}` : 
                            'Select to provide feedback'}
                        >
                          {canSubmitTarget ? (
                            <>
                              Select
                              <ChevronRight className="w-4 h-4 ml-1" />
                            </>
                          ) : (
                            <>
                              <Calendar className="w-4 h-4 mr-1" />
                              On Cooldown
                            </>
                          )}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )
            ))
          ) : (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">No management data found.</p>
              <p className="text-sm text-muted-foreground mb-4">
                Please contact your administrator to add management data to the system.
              </p>
              <div className="flex gap-4 justify-center">
                <Button onClick={identifyUserAndLoadData} variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reload Data
                </Button>
                <Button onClick={() => navigate('/')} variant="outline">
                  Return Home
                </Button>
              </div>
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

          {/* Header with User Info */}
          <div className="mb-8">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-2">
                  Feedback for {selectedTarget?.name}
                </h2>
                <p className="text-muted-foreground">
                  {selectedRole} • {selectedTarget?.process}
                </p>
                <p className="text-sm text-muted-foreground mt-1">{selectedTarget?.email}</p>
              </div>
              {userData && (
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Submitted by</p>
                  <p className="font-medium text-foreground">{userData.name}</p>
                  <p className="text-xs text-muted-foreground">{userData.process}</p>
                </div>
              )}
            </div>
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
                      {question.options.map((option, optIdx) => {
                        const isSelected = answers[question.question_id] === (optIdx + 1).toString();
                        return (
                          <button
                            key={optIdx}
                            type="button"
                            onClick={() => handleAnswer(question.question_id, (optIdx + 1).toString())}
                            className={getRatingButtonClasses(option, isSelected)}
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No feedback questions loaded.</p>
              <Button onClick={identifyUserAndLoadData} variant="outline" className="mt-4">
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

          {/* Cooldown Reminder */}
          {userData && selectedTarget && !canSubmitFeedback(selectedTarget.email, userData.email) && (
            <div className="mt-4 p-3 bg-amber-50 rounded border border-amber-200">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <p className="text-sm text-amber-700">
                  You've already submitted feedback for this person recently.
                  Each person can be reviewed once every 6 months.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeedbackPage;