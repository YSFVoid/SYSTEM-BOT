const { EmbedBuilder } = require('discord.js');

const COLORS = {
    SUCCESS: '#00FF00',
    ERROR: '#FF0000',
    WARNING: '#FFA500',
    INFO: '#5865F2',
    MODERATION: '#FF6B6B'
};

const createEmbed = (type = 'INFO', title, description) => {
    return new EmbedBuilder()
        .setColor(COLORS[type] || COLORS.INFO)
        .setTitle(title)
        .setDescription(description)
        .setTimestamp();
};

const createSuccessEmbed = (title, description) => {
    return createEmbed('SUCCESS', `✅ ${title}`, description);
};

const createErrorEmbed = (title, description) => {
    return createEmbed('ERROR', `❌ ${title}`, description);
};

const createWarningEmbed = (title, description) => {
    return createEmbed('WARNING', `⚠️ ${title}`, description);
};

const createInfoEmbed = (title, description) => {
    return createEmbed('INFO', `ℹ️ ${title}`, description);
};

const createModerationEmbed = (action, moderator, target, reason) => {
    return new EmbedBuilder()
        .setColor(COLORS.MODERATION)
        .setTitle(`🔨 ${action}`)
        .addFields(
            { name: 'Target', value: `${target}`, inline: true },
            { name: 'Moderator', value: `${moderator}`, inline: true },
            { name: 'Reason', value: reason || 'No reason provided' }
        )
        .setTimestamp();
};

module.exports = {
    COLORS,
    createEmbed,
    createSuccessEmbed,
    createErrorEmbed,
    createWarningEmbed,
    createInfoEmbed,
    createModerationEmbed
};