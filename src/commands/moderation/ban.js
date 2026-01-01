const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createModerationEmbed, createErrorEmbed, createSuccessEmbed } = require('../../utils/embeds');
const { canModerate, canBotModerate } = require('../../utils/permissions');
const logService = require('../../services/logService');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban a member from the server')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to ban')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the ban')
                .setRequired(false)
        )
        .addIntegerOption(option =>
            option.setName('days')
                .setDescription('Number of days of messages to delete (0-7)')
                .setMinValue(0)
                .setMaxValue(7)
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
    
    permissions: [PermissionFlagsBits.BanMembers],
    botPermissions: [PermissionFlagsBits.BanMembers],
    cooldown: 5000,

    async execute(interaction) {
        const targetUser = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const deleteMessageDays = interaction.options.getInteger('days') || 0;

        // Fetch member
        const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

        // Check if user is in the server
        if (targetMember) {
            // Check if moderator can ban this member
            if (!canModerate(interaction.member, targetMember)) {
                return interaction.reply({
                    embeds: [createErrorEmbed(
                        'Cannot Ban User',
                        'You cannot ban this user due to role hierarchy.'
                    )],
                    ephemeral: true
                });
            }

            // Check if bot can ban this member
            if (!canBotModerate(interaction.guild, targetMember)) {
                return interaction.reply({
                    embeds: [createErrorEmbed(
                        'Cannot Ban User',
                        'I cannot ban this user due to role hierarchy.'
                    )],
                    ephemeral: true
                });
            }

            // Send DM to user
            try {
                const dmEmbed = createModerationEmbed(
                    'You have been banned',
                    interaction.user,
                    targetUser,
                    reason
                );
                dmEmbed.addFields({ name: 'Server', value: interaction.guild.name });
                await targetUser.send({ embeds: [dmEmbed] });
            } catch (error) {
                // User has DMs disabled
            }
        }

        // Ban the user
        try {
            await interaction.guild.members.ban(targetUser, {
                deleteMessageSeconds: deleteMessageDays * 86400,
                reason: `${reason} | Banned by ${interaction.user.tag}`
            });

            const successEmbed = createSuccessEmbed(
                'User Banned',
                `${targetUser.tag} has been banned from the server.`
            );
            successEmbed.addFields(
                { name: 'Reason', value: reason },
                { name: 'Moderator', value: interaction.user.tag }
            );

            await interaction.reply({ embeds: [successEmbed] });

            // Log the ban
            await logService.logModeration(interaction.guild.id, {
                action: 'BAN',
                moderator: interaction.user,
                target: targetUser,
                reason
            });
        } catch (error) {
            return interaction.reply({
                embeds: [createErrorEmbed(
                    'Failed to Ban',
                    `An error occurred while trying to ban ${targetUser.tag}.`
                )],
                ephemeral: true
            });
        }
    }
};