// services/mappingApi.ts
export interface EmployeeMapping {
  Ldap: string;
  Email: string;
  Process: string;
  POC: string;
  Manager: string;
  AccountManager: string;
}

export const fetchEmployeeMappings = async (): Promise<{
  success: boolean;
  data?: EmployeeMapping[];
  error?: string;
}> => {
  try {
    // Adjust the URL to your actual mapping sheet API endpoint
    const response = await fetch('/api/sheets/mappings');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching employee mappings:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch employee mappings' 
    };
  }
};