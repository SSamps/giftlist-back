declare global {
    namespace NodeJS {
        interface ProcessEnv {
            MONGO_URI: string;
            PORT?: string;
            JWT_SECRET: string;
            SENDGRID_API_KEY: string;
            REDIS_HOST: string;
            REDIS_PORT: string;
            REDIS_PASSWORD: string;
        }
    }
}

export {};
