import mongoose, { Schema } from 'mongoose';
const EmailDraftSchema = new Schema({
    campaignId: {
        type: Schema.Types.ObjectId,
        ref: 'Campaign',
        required: false,
        index: true,
    },
    contactId: {
        type: Schema.Types.ObjectId,
        ref: 'Contact',
        required: true,
    },
    orgId: {
        type: Schema.Types.ObjectId,
        required: true,
    },
    type: {
        type: String,
        enum: ['outreach', 'follow_up', 'reply'],
        default: 'outreach',
    },
    subject: {
        type: String,
        required: true,
    },
    body: {
        type: String,
        required: true,
    },
    signature: {
        type: String,
        default: '',
    },
    status: {
        type: String,
        enum: ['pending_review', 'approved', 'sending', 'sent', 'failed', 'rejected'],
        default: 'pending_review',
    },
    generationMeta: {
        model: { type: String, default: '' },
        promptVersion: { type: String, default: '' },
        retrievedChunkIds: [{ type: Schema.Types.ObjectId }],
        regenerateCount: { type: Number, default: 0 },
    },
    editHistory: [
        {
            editedAt: { type: Date, default: Date.now },
            prevBody: { type: String },
        },
    ],
}, {
    timestamps: true,
});
EmailDraftSchema.index({ orgId: 1, status: 1 });
export const EmailDraft = mongoose.model('EmailDraft', EmailDraftSchema);
//# sourceMappingURL=EmailDraft.js.map