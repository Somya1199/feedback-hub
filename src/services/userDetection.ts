// Create a new service to detect user email
// services/userDetection.ts

export const detectUserEmail = async (): Promise<string> => {
  // Method 1: Check if user is logged into Google/Gmail
  try {
    // This works if user is logged into Google in the same browser
    const response = await fetch('https://www.googleapis.com/oauth2/v1/userinfo?alt=json', {
      credentials: 'include' // Include cookies
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.email) {
        console.log('Detected Google email:', data.email);
        localStorage.setItem('detectedEmail', data.email);
        return data.email;
      }
    }
  } catch (error) {
    console.log('Google detection failed, trying other methods...');
  }
  
  // Method 2: Check Microsoft/Office 365 login
  try {
    const response = await fetch('https://graph.microsoft.com/v1.0/me', {
      credentials: 'include'
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.mail || data.userPrincipalName) {
        const email = data.mail || data.userPrincipalName;
        console.log('Detected Microsoft email:', email);
        localStorage.setItem('detectedEmail', email);
        return email;
      }
    }
  } catch (error) {
    console.log('Microsoft detection failed...');
  }
  
  // Method 3: Get from SSO headers (if behind corporate proxy)
  // These headers are set by many corporate SSO systems
  const ssoHeaders = [
    'X-Forwarded-User',
    'X-REMOTE-USER',
    'REMOTE_USER',
    'X-Auth-Email',
    'X-User-Email'
  ];
  
  // Note: Headers are server-side only, need backend endpoint
  const backendCheck = await fetch('http://localhost:5000/api/detect-email');
  if (backendCheck.ok) {
    const data = await backendCheck.json();
    if (data.email) {
      console.log('Detected email from backend:', data.email);
      localStorage.setItem('detectedEmail', data.email);
      return data.email;
    }
  }
  
  // Method 4: Get from URL token (if accessed via email link)
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  const encryptedEmail = urlParams.get('e');
  
  if (token || encryptedEmail) {
    // Decode from token (you'd need backend validation)
    const decoded = await decodeEmailToken(token || encryptedEmail);
    if (decoded) {
      console.log('Detected email from URL token:', decoded);
      localStorage.setItem('detectedEmail', decoded);
      return decoded;
    }
  }
  
  // Method 5: Get from localStorage (if previously detected)
  const storedEmail = localStorage.getItem('detectedEmail');
  if (storedEmail) {
    console.log('Using stored email:', storedEmail);
    return storedEmail;
  }
  
  // Fallback: Return empty or test email (for development)
  console.warn('Could not detect user email, using fallback');
  return 'unknown@company.com'; // Or empty string
};

// Backend endpoint to get headers
export const decodeEmailToken = async (token: string): Promise<string | null> => {
  try {
    const response = await fetch(`http://localhost:5000/api/decode-token?token=${token}`);
    if (response.ok) {
      const data = await response.json();
      return data.email;
    }
  } catch (error) {
    console.error('Token decode failed:', error);
  }
  return null;
};