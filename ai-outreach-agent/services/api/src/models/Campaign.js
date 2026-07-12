import mongoose, { Schema } from 'mongoose';
const CampaignSchema = new Schema({
    orgId: {
        type: Schema.Types.ObjectId,
        required: true,
        index: true,
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    sourceIntent: {
        type: Schema.Types.Mixed,
        required: true,
    },
    status: {
        type: String,
        enum: ['draft', 'in_review', 'sent', 'partially_sent'],
        default: 'draft',
    },
    recipientCount: {
        type: Number,
        default: 0,
    },
}, {
    timestamps: { createdAt: true, updatedAt: false },
});
CampaignSchema.index({ orgId: 1, createdAt: -1 });
export const Campaign = mongoose.model('Campaign', CampaignSchema);
//# sourceMappingURL=Campaign.js.map