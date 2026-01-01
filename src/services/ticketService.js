const { EmbedBuilder } = require('discord.js');
const Guild = require('../database/models/Guild');
const logger = require('../utils/logger');

class LogService {
    async logModeration(guildId, data) {
        try {
            const guildConfig = await Guild.getGuild(guildId);
            
            if (!guildConfig.moderation.modLogChannel) {
                return;
            }

            const guild = await require('../index').guilds.fetch(guildId);
            const logChannel = guild.channels.cache.get(guildConfig.moderation.modLogChannel);

            if (!logChannel) return;

            const { action, moderator, target, reason, duration, warningId } = data;

            const embed = new EmbedBuilder()
                .setColor('#FF6B6B')
                .setTitle(`🔨 ${action}`)
                .addFields(
                    { name: 'Target', value: `${target.tag} (${target.id})`, inline: true },
                    { name: 'Moderator', value: `${moderator.tag} (${moderator.id})`, inline: true },
                    { name: 'Reason', value: reason || 'No reason provided', inline: false }
                )
                .setTimestamp();

            if (duration) {
                embed.addFields({ name: 'Duration', value: duration, inline: true });
            }

            if (warningId) {
                embed.addFields({ name: 'Warning ID', value: warningId, inline: true });
            }

            await logChannel.send({ embeds: [embed] });
        } catch (error) {
            logger.error('Error logging moderation action:', error);
        }
    }

    async logAction(guildId, embedData) {
        try {
            const guildConfig = await Guild.getGuild(guildId);
            
            if (!guildConfig.logging.enabled || !guildConfig.logging.channelId) {
                return;
            }

            const guild = await require('../index').guilds.fetch(guildId);
            const logChannel = guild.channels.cache.get(guildConfig.logging.channelId);

            if (!logChannel) return;

            const embed = new EmbedBuilder()
                .setColor(embedData.color || '#5865F2')
                .setTitle(embedData.title)
                .setDescription(embedData.description || null)
                .setTimestamp();

            if (embedData.fields) {
                embed.addFields(embedData.fields);
            }

            if (embedData.thumbnail) {
                embed.setThumbnail(embedData.thumbnail);
            }

            await logChannel.send({ embeds: [embed] });
        } catch (error) {
            logger.error('Error logging action:', error);
        }
    }
}

module.exports = new LogService();