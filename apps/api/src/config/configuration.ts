export default () => ({
    // Server
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',

    // Database
    database: {
        url: process.env.DATABASE_URL,
    },

    // Redis
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
    },

    // JWT
    jwt: {
        accessSecret: process.env.JWT_ACCESS_SECRET || 'access-secret',
        refreshSecret: process.env.JWT_REFRESH_SECRET || 'refresh-secret',
        accessExpiration: process.env.JWT_ACCESS_EXPIRATION || '15m',
        refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
    },

    // CORS
    cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    },

    // Commission rate (percentage taken from each rental)
    commission: {
        rate: parseFloat(process.env.COMMISSION_RATE || '0.15'), // 15% default
    },
});
