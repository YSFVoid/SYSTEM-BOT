const { ActivityType } = require('discord.js');
const logger = require('../../utils/logger');

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        logger.success(`Logged in as ${client.user.tag}`);
        logger.info(`Serving ${client.guilds.cache.size} guilds`);
        logger.info(`Loaded ${client.commands.size} commands`);

        // Set bot status
        const statuses = [
            { name: '/help | In {guilds} servers', type: ActivityType.Playing },
            { name: 'over {users} users', type: ActivityType.Watching },
            { name: 'to /play', type: ActivityType.Listening }
        ];

        let currentStatus = 0;

        const updateStatus = () => {
            const status = statuses[currentStatus];
            const name = status.name
                .replace('{guilds}', client.guilds.cache.size)
                .replace('{users}', client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0));

            client.user.setActivity(name, { type: status.type });
            currentStatus = (currentStatus + 1) % statuses.length;
        };

        updateStatus();
        setInterval(updateStatus, 30000);

        // Check for expired mutes
        const Mute = require('../../database/models/Mute');
        setInterval(async () => {
            try {
                const expiredMutes = await Mute.find({
                    expiresAt: { $lte: new Date() },
                    active: true
                });

                for (const mute of expiredMutes) {
                    const guild = client.guilds.cache.get(mute.guildId);
                    if (!guild) continue;

                    const member = await guild.members.fetch(mute.userId).catch(() => null);
                    if (!member) continue;

                    const Guild = require('../../database/models/Guild');
                    const guildConfig = await Guild.getGuild(mute.guildId);
                    const muteRole = guild.roles.cache.get(guildConfig.moderation.muteRole);

                    if (muteRole && member.roles.cache.has(muteRole.id)) {
                        await member.roles.remove(muteRole);
                    }

                    mute.active = false;
                    await mute.save();
                    logger.info(`Unmuted ${member.user.tag} in ${guild.name}`);
                }
            } catch (error) {
                logger.error('Error checking expired mutes:', error);
            }
        }, 60000);
    }
};