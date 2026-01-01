const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const { createErrorEmbed } = require('../../utils/embeds');
const User = require('../../database/models/User');
const { createRankCard } = require('../../utils/rankCard');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rank')
        .setDescription('View your or another user\'s rank')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to view')
                .setRequired(false)
        ),
    
    cooldown: 5000,

    async execute(interaction) {
        await interaction.deferReply();

        const targetUser = interaction.options.getUser('user') || interaction.user;
        const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

        if (!targetMember) {
            return interaction.editReply({
                embeds: [createErrorEmbed(
                    'User Not Found',
                    'This user is not in the server.'
                )]
            });
        }

        if (targetUser.bot) {
            return interaction.editReply({
                embeds: [createErrorEmbed(
                    'Invalid User',
                    'Bots do not have ranks.'
                )]
            });
        }

        try {
            const userDoc = await User.getUser(targetUser.id, interaction.guild.id);

            // Get user rank
            const allUsers = await User.find({ guildId: interaction.guild.id })
                .sort({ level: -1, xp: -1 });
            
            const rank = allUsers.findIndex(u => u.userId === targetUser.id) + 1;

            // Generate rank card
            const rankCard = await createRankCard({
                username: targetUser.username,
                discriminator: targetUser.discriminator,
                avatar: targetUser.displayAvatarURL({ extension: 'png', size: 256 }),
                level: userDoc.level,
                xp: userDoc.xp,
                requiredXP: userDoc.getRequiredXP(),
                rank,
                color: targetMember.displayHexColor === '#000000' ? '#5865F2' : targetMember.displayHexColor
            });

            const attachment = new AttachmentBuilder(rankCard, { name: 'rank.png' });
            await interaction.editReply({ files: [attachment] });
        } catch (error) {
            return interaction.editReply({
                embeds: [createErrorEmbed(
                    'Failed to Generate Rank Card',
                    'An error occurred while generating the rank card.'
                )]
            });
        }
    }
};