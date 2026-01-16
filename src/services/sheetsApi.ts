// // src/services/sheetsApi.ts
// const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// export interface FeedbackRow {
//   id?: string;
//   timestamp?: string;
//   name?: string;
//   email?: string;
//   rating?: number;
//   feedback?: string;
//   category?: string;
//   [key: string]: any; // Allow dynamic columns from Google Sheets
// }

// export interface ApiResponse {
//   success: boolean;
//   data: FeedbackRow[];
//   total?: number;
//   headers?: string[];
//   error?: string;
// }

// // Fetch data from Google Sheets backend
// export async function fetchSheetData(): Promise<ApiResponse> {
//   try {
//     const response = await fetch(`${API_BASE_URL}/sheet-data`);
    
//     if (!response.ok) {
//       throw new Error(`HTTP error! status: ${response.status}`);
//     }
    
//     return await response.json();
//   } catch (error) {
//     console.error('Failed to fetch sheet data:', error);
//     return {
//       success: false,
//       data: [],
//       error: error instanceof Error ? error.message : 'Network error'
//     };
//   }
// }

// // Check if backend is running
// export async function checkBackendHealth(): Promise<boolean> {
//   try {
//     const response = await fetch(`${API_BASE_URL}/health`);
//     const data = await response.json();
//     return data.status === 'healthy';
//   } catch {
//     return false;
//   }
// }





// src/services/sheetsApi.ts
// const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Types for your different sheets
export interface ManagementMapping {
  manager_id?: string;
  name?: string;
  email?: string;
  department?: string;
  role?: string;
  [key: string]: any;
}

export interface FeedbackResponse {
  timestamp?: string;
  feedback_id?: string;
  user_email?: string;
  manager_id?: string;
  rating?: number;
  comments?: string;
  question_id?: string;
  [key: string]: any;
}

export interface SurveyQuestion {
  question_id?: string;
  question_text?: string;
  question_type?: string; // 'rating', 'text', 'multiple_choice'
  options?: string;
  required?: boolean;
  category?: string;
  [key: string]: any;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T[];
  total?: number;
  type?: string;
  error?: string;
}

// // Fetch management mapping data
// export async function fetchManagementMapping(): Promise<ApiResponse<ManagementMapping>> {
//   try {
//     const response = await fetch(`${API_BASE_URL}/mapping-data`);
//     return await response.json();
//   } catch (error) {
//     console.error('Failed to fetch mapping data:', error);
//     return {
//       success: false,
//       data: [],
//       error: error instanceof Error ? error.message : 'Network error'
//     };
//   }
// }

// Fetch all feedback responses
export async function fetchFeedbackResponses(): Promise<ApiResponse<FeedbackResponse>> {
  try {
    const response = await fetch(`${API_BASE_URL}/responses`);
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch responses:', error);
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : 'Network error'
    };
  }
}

// Fetch survey questions
// export async function fetchSurveyQuestions(): Promise<ApiResponse<SurveyQuestion>> {
//   try {
//     const response = await fetch(`${API_BASE_URL}/questions`);
//     return await response.json();
//   } catch (error) {
//     console.error('Failed to fetch questions:', error);
//     return {
//       success: false,
//       data: [],
//       error: error instanceof Error ? error.message : 'Network error'
//     };
//   }
// }

// Submit new feedback
// export async function submitFeedback(feedbackData: Record<string, any>): Promise<{success: boolean; message?: string; error?: string}> {
//   try {
//     const response = await fetch(`${API_BASE_URL}/submit-feedback`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify(feedbackData)
//     });
    
//     return await response.json();
//   } catch (error) {
//     console.error('Failed to submit feedback:', error);
//     return {
//       success: false,
//       error: error instanceof Error ? error.message : 'Network error'
//     };
//   }
// }

// export async function submitFeedback(feedbackData: Record<string, any>) {
//   try {
//     const response = await fetch(`${API_BASE_URL}/submit-feedback`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify(feedbackData)
//     });
    
//     return await response.json();
//   } catch (error) {
//     console.error('Failed to submit feedback:', error);
//     return {
//       success: false,
//       error: error instanceof Error ? error.message : 'Network error'
//     };
//   }
// }

// Check backend health
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    const data = await response.json();
    return data.status === 'healthy';
  } catch {
    return false;
  }
}

// services/sheetsApi.ts
const API_BASE_URL = 'http://localhost:5000/api';

export const fetchSurveyQuestions = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/questions`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching questions:', error);
    return { success: false, error: 'Network error' };
  }
};

// export const fetchManagementMapping = async () => {
//   try {
//     const response = await fetch(`${API_BASE_URL}/mapping-data`);
//     return await response.json();
//   } catch (error) {
//     console.error('Error fetching mapping:', error);
//     return { success: false, error: 'Network error' };
//   }
// };

// Update this function to accept userEmail parameter
export const fetchManagementMapping = async (userEmail?: string) => {
  try {
    let url = `${API_BASE_URL}/mapping-data`;
    if (userEmail) {
      url += `?user_email=${encodeURIComponent(userEmail)}`;
    }
    
    console.log('Fetching mapping for user:', userEmail || 'All users');
    const response = await fetch(url);
    const data = await response.json();
    console.log('Mapping API response:', data);
    return data;
  } catch (error) {
    console.error('Error fetching mapping:', error);
    return { success: false, error: 'Network error' };
  }
};

// OR use the new endpoint
export const fetchMyManagement = async (userEmail: string) => {
  try {
    const url = `${API_BASE_URL}/my-management?user_email=${encodeURIComponent(userEmail)}`;
    console.log('Fetching my management for:', userEmail);
    const response = await fetch(url);
    const data = await response.json();
    console.log('My Management API response:', data);
    return data;
  } catch (error) {
    console.error('Error fetching my management:', error);
    return { success: false, error: 'Network error' };
  }
};

// export const submitFeedback = async (data: any) => {
//   try {
//     const response = await fetch(`${API_BASE_URL}/submit-feedback`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify(data),
//     });
//     return await response.json();
//   } catch (error) {
//     console.error('Error submitting feedback:', error);
//     return { success: false, error: 'Network error' };
//   }
// };






// Update your submitFeedback function in @/services/sheetsApi.ts
export const submitFeedback = async (data: Record<string, any>) => {
  try {
    console.log('Submitting to backend:', data);
    
    const response = await fetch('http://localhost:5000/api/submit-feedback', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    console.log('Backend response:', result);
    
    return result;
  } catch (error) {
    console.error('Submission error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Network error' 
    };
  }
};