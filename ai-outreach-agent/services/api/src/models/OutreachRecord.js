import mongoose, { Schema } from 'mongoose';
const OutreachRecordSchema = new Schema({
    orgId: {
        type: Schema.Types.ObjectId,
        required: true,
    },
    draftId: {
        type: Schema.Types.ObjectId,
        ref: 'EmailDraft',
        required: true,
    },
    contactId: {
        type: Schema.Types.ObjectId,
        ref: 'Contact',
        required: true,
    },
    company: {
        type: String,
        required: true,
    },
    gmailThreadId: {
        type: String,
        default: '',
    },
    gmailMessageId: {
        type: String,
        default: '',
    },
    sentAt: {
        type: Date,
        default: Date.now,
    },
    replyReceived: {
        type: Boolean,
        default: false,
    },
    replyReceivedAt: {
        type: Date,
        default: null,
    },
    status: {
        type: String,
        enum: ['sent', 'delivered', 'bounced', 'replied'],
        default: 'sent',
    },
    followUpCount: {
        type: Number,
        default: 0,
    },
    lastFollowUpAt: {
        type: Date,
        default: null,
    },
}, {
    timestamps: false,
});
OutreachRecordSchema.index({ orgId: 1, replyReceived: 1, sentAt: 1 });
OutreachRecordSchema.index({ gmailThreadId: 1 });
export const OutreachRecord = mongoose.model('OutreachRecord', OutreachRecordSchema);
//# sourceMappingURL=OutreachRecord.js.map