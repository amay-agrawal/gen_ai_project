import mongoose, { Document } from 'mongoose';
import type { IOAuthToken } from '@ai-outreach/shared';
export interface OAuthTokenDocument extends Omit<IOAuthToken, '_id'>, Document {
}
export declare const OAuthToken: mongoose.Model<OAuthTokenDocument, {}, {}, {}, mongoose.Document<unknown, {}, OAuthTokenDocument, {}, {}> & OAuthTokenDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=OAuthToken.d.ts.map