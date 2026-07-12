import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import { config } from './config/index.js';
import { connectDatabase } from './config/database.js';
import { errorHandler } from './middleware/errorHandler.middleware.js';
import { rateLimit } from './middleware/rateLimit.middleware.js';
import { API_BASE } from '@ai-outreach/shared';
// Routes
import authRoutes from './routes/auth.routes.js';
import voiceRoutes from './routes/voice.routes.js';
import emailRoutes from './routes/email.routes.js';
import ragRoutes from './routes/rag.routes.js';
import gmailRoutes from './routes/gmail.routes.js';
import contactsRoutes from './routes/contacts.routes.js';
import followupRoutes from './routes/followup.routes.js';
import replyRoutes from './routes/reply.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import extensionRoutes from './routes/extension.routes.js';
// LLM Initialization
import { ResilientLLMClient, GeminiClient, OpenAIClient } from './llm/index.js';
let llmClient;
export function getLLMClient() {
    if (!llmClient) {
        const providers = [];
        if (config.openai.apiKey) {
            providers.push(new OpenAIClient());
        }
        if (config.gemini.apiKey) {
            providers.push(new GeminiClient());
        }
        if (providers.length === 0) {
            throw new Error('No LLM providers configured. Set GEMINI_API_KEY or OPENAI_API_KEY.');
        }
        llmClient = new ResilientLLMClient(providers);
    }
    return llmClient;
}
const app = express();
// Global Middleware
app.use(cors({
    origin: [config.frontendUrl, 'chrome-extension://*'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
// Apply rate limiting to all /api routes
app.use(API_BASE, rateLimit);
// Health Check
app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', environment: config.nodeEnv });
});
// Mount Routes
app.use(`${API_BASE}/auth`, authRoutes);
app.use(`${API_BASE}/voice`, voiceRoutes);
app.use(`${API_BASE}/email`, emailRoutes);
app.use(`${API_BASE}/documents`, ragRoutes);
app.use(`${API_BASE}/rag`, ragRoutes);
app.use(`${API_BASE}/gmail`, gmailRoutes);
app.use(`${API_BASE}/contacts`, contactsRoutes);
app.use(`${API_BASE}/followups`, followupRoutes);
app.use(`${API_BASE}/replies`, replyRoutes);
app.use(`${API_BASE}/dashboard`, dashboardRoutes);
app.use(`${API_BASE}/extension`, extensionRoutes);
// Global Error Handler
app.use(errorHandler);
// Start Server
async function startServer() {
    try {
        await connectDatabase();
        // Initialize LLM to catch configuration errors early
        getLLMClient();
        app.listen(config.port, () => {
            console.log(`[Server] API Gateway running on http://localhost:${config.port}`);
            console.log(`[Server] Environment: ${config.nodeEnv}`);
        });
    }
    catch (error) {
        console.error('[Server] Failed to start:', error);
        process.exit(1);
    }
}
// Only start the server if this file is run directly (not imported for tests)
const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain || process.env.NODE_ENV !== 'test') {
    startServer();
}
export default app;
//# sourceMappingURL=index.js.map