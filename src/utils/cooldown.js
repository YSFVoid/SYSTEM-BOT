const cooldowns = new Map();

const setCooldown = (userId, commandName, duration) => {
    const key = `${userId}-${commandName}`;
    const expiresAt = Date.now() + duration;
    cooldowns.set(key, expiresAt);

    setTimeout(() => cooldowns.delete(key), duration);
};

const getCooldown = (userId, commandName) => {
    const key = `${userId}-${commandName}`;
    const expiresAt = cooldowns.get(key);

    if (!expiresAt) return null;
    
    const remaining = expiresAt - Date.now();
    return remaining > 0 ? remaining : null;
};

const hasCooldown = (userId, commandName) => {
    return getCooldown(userId, commandName) !== null;
};

const formatCooldown = (milliseconds) => {
    const seconds = Math.ceil(milliseconds / 1000);
    
    if (seconds < 60) {
        return `${seconds} second${seconds !== 1 ? 's' : ''}`;
    }
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (remainingSeconds === 0) {
        return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
    
    return `${minutes} minute${minutes !== 1 ? 's' : ''} and ${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''}`;
};

module.exports = {
    setCooldown,
    getCooldown,
    hasCooldown,
    formatCooldown
};