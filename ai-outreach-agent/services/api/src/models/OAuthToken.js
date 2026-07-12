import mongoose, { Schema } from 'mongoose';
const OAuthTokenSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
        index: true,
    },
    provider: {
        type: String,
        enum: ['google'],
        default: 'google',
    },
    accessTokenEnc: {
        type: String,
        required: true,
    },
    refreshTokenEnc: {
        type: String,
        required: true,
    },
    scope: {
        type: [String],
        default: [],
    },
    expiresAt: {
        type: Date,
        required: true,
    },
}, {
    timestamps: { createdAt: true, updatedAt: false },
});
OAuthTokenSchema.index({ userId: 1 }, { unique: true });
export const OAuthToken = mongoose.model('OAuthToken', OAuthTokenSchema);
//# sourceMappingURL=OAuthToken.js.map