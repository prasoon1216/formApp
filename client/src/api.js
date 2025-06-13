import axios from 'axios';

// Create a new Axios instance that reads the API base URL from an environment variable.
// Vite uses `import.meta.env.VITE_` prefix for environment variables.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

export default api;
