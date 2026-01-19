import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Loader2, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
// import { fetchSurveyQuestions, fetchManagementMapping, submitFeedback } from '@/services/sheetsApi';
// Change this import:
import { fetchSurveyQuestions, fetchManagementMapping, submitFeedback } from '@/services/sheetsApi';

// To ensure you're using the updated functions, verify they match the new signature
// Type definitions
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
// useEffect(() => {
//     const loadUserAndData = async () => {
//       try {
//         // Auto-detect user email
//         const userEmail = await detectUserEmail();
        
//         if (!userEmail || !userEmail.includes('@')) {
//           setError('Unable to identify your email. Please contact IT support.');
//           toast({
//             title: 'Identification Failed',
//             description: 'Could not automatically detect your email address.',
//             variant: 'destructive',
//           });
//           return;
//         }
        
//         console.log('Auto-detected email:', userEmail);
        
//         // Store in state (but don't show in UI)
//         setCurrentUserEmail(userEmail);
        
//         // Load data with detected email
//         loadFeedbackData(userEmail);
//       } catch (error) {
//         console.error('Email detection failed:', error);
//         setError('Unable to identify user. Please try again or contact support.');
//       }
//     };
    
//     loadUserAndData();
//   }, []);
  // Helper function to categorize questions
  // const getCategoryForQuestion = (questionText: string): string => {
  //   const text = questionText.toLowerCase();
    
  //   if (text.includes('support') || text.includes('approachability') || text.includes('guidance') || 
  //       text.includes('well-being') || text.includes('challenges') || text.includes('work-life')) {
  //     return 'Support & Approachability';
  //   } else if (text.includes('workload') || text.includes('task') || text.includes('capacity') || 
  //              text.includes('deadline') || text.includes('expectation')) {
  //     return 'Workload & Task Management';
  //   } else if (text.includes('leadership') || text.includes('direction') || text.includes('confidence') || 
  //              text.includes('motivation') || text.includes('inspiration')) {
  //     return 'Leadership & Direction';
  //   } else if (text.includes('feedback') || text.includes('performance') || text.includes('recognition') || 
  //              text.includes('improvement') || text.includes('goal')) {
  //     return 'Feedback & Performance';
  //   } else if (text.includes('fair') || text.includes('respect') || text.includes('inclusion') || 
  //              text.includes('favoritism') || text.includes('contribution')) {
  //     return 'Fairness & Respect';
  //   } else if (text.includes('team') || text.includes('culture') || text.includes('environment') || 
  //              text.includes('collaboration') || text.includes('trust')) {
  //     return 'Team Culture';
  //   } else if (text.includes('problem') || text.includes('decision') || text.includes('issue') || 
  //              text.includes('roadblock') || text.includes('analytical')) {
  //     return 'Problem Solving';
  //   } else if (text.includes('accountability') || text.includes('responsibility') || 
  //              text.includes('commitment') || text.includes('ownership')) {
  //     return 'Accountability';
  //   }
    
  //   return 'General';
  // };

  // Helper function to categorize questions (fallback)
// const getCategoryForQuestion = (questionText: string): string => {
//   const text = questionText.toLowerCase();
  
//   // Your sheet already has categories, but this is a fallback
//   if (text.includes('support') || text.includes('availability') || text.includes('well-being')) {
//     return 'Support & Approachability';
//   } else if (text.includes('workload') || text.includes('distribution') || text.includes('fair')) {
//     return 'Workload & Task Management';
//   } else if (text.includes('leadership') || text.includes('direction') || text.includes('vision')) {
//     return 'Leadership & Direction';
//   } else if (text.includes('feedback') || text.includes('performance') || text.includes('improvement')) {
//     return 'Feedback & Performance';
//   } else if (text.includes('fair') || text.includes('respect') || text.includes('inclusion')) {
//     return 'Fairness & Respect';
//   } else if (text.includes('team') || text.includes('collaboration') || text.includes('culture')) {
//     return 'Team Culture';
//   }
  
//   return 'General';
// };


// Helper function to categorize questions (fallback if topic detection fails)
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


// const transformQuestionsData = (data: any[]): Question[] => {
//   if (!data || data.length === 0) {
//     console.log('No data received from Google Sheets');
//     return [];
//   }
  
//   const questionsList: Question[] = [];
  
//   // Log the entire data structure to understand it better
//   console.log('Full data structure for debugging:');
//   data.forEach((row, index) => {
//     console.log(`Row ${index}:`, row);
//   });
  
//   // Find which column contains the questions
//   // Based on your description, it should be 'Topic: Support & Approachability'
//   // but let's find it dynamically
//   const possibleQuestionKeys = Object.keys(data[0] || {});
//   console.log('Available keys/columns:', possibleQuestionKeys);
  
//   // Try to find the question column - it should have longer text
//   let questionKey = possibleQuestionKeys[0]; // Default to first key
  
//   // Look for a key that contains question-like data
//   for (let i = 0; i < Math.min(5, data.length); i++) {
//     const row = data[i];
//     if (row) {
//       for (const key of possibleQuestionKeys) {
//         const value = row[key];
//         if (value && typeof value === 'string' && value.length > 20) {
//           questionKey = key;
//           console.log(`Found likely question column: ${questionKey} with value: ${value.substring(0, 50)}...`);
//           break;
//         }
//       }
//     }
//   }
  
//   console.log(`Using question column: ${questionKey}`);
  
//   let questionNumber = 1;
  
//   for (let i = 0; i < data.length; i++) {
//     const row = data[i];
//     if (!row) continue;
    
//     const cellValue = row[questionKey];
    
//     if (cellValue && typeof cellValue === 'string') {
//       const trimmedValue = cellValue.trim();
      
//       // Check if this is a question (not a header or rating option)
//       const isQuestion = 
//         trimmedValue.length > 10 && // Reasonable length for a question
//         !trimmedValue.toLowerCase().includes('topic:') &&
//         !trimmedValue.toLowerCase().includes('about you') &&
//         !trimmedValue.toLowerCase().includes('your role') &&
//         !trimmedValue.toLowerCase().includes('overall rating') &&
//         !trimmedValue.toLowerCase().includes('gender') &&
//         !trimmedValue.toLowerCase().includes('tenure') &&
//         !trimmedValue.toLowerCase().includes('designation') &&
//         !trimmedValue.toLowerCase().includes('level') &&
//         !trimmedValue.toLowerCase().includes('age') &&
//         trimmedValue !== 'Strongly disagree' &&
//         trimmedValue !== 'disagree' &&
//         trimmedValue !== 'neutral' &&
//         trimmedValue !== 'agree' &&
//         trimmedValue !== 'Strongly agree' &&
//         !trimmedValue.toLowerCase().includes('strongly disagree') &&
//         !trimmedValue.toLowerCase().includes('strongly agree');
      
//       if (isQuestion) {
//         console.log(`[${i}] Adding question ${questionNumber}: ${trimmedValue.substring(0, 60)}...`);
        
//         questionsList.push({
//           question_id: `q${questionNumber}`,
//           question_text: trimmedValue,
//           question_type: 'rating',
//           options: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'],
//           category: getCategoryForQuestion(trimmedValue),
//           required: true
//         });
//         questionNumber++;
//       } else {
//         console.log(`[${i}] Skipping: ${trimmedValue.substring(0, 60)}...`);
//       }
//     }
//   }
  
//   console.log(`Successfully extracted ${questionsList.length} questions`);
  
//   // If still no questions, try a different approach
//   if (questionsList.length === 0) {
//     console.log('Trying alternative extraction method...');
    
//     // Extract all string values that look like questions
//     for (let i = 0; i < data.length; i++) {
//       const row = data[i];
//       if (row) {
//         // Check all columns in this row
//         Object.values(row).forEach((value) => {
//           if (typeof value === 'string' && value.trim().length > 20) {
//             const trimmed = value.trim();
//             // Basic filter to exclude headers
//             if (!trimmed.toLowerCase().includes('topic:') && 
//                 !trimmed.toLowerCase().includes('about you')) {
//               console.log(`Found potential question in row ${i}: ${trimmed.substring(0, 50)}...`);
//               questionsList.push({
//                 question_id: `q${questionsList.length + 1}`,
//                 question_text: trimmed,
//                 question_type: 'rating',
//                 options: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'],
//                 category: getCategoryForQuestion(trimmed),
//                 required: true
//               });
//             }
//           }
//         });
//       }
//     }
//   }
  
//   return questionsList;
// };

// const transformQuestionsData = (data: any[]): Question[] => {
//   if (!data || data.length === 0) {
//     console.log('No data received from Google Sheets');
//     return [];
//   }
  
//   console.log('Raw questions data structure:', {
//     totalRows: data.length,
//     headers: Object.keys(data[0] || {}),
//     firstRow: data[0]
//   });
  
//   const questionsList: Question[] = [];
  
//   // Look for question columns - they likely contain actual questions
//   // Based on typical survey structure, questions are in specific columns
//   const possibleQuestionColumns = [
//     'Topic: Support & Approachability',
//     'Topic: Workload & Task Management',
//     'Topic: Leadership & Direction',
//     'Topic: Feedback & Performance',
//     'Topic: Fairness & Respect',
//     'Topic: Team Culture',
//     'Topic: Problem Solving',
//     'Topic: Accountability'
//   ];
  
//   // First, find which columns exist in our data
//   const headers = Object.keys(data[0] || {});
//   console.log('Available columns:', headers);
  
//   // Filter to find question columns
//   const questionColumns = headers.filter(header => 
//     possibleQuestionColumns.some(possible => 
//       header.toLowerCase().includes('topic:') || 
//       header.toLowerCase().includes('question')
//     )
//   );
  
//   console.log('Question columns found:', questionColumns);
  
//   if (questionColumns.length === 0) {
//     // Try a different approach - look for columns with long text
//     for (const header of headers) {
//       // Check the first few rows to see if this column contains questions
//       let hasQuestions = false;
//       for (let i = 0; i < Math.min(5, data.length); i++) {
//         const value = data[i]?.[header];
//         if (value && typeof value === 'string' && value.length > 20) {
//           hasQuestions = true;
//           break;
//         }
//       }
      
//       if (hasQuestions) {
//         questionColumns.push(header);
//       }
//     }
//   }
  
//   console.log('Final question columns:', questionColumns);
  
//   // Extract questions from the first row (assuming questions are in first row)
//   if (data.length > 0) {
//     const firstRow = data[0];
    
//     for (const column of questionColumns) {
//       const questionText = firstRow[column];
      
//       if (questionText && typeof questionText === 'string' && questionText.trim().length > 10) {
//         const trimmedText = questionText.trim();
        
//         // Skip headers and rating labels
//         if (
//           trimmedText.toLowerCase().includes('strongly') ||
//           trimmedText.toLowerCase().includes('disagree') ||
//           trimmedText.toLowerCase().includes('neutral') ||
//           trimmedText.toLowerCase().includes('agree') ||
//           trimmedText.length < 10
//         ) {
//           continue;
//         }
        
//         console.log(`Found question in column "${column}": ${trimmedText.substring(0, 50)}...`);
        
//         questionsList.push({
//           question_id: `q${questionsList.length + 1}`,
//           question_text: trimmedText,
//           question_type: 'rating',
//           options: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'],
//           category: getCategoryForQuestion(trimmedText),
//           required: true
//         });
//       }
//     }
//   }
  
//   // If still no questions, try to extract from all rows
//   if (questionsList.length === 0) {
//     console.log('Trying alternative extraction from all rows...');
    
//     for (let i = 0; i < data.length; i++) {
//       const row = data[i];
//       if (!row) continue;
      
//       // Check all string values in this row
//       for (const [key, value] of Object.entries(row)) {
//         if (typeof value === 'string' && value.trim().length > 20) {
//           const trimmed = value.trim();
          
//           // Skip if it's likely not a question
//           if (
//             trimmed.toLowerCase().includes('strongly') ||
//             trimmed.toLowerCase().includes('about you') ||
//             trimmed.toLowerCase().includes('your role') ||
//             trimmed.toLowerCase().includes('overall rating') ||
//             trimmed.toLowerCase().includes('gender') ||
//             trimmed.toLowerCase().includes('tenure') ||
//             trimmed.toLowerCase().includes('designation') ||
//             trimmed.toLowerCase().includes('level') ||
//             trimmed.toLowerCase().includes('age')
//           ) {
//             continue;
//           }
          
//           // Check if this looks like a question
//           if (trimmed.endsWith('?') || trimmed.includes('?')) {
//             console.log(`Found question in row ${i}, column "${key}": ${trimmed.substring(0, 50)}...`);
            
//             if (!questionsList.some(q => q.question_text === trimmed)) {
//               questionsList.push({
//                 question_id: `q${questionsList.length + 1}`,
//                 question_text: trimmed,
//                 question_type: 'rating',
//                 options: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'],
//                 category: getCategoryForQuestion(trimmed),
//                 required: true
//               });
//             }
//           }
//         }
//       }
//     }
//   }
  
//   console.log(`Extracted ${questionsList.length} questions`);
  
//   // If we have no questions, create some defaults for testing
//   if (questionsList.length === 0) {
//     console.log('Creating default questions for testing');
//     questionsList.push(
//       {
//         question_id: 'q1',
//         question_text: 'My manager provides clear direction and expectations.',
//         question_type: 'rating',
//         options: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'],
//         category: 'Leadership & Direction',
//         required: true
//       },
//       {
//         question_id: 'q2',
//         question_text: 'I feel comfortable approaching my manager with concerns.',
//         question_type: 'rating',
//         options: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'],
//         category: 'Support & Approachability',
//         required: true
//       }
//     );
//   }
  
//   return questionsList;
// };

// const transformQuestionsData = (data: any[]): Question[] => {
//   if (!data || data.length === 0) {
//     console.log('No data received from Google Sheets');
//     return [];
//   }
  
//   console.log('Processing questions from Google Sheets...');
//   console.log('Total rows:', data.length);
  
//   const questionsList: Question[] = [];
//   let currentCategory = 'General'; // Default category
  
//   // Debug: Show first few rows
//   console.log('\nFirst 10 rows of raw data:');
//   data.slice(0, 10).forEach((row, index) => {
//     console.log(`Row ${index}:`, row);
//   });
  
//   // The data is an array of objects, each representing a row
//   // Each object has keys like: 'Topic: Support & Approachability', 'Unnamed: 1', etc.
//   // The first column contains either topics or questions
  
//   // Find the key for the first column (it varies based on Google Sheets export)
//   const firstColumnKey = Object.keys(data[0] || {})[0] || '';
//   console.log('First column key:', firstColumnKey);
  
//   data.forEach((row, rowIndex) => {
//     // Get the value from the first column
//     const firstCellValue = row[firstColumnKey] || '';
    
//     if (typeof firstCellValue !== 'string') return;
    
//     const text = firstCellValue.trim();
    
//     // Skip empty rows
//     if (!text) return;
    
//     console.log(`Row ${rowIndex}: "${text.substring(0, 50)}..."`);
    
//     // Check if this is a topic header
//     if (text.toLowerCase().startsWith('topic:')) {
//       currentCategory = text.replace('Topic:', '').trim();
//       console.log(`  → Category set to: ${currentCategory}`);
//       return;
//     }
    
//     // Skip rating option rows (they start with "Strongly disagree" or similar)
//     if (text.toLowerCase() === 'strongly disagree' || 
//         text.toLowerCase() === 'disagree' ||
//         text.toLowerCase() === 'neutral' ||
//         text.toLowerCase() === 'agree' ||
//         text.toLowerCase() === 'strongly agree') {
//       console.log('  → Skipping rating option');
//       return;
//     }
    
//     // Skip other headers/demographics
//     if (text.toLowerCase().includes('about you') ||
//         text.toLowerCase().includes('your role') ||
//         text.toLowerCase().includes('overall rating') ||
//         text.toLowerCase().includes('gender') ||
//         text.toLowerCase().includes('tenure') ||
//         text.toLowerCase().includes('designation') ||
//         text.toLowerCase().includes('level') ||
//         text.toLowerCase().includes('age') ||
//         text.length < 10) { // Too short to be a real question
//       console.log('  → Skipping header/demographic');
//       return;
//     }
    
//     // If we get here, this is likely a question!
//     // Check if it looks like a question (ends with ? or is reasonably long)
//     if (text.length >= 15 && (text.endsWith('?') || text.includes('?') || 
//         text.toLowerCase().includes('how') || 
//         text.toLowerCase().includes('what') ||
//         text.toLowerCase().includes('why'))) {
      
//       console.log(`  ✓ Found question: "${text.substring(0, 60)}..."`);
      
//       questionsList.push({
//         question_id: `q${questionsList.length + 1}`,
//         question_text: text,
//         question_type: 'rating',
//         options: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'],
//         category: currentCategory,
//         required: true
//       });
//     } else {
//       console.log(`  → Not a question: "${text.substring(0, 30)}..."`);
//     }
//   });
  
//   console.log(`\n✅ Successfully extracted ${questionsList.length} questions`);
  
//   // Debug: Show all questions found
//   if (questionsList.length > 0) {
//     console.log('\n📋 Questions found:');
//     questionsList.forEach((q, i) => {
//       console.log(`${i + 1}. [${q.category}] ${q.question_text.substring(0, 70)}...`);
//     });
//   } else {
//     console.log('\n⚠️ No questions found! Trying alternative extraction method...');
    
//     // Alternative: Extract based on pattern matching
//     data.forEach((row, rowIndex) => {
//       const firstCellValue = row[firstColumnKey] || '';
//       if (typeof firstCellValue !== 'string') return;
      
//       const text = firstCellValue.trim();
      
//       // Simple pattern: if it's a decent length and not a header, treat as question
//       if (text.length > 20 && 
//           !text.toLowerCase().startsWith('topic:') &&
//           !text.toLowerCase().includes('about you') &&
//           !text.toLowerCase().includes('your role') &&
//           text !== 'Strongly disagree' &&
//           text !== 'disagree' &&
//           text !== 'neutral' &&
//           text !== 'agree' &&
//           text !== 'Strongly agree') {
        
//         console.log(`Alternative: Found question at row ${rowIndex}: ${text.substring(0, 50)}...`);
        
//         questionsList.push({
//           question_id: `q${questionsList.length + 1}`,
//           question_text: text,
//           question_type: 'rating',
//           options: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'],
//           category: getCategoryForQuestion(text), // Use the helper function
//           required: true
//         });
//       }
//     });
    
//     console.log(`Alternative method found ${questionsList.length} questions`);
//   }
  
//   // If still no questions, create defaults for testing
//   if (questionsList.length === 0) {
//     console.log('Creating default questions for testing');
//     questionsList.push(
//       {
//         question_id: 'q1',
//         question_text: 'Availability of support when needed',
//         question_type: 'rating',
//         options: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'],
//         category: 'Support & Approachability',
//         required: true
//       },
//       {
//         question_id: 'q2',
//         question_text: 'Demonstration of concern for well-being',
//         question_type: 'rating',
//         options: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'],
//         category: 'Support & Approachability',
//         required: true
//       },
//       {
//         question_id: 'q3',
//         question_text: 'Fair distribution of workload',
//         question_type: 'rating',
//         options: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'],
//         category: 'Workload & Task Management',
//         required: true
//       }
//     );
//   }
  
//   return questionsList;
// };
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
    
    // If we get here, this is likely a question!
    // Questions should be reasonable length and not be topics
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
// Transform mapping data from Google Sheets format
  // const transformMappingData = (data: any[]): FeedbackTargets => {
  //   const targetsData: FeedbackTargets = {
  //     'POC': [],
  //     'Manager': [],
  //     'Account Manager': []
  //   };

  //   data.forEach((item) => {
  //     const email = item.Email;
  //     if (email && email.includes('@')) {
  //       const baseInfo = {
  //         email: email,
  //         name: item.Ldap || email.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase()),
  //         process: item.Process || 'General',
  //         role: ''
  //       };

  //       // Add to POC if has POC column
  //       if (item.POC && item.POC.includes('@')) {
  //         targetsData['POC'].push({ 
  //           ...baseInfo, 
  //           role: 'POC',
  //           name: item.POC.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase())
  //         });
  //       }

  //       // Add to Manager if has Manager column
  //       if (item.Manager && item.Manager.includes('@')) {
  //         targetsData['Manager'].push({ 
  //           ...baseInfo, 
  //           role: 'Manager',
  //           name: item.Manager.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase())
  //         });
  //       }

  //       // Add to Account Manager if has Account manager column
  //       if (item['Account manager'] && item['Account manager'].includes('@')) {
  //         targetsData['Account Manager'].push({ 
  //           ...baseInfo, 
  //           role: 'Account Manager',
  //           name: item['Account manager'].split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase())
  //         });
  //       }
  //     }
  //   });

  //   return targetsData;
  // };
  // Transform mapping data from Google Sheets format - FIXED VERSION
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

  // Log for debugging
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

      // Load questions from Google Sheets
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

  // const handleSubmit = async () => {
  //   if (!canSubmit() || !selectedTarget) {
  //     toast({
  //       title: 'Incomplete Form',
  //       description: 'Please answer all questions before submitting.',
  //       variant: 'destructive',
  //     });
  //     return;
  //   }

  //   setIsSubmitting(true);
  //   try {
  //     // Prepare feedback data matching your RESPONSE sheet columns
  //     const feedbackData: Record<string, any> = {
  //       'Timestamp': new Date().toISOString(),
  //       'Encrypted Submitter ID': `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  //       'Role Reviewed': selectedRole,
  //       'Process': selectedTarget?.process || '',
  //       'Management Email ID': selectedTarget?.email || '',
  //       'Additional Comments': comments
  //     };

  //     // Add all question answers (ratings will be converted to 1-5 scale)
  //     questions.forEach((q) => {
  //       const columnName = q.question_text;
  //       const answerValue = answers[q.question_id];
  //       // Convert Strongly Disagree(1) to Strongly Agree(5) scale
  //       const ratingValue = answerValue ? parseInt(answerValue) : '';
  //       feedbackData[columnName] = ratingValue;
  //     });

  //     console.log('Submitting feedback:', feedbackData);

  //     // Submit to Google Sheets
  //     const result = await submitFeedback(feedbackData);
      
  //     if (result.success) {
  //       setStep('success');
  //       toast({
  //         title: 'Success!',
  //         description: 'Your feedback has been submitted to Google Sheets.',
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
//   if (!canSubmit() || !selectedTarget) {
//     toast({
//       title: 'Incomplete Form',
//       description: 'Please answer all questions before submitting.',
//       variant: 'destructive',
//     });
//     return;
//   }

//   setIsSubmitting(true);
//   try {
//     // Prepare feedback data matching your RESPONSE sheet columns
//     const feedbackData: Record<string, any> = {
//       'Timestamp': new Date().toISOString(),
//       'Encrypted Submitter ID': `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
//       'Role Reviewed': selectedRole,
//       'Process': selectedTarget?.process || '',
//       'Management Email ID': selectedTarget?.email || '', // This should be the POC/Manager/Account Manager email
//       'Additional Comments': comments
//     };

//     // Add submitter email (if you want to track who submitted)
//     if (currentUserEmail) {
//       feedbackData['Submitter Email'] = currentUserEmail;
//     }

//     console.log('Submitting feedback with these details:', {
//       managementEmail: selectedTarget?.email,
//       managementName: selectedTarget?.name,
//       role: selectedRole,
//       submitterEmail: currentUserEmail
//     });

//     // Add all question answers
//     questions.forEach((q) => {
//       const columnName = q.question_text;
//       const answerValue = answers[q.question_id];
//       const ratingValue = answerValue ? parseInt(answerValue) : '';
//       feedbackData[columnName] = ratingValue;
//     });

//     console.log('Full submission data:', feedbackData);

//     // Submit to Google Sheets
//     const result = await submitFeedback(feedbackData);
    
//     if (result.success) {
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
    // Prepare feedback data matching your RESPONSE sheet columns
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

  // Group questions by category with proper typing
  // const groupedQuestions = questions.reduce((acc: Record<string, Question[]>, q: Question) => {
  //   const category = q.category || 'General';
  //   if (!acc[category]) {
  //     acc[category] = [];
  //   }
  //   acc[category].push(q);
  //   return acc;
  // }, {});

  // Group questions by category with proper typing
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
          <p className="text-muted-foreground">Fetching questions from Google Sheets...</p>
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
                          className={`px-4 py-2 rounded border ${
                            answers[question.question_id] === (optIdx + 1).toString()
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




// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { ArrowLeft, ChevronRight, Loader2, AlertCircle, CheckCircle2, RefreshCw, User } from 'lucide-react';
// import { Button } from '@/components/ui/button';
// import { Textarea } from '@/components/ui/textarea';
// import { Progress } from '@/components/ui/progress';
// import { useToast } from '@/hooks/use-toast';
// import { fetchSurveyQuestions, fetchManagementMapping, submitFeedback } from '@/services/sheetsApi';

// // Type definitions
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

// type FeedbackStep = 'loading' | 'select-target' | 'questions' | 'success';

// const FeedbackPage = () => {
//   const navigate = useNavigate();
//   const { toast } = useToast();
  
//   const [step, setStep] = useState<FeedbackStep>('loading');
//   const [targets, setTargets] = useState<FeedbackTargets>({});
//   const [questions, setQuestions] = useState<Question[]>([]);
//   const [error, setError] = useState<string | null>(null);
  
//   // User email state - in a real app, this would come from authentication
//   const [currentUserEmail, setCurrentUserEmail] = useState<string>('');
  
//   const [selectedRole, setSelectedRole] = useState('');
//   const [selectedTarget, setSelectedTarget] = useState<FeedbackTarget | null>(null);
//   const [answers, setAnswers] = useState<Record<string, string>>({});
//   const [comments, setComments] = useState('');
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   // Get user email on component mount
//   useEffect(() => {
//     // In a real application, you would get this from:
//     // 1. Authentication context (e.g., Auth0, Firebase, custom auth)
//     // 2. Local storage/session storage
//     // 3. URL parameters
//     // 4. User profile API
    
//     // For now, we'll simulate getting it from localStorage or use a test email
//     const getUserEmail = () => {
//       // Try to get from localStorage (if you have auth setup)
//       const storedEmail = localStorage.getItem('userEmail');
      
//       // Try to get from URL parameters
//       const urlParams = new URLSearchParams(window.location.search);
//       const emailFromUrl = urlParams.get('email');
      
//       // Priority: URL param > localStorage > test email
//       return emailFromUrl || storedEmail || 'somy@google.com'; // Default test email
//     };
    
//     const userEmail = getUserEmail();
//     setCurrentUserEmail(userEmail);
    
//     // Load data with user email
//     loadFeedbackData(userEmail);
//   }, []);

//   // Helper function to categorize questions
//   const getCategoryForQuestion = (questionText: string): string => {
//     const text = questionText.toLowerCase();
    
//     if (text.includes('support') || text.includes('approachability') || text.includes('guidance') || 
//         text.includes('well-being') || text.includes('challenges') || text.includes('work-life')) {
//       return 'Support & Approachability';
//     } else if (text.includes('workload') || text.includes('task') || text.includes('capacity') || 
//                text.includes('deadline') || text.includes('expectation')) {
//       return 'Workload & Task Management';
//     } else if (text.includes('leadership') || text.includes('direction') || text.includes('confidence') || 
//                text.includes('motivation') || text.includes('inspiration')) {
//       return 'Leadership & Direction';
//     } else if (text.includes('feedback') || text.includes('performance') || text.includes('recognition') || 
//                text.includes('improvement') || text.includes('goal')) {
//       return 'Feedback & Performance';
//     } else if (text.includes('fair') || text.includes('respect') || text.includes('inclusion') || 
//                text.includes('favoritism') || text.includes('contribution')) {
//       return 'Fairness & Respect';
//     } else if (text.includes('team') || text.includes('culture') || text.includes('environment') || 
//                text.includes('collaboration') || text.includes('trust')) {
//       return 'Team Culture';
//     } else if (text.includes('problem') || text.includes('decision') || text.includes('issue') || 
//                text.includes('roadblock') || text.includes('analytical')) {
//       return 'Problem Solving';
//     } else if (text.includes('accountability') || text.includes('responsibility') || 
//                text.includes('commitment') || text.includes('ownership')) {
//       return 'Accountability';
//     }
    
//     return 'General';
//   };

//   // Transform questions from Google Sheets format
//   // const transformQuestionsData = (data: any[]): Question[] => {
//   //   if (!data || data.length === 0) {
//   //     console.log('No data received from Google Sheets');
//   //     return [];
//   //   }
    
//   //   const questionsList: Question[] = [];
//   //   let questionIndex = 1;
    
//   //   data.forEach((item) => {
//   //     const questionText = item['Topic: Support & Approachability'];
      
//   //     if (questionText && typeof questionText === 'string' && questionText.trim() !== '') {
//   //       const trimmedText = questionText.trim();
        
//   //       // Skip headers, rating options, and demographic questions
//   //       if (
//   //         trimmedText.toLowerCase().includes('topic:') ||
//   //         trimmedText.toLowerCase().includes('about you') ||
//   //         trimmedText.toLowerCase().includes('overall experience') ||
//   //         trimmedText.toLowerCase().includes('your role') ||
//   //         trimmedText.toLowerCase().includes('overall rating') ||
//   //         trimmedText.toLowerCase().includes('gender') ||
//   //         trimmedText.toLowerCase().includes('tenure') ||
//   //         trimmedText.toLowerCase().includes('designation') ||
//   //         trimmedText.toLowerCase().includes('level') ||
//   //         trimmedText.toLowerCase().includes('age') ||
//   //         trimmedText === 'Strongly disagree' ||
//   //         trimmedText === 'disagree' ||
//   //         trimmedText === 'neutral' ||
//   //         trimmedText === 'agree' ||
//   //         trimmedText === 'Strongly agree' ||
//   //         trimmedText.length < 10 // Too short to be a real question
//   //       ) {
//   //         return;
//   //       }
        
//   //       questionsList.push({
//   //         question_id: `q${questionIndex}`,
//   //         question_text: trimmedText,
//   //         question_type: 'rating',
//   //         options: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'],
//   //         category: getCategoryForQuestion(trimmedText),
//   //         required: true
//   //       });
//   //       questionIndex++;
//   //     }
//   //   });
    
//   //   console.log(`Transformed ${questionsList.length} questions`);
//   //   return questionsList;
//   // };
// // Replace the entire transformQuestionsData function with this:
// const transformQuestionsData = (data: any[]): Question[] => {
//   if (!data || data.length === 0) {
//     console.log('No data received from Google Sheets');
//     return [];
//   }
  
//   console.log('Questions data structure:', {
//     totalRows: data.length,
//     sample: data.slice(0, 3)
//   });
  
//   const questionsList: Question[] = [];
//   let currentCategory = "General";
  
//   for (let i = 0; i < data.length; i++) {
//     const row = data[i];
//     if (!row || row.length === 0) continue;
    
//     // Get the first cell (column A) which contains the text
//     const firstCell = row[0] || '';
//     if (typeof firstCell !== 'string') continue;
    
//     const text = firstCell.trim();
//     if (!text) continue;
    
//     // Check if this is a topic header
//     if (text.startsWith('Topic:')) {
//       currentCategory = text.replace('Topic:', '').trim();
//       console.log(`Found category: ${currentCategory}`);
//       continue;
//     }
    
//     // Skip rating option labels
//     if (text === 'Strongly disagree' || 
//         text === 'disagree' || 
//         text === 'neutral' || 
//         text === 'agree' || 
//         text === 'Strongly agree') {
//       continue;
//     }
    
//     // Skip section headers and demographic questions
//     if (text.includes('About You') || 
//         text.includes('Overall Experience') ||
//         text.includes('Your Role') ||
//         text.includes('Overall Rating') ||
//         text.includes('Gender') ||
//         text.includes('Tenure') ||
//         text.includes('Designation') ||
//         text.includes('Level') ||
//         text.includes('Age')) {
//       continue;
//     }
    
//     // Check if this is likely a question (has reasonable length and not empty)
//     if (text.length > 10 && !text.includes('Topic:')) {
//       const questionId = `q${questionsList.length + 1}`;
//       console.log(`Found question ${questionId}: "${text.substring(0, 50)}..." (Category: ${currentCategory})`);
      
//       questionsList.push({
//         question_id: questionId,
//         question_text: text,
//         question_type: 'rating',
//         options: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'],
//         category: currentCategory,
//         required: true
//       });
//     }
//   }
  
//   console.log(`Transformed ${questionsList.length} questions`);
  
//   // Debug: log first few questions
//   if (questionsList.length > 0) {
//     console.log('First 3 questions:');
//     questionsList.slice(0, 3).forEach((q, i) => {
//       console.log(`  ${i + 1}. ${q.question_text.substring(0, 50)}...`);
//     });
//   }
  
//   return questionsList;
// };
//   // Transform mapping data from Google Sheets format - FILTERED BY USER
//   const transformMappingData = (data: any[]): FeedbackTargets => {
//     const targetsData: FeedbackTargets = {
//       'POC': [],
//       'Manager': [],
//       'Account Manager': []
//     };

//     // Data is already filtered by backend for this user
//     data.forEach((item) => {
//       // Extract POC
//       if (item.POC && item.POC.includes('@')) {
//         targetsData['POC'].push({
//           email: item.POC,
//           name: item.POC.split('@')[0]
//             .replace('.', ' ')
//             .replace(/\b\w/g, l => l.toUpperCase()),
//           process: item.Process || 'General',
//           role: 'POC'
//         });
//       }

//       // Extract Manager
//       if (item.Manager && item.Manager.includes('@')) {
//         targetsData['Manager'].push({
//           email: item.Manager,
//           name: item.Manager.split('@')[0]
//             .replace('.', ' ')
//             .replace(/\b\w/g, l => l.toUpperCase()),
//           process: item.Process || 'General',
//           role: 'Manager'
//         });
//       }

//       // Extract Account Manager
//       if (item['Account manager'] && item['Account manager'].includes('@')) {
//         targetsData['Account Manager'].push({
//           email: item['Account manager'],
//           name: item['Account manager'].split('@')[0]
//             .replace('.', ' ')
//             .replace(/\b\w/g, l => l.toUpperCase()),
//           process: item.Process || 'General',
//           role: 'Account Manager'
//         });
//       }
//     });

//     console.log('Transformed targets by role:', {
//       POC: targetsData['POC'].length,
//       Manager: targetsData['Manager'].length,
//       AccountManager: targetsData['Account Manager'].length
//     });

//     return targetsData;
//   };

//   // const loadFeedbackData = async (userEmail?: string) => {
//   //   setStep('loading');
//   //   try {
//   //     console.log('Starting data load for user:', userEmail || 'No user specified');
      
//   //     // Load questions from Google Sheets
//   //     const questionsResult = await fetchSurveyQuestions();
//   //     console.log('Questions API result:', {
//   //       success: questionsResult.success,
//   //       dataLength: questionsResult.data?.length
//   //     });
      
//   //     if (questionsResult.success && questionsResult.data) {
//   //       const transformedQuestions = transformQuestionsData(questionsResult.data);
//   //       setQuestions(transformedQuestions);
        
//   //       if (transformedQuestions.length === 0) {
//   //         console.warn('No questions were transformed from the data');
//   //       }
//   //     } else {
//   //       throw new Error(questionsResult.error || 'Failed to load questions');
//   //     }

//   //     // Load management data from Google Sheets - WITH USER FILTERING
//   //     const mappingResult = await fetchManagementMapping(userEmail);
//   //     console.log('Mapping result:', {
//   //       success: mappingResult.success,
//   //       dataLength: mappingResult.data?.length,
//   //       userEmail: userEmail
//   //     });
      
//   //     if (mappingResult.success && mappingResult.data) {
//   //       const targetsData = transformMappingData(mappingResult.data);
//   //       console.log('Targets loaded:', {
//   //         POC: targetsData['POC']?.length,
//   //         Manager: targetsData['Manager']?.length,
//   //         AccountManager: targetsData['Account Manager']?.length
//   //       });
        
//   //       setTargets(targetsData);
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
// const loadFeedbackData = async (userEmail?: string) => {
//   setStep('loading');
//   try {
//     console.log('Starting data load for user:', userEmail || 'No user specified');
    
//     // Load questions from Google Sheets
//     const questionsResult = await fetchSurveyQuestions();
//     console.log('Questions API result:', {
//       success: questionsResult.success,
//       dataLength: questionsResult.data?.length,
//       dataSample: questionsResult.data?.slice(0, 3)
//     });
    
//     if (questionsResult.success && questionsResult.data) {
//       // Debug the raw data structure
//       console.log('RAW QUESTIONS DATA:');
//       questionsResult.data.forEach((item: any, index: number) => {
//         console.log(`Row ${index}:`, item);
//       });
      
//       const transformedQuestions = transformQuestionsData(questionsResult.data);
//       console.log('Transformed questions count:', transformedQuestions.length);
//       setQuestions(transformedQuestions);
      
//       if (transformedQuestions.length === 0) {
//         console.warn('No questions were transformed from the data');
//         // Try a different transformation approach
//         const alternativeQuestions = transformQuestionsDataAlternative(questionsResult.data);
//         if (alternativeQuestions.length > 0) {
//           console.log('Using alternative transformation, found:', alternativeQuestions.length);
//           setQuestions(alternativeQuestions);
//         }
//       }
//     } else {
//       throw new Error(questionsResult.error || 'Failed to load questions');
//     }

//     // Load management data from Google Sheets - WITH USER FILTERING
//     const mappingResult = await fetchManagementMapping(userEmail);
//     console.log('Mapping result:', {
//       success: mappingResult.success,
//       dataLength: mappingResult.data?.length,
//       userEmail: userEmail
//     });
    
//     if (mappingResult.success && mappingResult.data) {
//       const targetsData = transformMappingData(mappingResult.data);
//       console.log('Targets loaded:', {
//         POC: targetsData['POC']?.length,
//         Manager: targetsData['Manager']?.length,
//         AccountManager: targetsData['Account Manager']?.length
//       });
      
//       setTargets(targetsData);
//       setStep('select-target');
//     } else {
//       throw new Error(mappingResult.error || 'Failed to load management data');
//     }
//   } catch (err) {
//     console.error('Error loading data:', err);
//     setError(err instanceof Error ? err.message : 'Failed to load feedback data');
//     toast({
//       title: 'Data Load Error',
//       description: `Error: ${err instanceof Error ? err.message : 'Unknown error'}`,
//       variant: 'destructive',
//     });
//   }
// };

// // Add this as an alternative transformation function
// const transformQuestionsDataAlternative = (data: any[]): Question[] => {
//   if (!data || data.length === 0) return [];
  
//   const questionsList: Question[] = [];
//   let currentCategory = "General";
  
//   // Check what keys are available in the data
//   const firstItem = data[0] || {};
//   console.log('Available keys in data:', Object.keys(firstItem));
  
//   // Try to find the question column
//   let questionKey = '';
//   const possibleQuestionKeys = [
//     'Topic: Support & Approachability',
//     'question_text',
//     'Question',
//     'Questions',
//     'Item',
//     'Statement'
//   ];
  
//   for (const key of possibleQuestionKeys) {
//     if (firstItem[key]) {
//       questionKey = key;
//       console.log(`Using question key: ${questionKey}`);
//       break;
//     }
//   }
  
//   if (!questionKey && Object.keys(firstItem).length > 0) {
//     // Use the first key
//     questionKey = Object.keys(firstItem)[0];
//     console.log(`Defaulting to first key: ${questionKey}`);
//   }
  
//   data.forEach((item, index) => {
//     if (!item) return;
    
//     const questionText = item[questionKey];
//     if (!questionText || typeof questionText !== 'string') return;
    
//     const text = questionText.trim();
//     if (!text) return;
    
//     // Check if this is a topic header
//     if (text.startsWith('Topic:')) {
//       currentCategory = text.replace('Topic:', '').trim();
//       return;
//     }
    
//     // Skip rating options and headers
//     if (text === 'Strongly disagree' || 
//         text === 'disagree' || 
//         text === 'neutral' || 
//         text === 'agree' || 
//         text === 'Strongly agree' ||
//         text.includes('About You') ||
//         text.includes('Overall Experience')) {
//       return;
//     }
    
//     // Check if this is a question
//     if (text.length > 10) {
//       questionsList.push({
//         question_id: `q${questionsList.length + 1}`,
//         question_text: text,
//         question_type: 'rating',
//         options: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'],
//         category: currentCategory,
//         required: true
//       });
//     }
//   });
  
//   console.log(`Alternative transformation found ${questionsList.length} questions`);
//   return questionsList;
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

//   const handleSubmit = async () => {
//     if (!canSubmit() || !selectedTarget) {
//       toast({
//         title: 'Incomplete Form',
//         description: 'Please answer all questions before submitting.',
//         variant: 'destructive',
//       });
//       return;
//     }

//     setIsSubmitting(true);
//     try {
//       // Prepare feedback data
//       const feedbackData: Record<string, any> = {
//         'Timestamp': new Date().toISOString(),
//         'Encrypted Submitter ID': `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
//         'Role Reviewed': selectedRole,
//         'Process': selectedTarget?.process || '',
//         'Management Email ID': selectedTarget?.email || '',
//         'Submitter Email': currentUserEmail, // Add submitter email
//         'Additional Comments': comments
//       };

//       // Add all question answers
//       questions.forEach((q) => {
//         const columnName = q.question_text;
//         const answerValue = answers[q.question_id];
//         // Convert Strongly Disagree(1) to Strongly Agree(5) scale
//         const ratingValue = answerValue ? parseInt(answerValue) : '';
//         feedbackData[columnName] = ratingValue;
//       });

//       console.log('Submitting feedback:', feedbackData);

//       // Submit to Google Sheets
//       const result = await submitFeedback(feedbackData);
      
//       if (result.success) {
//         setStep('success');
//         toast({
//           title: 'Success!',
//           description: 'Your feedback has been submitted to Google Sheets.',
//         });
//       } else {
//         throw new Error(result.error || 'Submission failed');
//       }
//     } catch (err) {
//       console.error('Submission error:', err);
//       toast({
//         title: 'Submission Failed',
//         description: err instanceof Error ? err.message : 'Please try again later.',
//         variant: 'destructive',
//       });
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const resetAndGiveMore = () => {
//     setAnswers({});
//     setComments('');
//     setSelectedRole('');
//     setSelectedTarget(null);
//     setStep('select-target');
//   };

//   const reloadForDifferentUser = () => {
//     // Prompt for different user email (in real app, this would be a login/logout)
//     const newEmail = prompt('Enter different user email:', currentUserEmail);
//     if (newEmail && newEmail !== currentUserEmail) {
//       setCurrentUserEmail(newEmail);
//       loadFeedbackData(newEmail);
//     }
//   };

//   // Group questions by category
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
//     return (
//       <div className="min-h-screen bg-gradient-to-b from-muted to-background flex items-center justify-center p-4">
//         <div className="vox-card max-w-lg w-full p-12 text-center animate-fade-in">
//           <Loader2 className="w-12 h-12 text-secondary animate-spin mx-auto mb-6" />
//           <h2 className="text-2xl font-bold text-foreground mb-2">Loading Feedback Form</h2>
//           {/* <p className="text-muted-foreground">
//             Fetching questions from Google Sheets...
//             {currentUserEmail && <span className="block mt-2 text-sm">for {currentUserEmail}</span>}
//           </p> */}
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="min-h-screen bg-gradient-to-b from-muted to-background flex items-center justify-center p-4">
//         <div className="vox-card max-w-lg w-full p-12 text-center animate-fade-in">
//           <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-6" />
//           <h2 className="text-2xl font-bold text-foreground mb-2">Error Loading Data</h2>
//           <p className="text-muted-foreground mb-6">{error}</p>
//           <div className="flex gap-4 justify-center">
//             <Button onClick={() => loadFeedbackData(currentUserEmail)} variant="default">
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

//   if (step === 'success') {
//     return (
//       <div className="min-h-screen bg-gradient-to-b from-muted to-background flex items-center justify-center p-4">
//         <div className="vox-card max-w-lg w-full p-12 text-center animate-fade-in">
//           <div className="w-24 h-24 mx-auto mb-6 bg-success/10 rounded-full flex items-center justify-center">
//             <CheckCircle2 className="w-12 h-12 text-success" />
//           </div>
//           <h2 className="text-3xl font-bold text-foreground mb-4">Feedback Submitted!</h2>
//           <p className="text-muted-foreground mb-8">
//             Your feedback has been saved to Google Sheets. Thank you for your valuable input.
//           </p>
//           <div className="flex flex-col sm:flex-row gap-4 justify-center">
//             <Button onClick={resetAndGiveMore} className="vox-btn-primary">
//               Give More Feedback
//             </Button>
//             <Button onClick={() => navigate('/')} variant="outline">
//               Back to Home
//             </Button>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   if (step === 'select-target') {
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

//             <h2 className="text-3xl font-bold text-foreground mb-2">Leadership Feedback</h2>
            
//             {/* User Info Section */}
//             {/* <div className="mb-4 p-4 bg-muted/30 rounded-lg flex items-center justify-between">
//               <div>
//                 <p className="text-sm text-muted-foreground">Logged in as:</p>
//                 <div className="flex items-center gap-2">
//                   <User className="w-4 h-4" />
//                   <p className="font-semibold text-foreground">{currentUserEmail}</p>
//                 </div>
//               </div>
//               <Button
//                 onClick={reloadForDifferentUser}
//                 variant="outline"
//                 size="sm"
//                 className="text-xs"
//               >
//                 Change User
//               </Button>
//             </div> */}
            
//             <p className="text-muted-foreground mb-8">
//               Select a leader from your management to provide feedback
//             </p>

//             {Object.entries(targets).map(([role, roleTargets]) => (
//               roleTargets.length > 0 && (
//                 <div key={role} className="mb-8">
//                   <h3 className="text-lg font-semibold text-secondary mb-4 flex items-center gap-2">
//                     {role === 'POC' ? '👤 Point of Contact' : 
//                      role === 'Manager' ? '👔 Manager' : '📊 Account Manager'}
//                     <span className="text-sm text-muted-foreground font-normal">
//                       ({roleTargets.length})
//                     </span>
//                   </h3>
                  
//                   {roleTargets.map((target, index) => (
//                     <div
//                       key={`${target.email}-${index}`}
//                       className="vox-target-card"
//                     >
//                       <div>
//                         <h4 className="font-semibold text-foreground">
//                           {target.name}
//                         </h4>
//                         <p className="text-sm text-muted-foreground">
//                           {target.process} • {target.email}
//                         </p>
//                       </div>
                      
//                       <Button
//                         onClick={() => selectTarget(role, target)}
//                         className="vox-btn-primary"
//                       >
//                         Select
//                         <ChevronRight className="w-4 h-4 ml-1" />
//                       </Button>
//                     </div>
//                   ))}
//                 </div>
//               )
//             ))}

//             {Object.values(targets).flat().length === 0 && (
//               <div className="text-center py-12">
//                 <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
//                 <p className="text-muted-foreground">
//                   {currentUserEmail 
//                     ? `No management data found for ${currentUserEmail}`
//                     : 'Please log in to see your management chain'}
//                 </p>
//                 <p className="text-sm text-muted-foreground mt-2">
//                   Contact your administrator if you believe this is an error.
//                 </p>
//                 <div className="flex gap-4 justify-center mt-6">
//                   <Button 
//                     onClick={() => loadFeedbackData(currentUserEmail)} 
//                     variant="outline"
//                   >
//                     <RefreshCw className="w-4 h-4 mr-2" />
//                     Reload Data
//                   </Button>
//                   <Button 
//                     onClick={reloadForDifferentUser}
//                     variant="default"
//                   >
//                     Try Different User
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
//             <div className="flex justify-between items-start mb-4">
//               <div>
//                 <h2 className="text-3xl font-bold text-foreground mb-2">
//                   Feedback for {selectedTarget?.name}
//                 </h2>
//                 <p className="text-muted-foreground">
//                   {selectedRole} • {selectedTarget?.process}
//                 </p>
//                 <p className="text-sm text-muted-foreground mt-1">{selectedTarget?.email}</p>
//               </div>
//               {/* <div className="text-right">
//                 <p className="text-sm text-muted-foreground">Submitted by:</p>
//                 <p className="text-sm font-medium text-foreground">{currentUserEmail}</p>
//               </div> */}
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
//                       {question.options.map((option, optIdx) => (
//                         <button
//                           key={optIdx}
//                           type="button"
//                           onClick={() => handleAnswer(question.question_id, (optIdx + 1).toString())}
//                           className={`px-4 py-2 rounded border transition-all ${
//                             answers[question.question_id] === (optIdx + 1).toString()
//                               ? 'bg-primary text-primary-foreground border-primary shadow-sm'
//                               : 'bg-background border-input hover:bg-accent hover:border-accent-foreground'
//                           }`}
//                         >
//                           {option}
//                         </button>
//                       ))}
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             ))
//           ) : (
//             <div className="text-center py-8">
//               <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
//               <p className="text-muted-foreground">No feedback questions loaded.</p>
//               <Button onClick={() => loadFeedbackData(currentUserEmail)} variant="outline" className="mt-4">
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