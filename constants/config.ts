export const API_CONFIG = {
  // Render was suspended and this project moved to Railway — same backend,
  // same Neon production database, new host.
  BASE_URL: __DEV__
    ? 'https://goye-platform-backend-production.up.railway.app/api' // Development
    : 'https://goye-platform-backend-production.up.railway.app/api' // Production
};