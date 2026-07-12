import mongoose, { Document } from 'mongoose';
import type { ICampaign } from '@ai-outreach/shared';
export interface CampaignDocument extends Omit<ICampaign, '_id'>, Document {
}
export declare const Campaign: mongoose.Model<CampaignDocument, {}, {}, {}, mongoose.Document<unknown, {}, CampaignDocument, {}, {}> & CampaignDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Campaign.d.ts.map