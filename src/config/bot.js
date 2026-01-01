module.exports = {
    // Bot Configuration
    token: process.env.TOKEN,
    clientId: process.env.CLIENT_ID,
    
    // Database
    mongoUri: process.env.MONGO_URI,
    
    // Bot Settings
    prefix: process.env.PREFIX || '!',
    embedColor: process.env.EMBED_COLOR || '#5865F2',
    
    // Cooldowns (in milliseconds)
    defaultCooldown: parseInt(process.env.COOLDOWN_TIME) || 3000,
    xpCooldown: parseInt(process.env.XP_COOLDOWN) || 60000,
    
    // Leveling
    xpMin: parseInt(process.env.XP_MIN) || 15,
    xpMax: parseInt(process.env.XP_MAX) || 25,
    
    // Music (Lavalink)
    lavalink: {
        host: process.env.LAVALINK_HOST || 'localhost',
        port: parseInt(process.env.LAVALINK_PORT) || 2333,
        password: process.env.LAVALINK_PASSWORD || 'youshallnotpass'
    },
    
    // Features
    features: {
        leveling: true,
        moderation: true,
        tickets: true,
        music: true,
        games: true,
        welcome: true,
        logging: true
    },
    
    // Owners (can bypass cooldowns and permissions)
    owners: []
};