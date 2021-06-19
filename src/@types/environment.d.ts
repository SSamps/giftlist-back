declare global {
    namespace NodeJS {
        interface ProcessEnv {
            MONGO_URI: string;
            PORT?: string;
            JWT_SECRET: string;
            SENDGRID_API_KEY: string;
        }
    }
}

export {};
