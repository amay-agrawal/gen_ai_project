export declare const config: {
    readonly port: number;
    readonly nodeEnv: string;
    readonly isDev: boolean;
    readonly mongodb: {
        readonly uri: string;
    };
    readonly google: {
        readonly clientId: string;
        readonly clientSecret: string;
        readonly callbackUrl: string;
        readonly scopes: readonly ["openid", "profile", "email", "https://www.googleapis.com/auth/gmail.send", "https://www.googleapis.com/auth/gmail.compose", "https://www.googleapis.com/auth/gmail.readonly"];
    };
    readonly jwt: {
        readonly secret: string;
        readonly refreshSecret: string;
        readonly accessExpiry: "15m";
        readonly refreshExpiry: "7d";
    };
    readonly encryption: {
        readonly key: string;
    };
    readonly gemini: {
        readonly apiKey: string;
        readonly model: string;
    };
    readonly openai: {
        readonly apiKey: string;
        readonly model: string;
    };
    readonly chroma: {
        readonly url: string;
        readonly collection: string;
    };
    readonly frontendUrl: string;
};
//# sourceMappingURL=index.d.ts.map