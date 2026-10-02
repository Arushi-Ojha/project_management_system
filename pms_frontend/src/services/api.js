const BASE_URL = import.meta.env.PROD 
  ? 'https://proman-aura-backend-362935833196.asia-south1.run.app/api/v1' 
  : 'http://localhost:8000/api/v1';

export async function apiCall(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const isFormData = options.body instanceof FormData;
  
  const headers = {
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...(!isFormData && { 'Content-Type': 'application/json' }),
    ...options.headers,
  };

  let body = options.body;
  if (body && !isFormData && typeof body === 'object') {
    body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
    body,
  });

  if (response.status === 204) {
    return null;
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const detail = errorData.detail 
      || errorData.message 
      || (errorData.details && errorData.details.map(d => d.instruction).join('; '))
      || `API request failed (${response.status})`;
    throw new Error(detail);
  }

  // Handle blob/file responses (e.g. CSV exports)
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('text/csv')) {
    return response.blob();
  }

  return response.json();
}

export { BASE_URL };
