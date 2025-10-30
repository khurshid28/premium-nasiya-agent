// Smart API wrapper that switches between real API and mock API based on environment
import realApi from './api';
import mockApi from './mockApi';

// Check if we should use mock API
const USE_MOCK_API = process.env.REACT_APP_USE_MOCK_API === 'true';

console.log(`🔧 API Mode: ${USE_MOCK_API ? 'Mock API (Development)' : 'Real API (Production)'}`);

// Export the appropriate API based on environment
const api = USE_MOCK_API ? mockApi : realApi;

export default api;