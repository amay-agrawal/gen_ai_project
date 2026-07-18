import mongoose from 'mongoose';
import { config } from './index.js';
export async function connectDatabase() {
    try {
        mongoose.set('strictQuery', true);
        mongoose.connection.on('connected', () => {
            console.log('[MongoDB] Connected successfully');
        });
        mongoose.connection.on('error', (err) => {
            console.error('[MongoDB] Connection error:', err.message);
        });
        mongoose.connection.on('disconnected', () => {
            console.warn('[MongoDB] Disconnected');
        });
        await mongoose.connect(config.mongodb.uri, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
    }
    catch (error) {
        console.error('[MongoDB] Failed to connect:', error);
        process.exit(1);
    }
}
export async function disconnectDatabase() {
    await mongoose.disconnect();
    console.log('[MongoDB] Disconnected gracefully');
}
//# sourceMappingURL=database.js.map