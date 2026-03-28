/**
 * Application configuration
 * Centralizes environment-dependent settings
 */

const config = {
  apiUrl: process.env.GATSBY_API_URL || 'http://localhost:3001/api',
}

export default config
