import dotenv from 'dotenv';
dotenv.config();
function required(key) {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
}
function optional(key, defaultValue) {
    return process.env[key] || defaultValue;
}
export const config = {
    port: parseInt(optional('PORT', '4000'), 10),
    nodeEnv: optional('NODE_ENV', 'development'),
    isDev: optional('NODE_ENV', 'development') === 'development',
    mongodb: {
        uri: required('MONGODB_URI'),
    },
    google: {
        clientId: required('GOOGLE_CLIENT_ID'),
        clientSecret: required('GOOGLE_CLIENT_SECRET'),
        callbackUrl: optional('GOOGLE_CALLBACK_URL', 'http://localhost:4000/api/v1/auth/google/callback'),
        scopes: [
            'openid',
            'profile',
            'email',
            'https://www.googleapis.com/auth/gmail.send',
            'https://www.googleapis.com/auth/gmail.compose',
            'https://www.googleapis.com/auth/gmail.readonly',
        ],
    },
    jwt: {
        secret: required('JWT_SECRET'),
        refreshSecret: required('JWT_REFRESH_SECRET'),
        accessExpiry: '15m',
        refreshExpiry: '7d',
    },
    encryption: {
        key: required('ENCRYPTION_KEY'),
    },
    gemini: {
        apiKey: required('GEMINI_API_KEY'),
        model: optional('GEMINI_MODEL', 'gemini-2.5-pro'),
    },
    openai: {
        apiKey: optional('OPENAI_API_KEY', ''),
        model: optional('OPENAI_MODEL', 'gpt-4o'),
    },
    chroma: {
        url: optional('CHROMA_URL', 'http://localhost:8000'),
        collection: optional('CHROMA_COLLECTION', 'ai-outreach-docs'),
    },
    frontendUrl: optional('FRONTEND_URL', 'http://localhost:5173'),
};
//# sourceMappingURL=index.js.map