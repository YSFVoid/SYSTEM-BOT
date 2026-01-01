const User = require('../database/models/User');
const Guild = require('../database/models/Guild');
const { EmbedBuilder } = require('discord.js');
const logger = require('../utils/logger');

class LevelingService {
    constructor(client) {
        this.client = client;
        this.xpCooldowns = new Map();
    }

    async handleMessage(message) {
        if (message.author.bot || !message.guild) return;

        const guildConfig = await Guild.getGuild(message.guild.id);
        if (!guildConfig.leveling.enabled) return;

        // Check XP cooldown (anti-spam)
        const cooldownKey = `${message.author.id}-${message.guild.id}`;
        const lastXP = this.xpCooldowns.get(cooldownKey);
        const cooldownTime = parseInt(process.env.XP_COOLDOWN) || 60000;

        if (lastXP && Date.now() - lastXP < cooldownTime) {
            return;
        }

        this.xpCooldowns.set(cooldownKey, Date.now());

        try {
            const userDoc = await User.getUser(message.author.id, message.guild.id);
            
            // Generate random XP
            const minXP = parseInt(process.env.XP_MIN) || 15;
            const maxXP = parseInt(process.env.XP_MAX) || 25;
            const xpGained = Math.floor(Math.random() * (maxXP - minXP + 1)) + minXP;

            // Add XP and check for level up
            const leveledUp = userDoc.addXP(xpGained);
            userDoc.totalMessages += 1;
            userDoc.lastXP = new Date();
            await userDoc.save();

            if (leveledUp) {
                await this.handleLevelUp(message, userDoc, guildConfig);
            }
        } catch (error) {
            logger.error('Error handling XP:', error);
        }
    }

    async handleLevelUp(message, userDoc, guildConfig) {
        const levelUpMessage = guildConfig.leveling.levelUpMessage
            .replace('{user}', message.author.toString())
            .replace('{username}', message.author.username)
            .replace('{level}', userDoc.level);

        const embed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle('🎉 Level Up!')
            .setDescription(levelUpMessage)
            .addFields(
                { name: 'New Level', value: userDoc.level.toString(), inline: true },
                { name: 'Total XP', value: userDoc.xp.toString(), inline: true },
                { name: 'Next Level', value: `${userDoc.getRequiredXP()} XP`, inline: true }
            )
            .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
            .setTimestamp();

        // Send level up notification
        let channelToSend = message.channel;
        if (guildConfig.leveling.levelUpChannel) {
            const levelUpChannel = message.guild.channels.cache.get(guildConfig.leveling.levelUpChannel);
            if (levelUpChannel) {
                channelToSend = levelUpChannel;
            }
        }

        try {
            await channelToSend.send({ embeds: [embed] });
        } catch (error) {
            logger.error('Failed to send level up message:', error);
        }

        // Check for role rewards
        if (guildConfig.leveling.roleRewards && guildConfig.leveling.roleRewards.length > 0) {
            const roleReward = guildConfig.leveling.roleRewards.find(
                reward => reward.level === userDoc.level
            );

            if (roleReward) {
                const role = message.guild.roles.cache.get(roleReward.roleId);
                const member = message.guild.members.cache.get(message.author.id);

                if (role && member && !member.roles.cache.has(role.id)) {
                    try {
                        await member.roles.add(role);
                        
                        const roleEmbed = new EmbedBuilder()
                            .setColor('#00FF00')
                            .setTitle('🎁 Role Reward!')
                            .setDescription(`You've been awarded the ${role} role for reaching level ${userDoc.level}!`)
                            .setTimestamp();

                        await channelToSend.send({ embeds: [roleEmbed] });
                    } catch (error) {
                        logger.error('Failed to assign role reward:', error);
                    }
                }
            }
        }
    }

    async resetUserXP(userId, guildId) {
        try {
            const userDoc = await User.findOne({ userId, guildId });
            if (userDoc) {
                userDoc.xp = 0;
                userDoc.level = 0;
                await userDoc.save();
                return true;
            }
            return false;
        } catch (error) {
            logger.error('Error resetting user XP:', error);
            return false;
        }
    }

    async addXP(userId, guildId, amount) {
        try {
            const userDoc = await User.getUser(userId, guildId);
            userDoc.xp += amount;
            
            while (userDoc.xp >= userDoc.getRequiredXP()) {
                userDoc.xp -= userDoc.getRequiredXP();
                userDoc.level++;
            }
            
            await userDoc.save();
            return userDoc;
        } catch (error) {
            logger.error('Error adding XP:', error);
            return null;
        }
    }
}

module.exports = LevelingService;