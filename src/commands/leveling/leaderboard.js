const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const User = require('../../database/models/User');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('View the server XP leaderboard')
        .addIntegerOption(option =>
            option.setName('page')
                .setDescription('Page number')
                .setMinValue(1)
                .setRequired(false)
        ),
    
    cooldown: 10000,

    async execute(interaction) {
        await interaction.deferReply();

        const page = interaction.options.getInteger('page') || 1;
        const perPage = 10;
        const skip = (page - 1) * perPage;

        try {
            const totalUsers = await User.countDocuments({ guildId: interaction.guild.id });
            const totalPages = Math.ceil(totalUsers / perPage);

            if (page > totalPages) {
                return interaction.editReply({
                    content: `❌ Page ${page} does not exist. There are only ${totalPages} page(s).`,
                    ephemeral: true
                });
            }

            const users = await User.find({ guildId: interaction.guild.id })
                .sort({ level: -1, xp: -1 })
                .skip(skip)
                .limit(perPage);

            const leaderboardEmbed = new EmbedBuilder()
                .setColor('#FFD700')
                .setTitle(`🏆 ${interaction.guild.name} Leaderboard`)
                .setDescription('Top members by level and XP')
                .setFooter({ text: `Page ${page}/${totalPages} • Total Members: ${totalUsers}` })
                .setTimestamp();

            let description = '';
            for (let i = 0; i < users.length; i++) {
                const user = users[i];
                const position = skip + i + 1;
                const medal = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : `#${position}`;
                
                const member = await interaction.guild.members.fetch(user.userId).catch(() => null);
                const username = member ? member.user.tag : `Unknown User (${user.userId})`;

                description += `${medal} **${username}**\n`;
                description += `└ Level: ${user.level} • XP: ${user.xp}/${user.getRequiredXP()}\n\n`;
            }

            leaderboardEmbed.setDescription(description);

            // Add current user's rank if not on this page
            const currentUserDoc = await User.getUser(interaction.user.id, interaction.guild.id);
            const allUsers = await User.find({ guildId: interaction.guild.id })
                .sort({ level: -1, xp: -1 });
            const currentUserRank = allUsers.findIndex(u => u.userId === interaction.user.id) + 1;

            if (currentUserRank < skip + 1 || currentUserRank > skip + perPage) {
                leaderboardEmbed.addFields({
                    name: 'Your Rank',
                    value: `#${currentUserRank} • Level ${currentUserDoc.level} • XP: ${currentUserDoc.xp}/${currentUserDoc.getRequiredXP()}`
                });
            }

            await interaction.editReply({ embeds: [leaderboardEmbed] });
        } catch (error) {
            return interaction.editReply({
                content: '❌ An error occurred while fetching the leaderboard.',
                ephemeral: true
            });
        }
    }
};