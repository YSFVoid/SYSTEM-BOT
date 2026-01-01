const { EmbedBuilder } = require('discord.js');
const Guild = require('../../database/models/Guild');
const logger = require('../../utils/logger');

module.exports = {
    name: 'guildMemberAdd',
    async execute(member, client) {
        try {
            const guildConfig = await Guild.getGuild(member.guild.id);

            // Welcome message
            if (guildConfig.welcome.enabled && guildConfig.welcome.channelId) {
                const channel = member.guild.channels.cache.get(guildConfig.welcome.channelId);
                
                if (channel) {
                    const message = guildConfig.welcome.message
                        .replace('{user}', member.toString())
                        .replace('{username}', member.user.username)
                        .replace('{server}', member.guild.name)
                        .replace('{memberCount}', member.guild.memberCount);

                    const welcomeEmbed = new EmbedBuilder()
                        .setColor('#00FF00')
                        .setTitle('👋 Welcome!')
                        .setDescription(message)
                        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                        .setFooter({ text: `Member #${member.guild.memberCount}` })
                        .setTimestamp();

                    await channel.send({ embeds: [welcomeEmbed] });
                }
            }

            // Auto-role
            if (guildConfig.welcome.autoRole) {
                const role = member.guild.roles.cache.get(guildConfig.welcome.autoRole);
                if (role && member.guild.members.me.permissions.has('ManageRoles')) {
                    await member.roles.add(role).catch(err => 
                        logger.error(`Failed to add auto-role: ${err.message}`)
                    );
                }
            }

            // Logging
            if (guildConfig.logging.enabled && guildConfig.logging.events.memberJoin) {
                const logChannel = member.guild.channels.cache.get(guildConfig.logging.channelId);
                
                if (logChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setColor('#00FF00')
                        .setTitle('📥 Member Joined')
                        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                        .addFields(
                            { name: 'User', value: `${member.user.tag} (${member.id})`, inline: true },
                            { name: 'Account Created', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true }
                        )
                        .setFooter({ text: `Member #${member.guild.memberCount}` })
                        .setTimestamp();

                    await logChannel.send({ embeds: [logEmbed] });
                }
            }
        } catch (error) {
            logger.error('Error in guildMemberAdd event:', error);
        }
    }
};