import mongoose, { Schema } from 'mongoose';
const FollowUpSchema = new Schema({
    outreachRecordId: {
        type: Schema.Types.ObjectId,
        ref: 'OutreachRecord',
        required: true,
        index: true,
    },
    draftId: {
        type: Schema.Types.ObjectId,
        ref: 'EmailDraft',
        required: true,
    },
    sequenceNumber: {
        type: Number,
        required: true,
        min: 1,
    },
    triggeredAt: {
        type: Date,
        default: Date.now,
    },
    status: {
        type: String,
        enum: ['pending_review', 'sent'],
        default: 'pending_review',
    },
}, {
    timestamps: false,
});
FollowUpSchema.index({ outreachRecordId: 1 });
export const FollowUp = mongoose.model('FollowUp', FollowUpSchema);
//# sourceMappingURL=FollowUp.js.map