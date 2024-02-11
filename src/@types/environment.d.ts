declare global {
    namespace NodeJS {
        interface ProcessEnv {
            MONGO_URI: string;
            PORT?: string;
            JWT_SECRET: string;
            REDIS_HOST: string;
            REDIS_PORT: string;
            REDIS_PASSWORD: string;
            POSTMARK_API_KEY: string;
        }
    }
}

export {};
