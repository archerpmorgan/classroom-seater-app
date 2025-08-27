// Environment configuration for the frontend
export const config = {
  // API base URL - defaults to current origin in development, can be overridden for production
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '',
  
  // Environment mode
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  
  // Build time
  buildTime: import.meta.env.VITE_BUILD_TIME || __BUILD_TIME__ || new Date().toISOString(),
};

// Helper function to get full API URL
export function getApiUrl(path: string): string {
  // If apiBaseUrl is set, use it as the base
  if (config.apiBaseUrl) {
    // Ensure the path starts with / and remove any double slashes
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${config.apiBaseUrl}${cleanPath}`;
  }
  
  // Otherwise, use relative URLs (same origin)
  return path;
}
