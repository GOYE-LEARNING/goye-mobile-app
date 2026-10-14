export const API_CONFIG = {
  // Render was suspended and this project moved to Railway — same backend,
  // same Neon production database, new host.
  BASE_URL: __DEV__
    ? 'https://goye-platform-backend-production.up.railway.app/api' // Development
    : 'https://goye-platform-backend-production.up.railway.app/api' // Production
};

// Origin without the /api suffix: where the websocket server lives.
export const SERVER_ORIGIN = API_CONFIG.BASE_URL.replace(/\/api\/?$/, '');
