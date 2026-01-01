module.exports = {
    COLORS: {
        SUCCESS: '#00FF00',
        ERROR: '#FF0000',
        WARNING: '#FFA500',
        INFO: '#5865F2',
        MODERATION: '#FF6B6B',
        LEVELING: '#FFD700'
    },

    EMOJIS: {
        SUCCESS: '✅',
        ERROR: '❌',
        WARNING: '⚠️',
        INFO: 'ℹ️',
        LOADING: '⏳',
        MUSIC: '🎵',
        TICKET: '🎫',
        MODERATION: '🔨',
        LEVEL_UP: '🎉'
    },

    LIMITS: {
        MAX_TICKETS_PER_USER: 3,
        MAX_WARNINGS: 5,
        MAX_QUEUE_SIZE: 100,
        MAX_MESSAGE_CLEAR: 100,
        TRANSCRIPT_MESSAGE_LIMIT: 100
    },

    DURATIONS: {
        MUTE_MIN: 60000, // 1 minute
        MUTE_MAX: 2592000000, // 30 days
        TICKET_AUTO_CLOSE: 86400000, // 24 hours
        COOLDOWN_DEFAULT: 3000,
        XP_COOLDOWN: 60000
    },

    MESSAGES: {
        NO_PERMISSION: 'You do not have permission to use this command.',
        BOT_NO_PERMISSION: 'I do not have the required permissions to execute this command.',
        USER_NOT_FOUND: 'User not found.',
        INVALID_ARGUMENTS: 'Invalid arguments provided.',
        COOLDOWN: 'Please wait {time} before using this command again.',
        ERROR: 'An error occurred while executing this command.',
        SUCCESS: 'Command executed successfully.'
    },

    REGEX: {
        SNOWFLAKE: /^\d{17,19}$/,
        URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
        DURATION: /^(\d+)([smhd])$/,
        HEX_COLOR: /^#[0-9A-F]{6}$/i,
        MENTION_USER: /^<@!?(\d+)>$/,
        MENTION_ROLE: /^<@&(\d+)>$/,
        MENTION_CHANNEL: /^<#(\d+)>$/
    }
};