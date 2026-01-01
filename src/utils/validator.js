const isValidSnowflake = (id) => {
    return /^\d{17,19}$/.test(id);
};

const isValidURL = (url) => {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
};

const isValidHexColor = (color) => {
    return /^#[0-9A-F]{6}$/i.test(color);
};

const sanitizeInput = (input, maxLength = 1000) => {
    if (typeof input !== 'string') return '';
    
    return input
        .trim()
        .substring(0, maxLength)
        .replace(/[<>@]/g, '');
};

const validateDuration = (duration) => {
    const regex = /^(\d+)([smhd])$/;
    const match = duration.match(regex);
    
    if (!match) return null;
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    const multipliers = {
        s: 1000,
        m: 60000,
        h: 3600000,
        d: 86400000
    };
    
    return value * multipliers[unit];
};

const parseMention = (mention) => {
    const userMention = mention.match(/^<@!?(\d+)>$/);
    if (userMention) return userMention[1];
    
    const roleMention = mention.match(/^<@&(\d+)>$/);
    if (roleMention) return roleMention[1];
    
    const channelMention = mention.match(/^<#(\d+)>$/);
    if (channelMention) return channelMention[1];
    
    return null;
};

module.exports = {
    isValidSnowflake,
    isValidURL,
    isValidHexColor,
    sanitizeInput,
    validateDuration,
    parseMention
};