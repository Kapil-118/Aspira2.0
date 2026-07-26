/**
 * Helper utility to resolve backend static media URLs (e.g., uploaded avatars, PDFs, images).
 * Adapts to VITE_SERVER_URL or VITE_API_URL environment variables in production,
 * falling back to relative pathing or local server defaults.
 */
export const getMediaUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('blob:')) {
    return path;
  }
  
  let serverBaseUrl = import.meta.env.VITE_SERVER_URL;
  
  if (!serverBaseUrl && import.meta.env.VITE_API_URL) {
    serverBaseUrl = import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '');
  }
  
  if (!serverBaseUrl) {
    serverBaseUrl = 'http://localhost:5000';
  }

  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${serverBaseUrl}${cleanPath}`;
};
