const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createModerationEmbed, createErrorEmbed, createSuccessEmbed } = require('../../utils/embeds');
const { canModerate, canBotModerate } = require('../../utils/permissions');
const logService = require('../../services/logService');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kick a member from the server')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to kick')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the kick')
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
    
    permissions: [PermissionFlagsBits.KickMembers],
    botPermissions: [PermissionFlagsBits.KickMembers],
    cooldown: 5000,

    async execute(interaction) {
        const targetUser = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

        if (!targetMember) {
            return interaction.reply({
                embeds: [createErrorEmbed(
                    'User Not Found',
                    'This user is not in the server.'
                )],
                ephemeral: true
            });
        }

        if (!canModerate(interaction.member, targetMember)) {
            return interaction.reply({
                embeds: [createErrorEmbed(
                    'Cannot Kick User',
                    'You cannot kick this user due to role hierarchy.'
                )],
                ephemeral: true
            });
        }

        if (!canBotModerate(interaction.guild, targetMember)) {
            return interaction.reply({
                embeds: [createErrorEmbed(
                    'Cannot Kick User',
                    'I cannot kick this user due to role hierarchy.'
                )],
                ephemeral: true
            });
        }

        try {
            const dmEmbed = createModerationEmbed(
                'You have been kicked',
                interaction.user,
                targetUser,
                reason
            );
            dmEmbed.addFields({ name: 'Server', value: interaction.guild.name });
            await targetUser.send({ embeds: [dmEmbed] });
        } catch (error) {
            // User has DMs disabled
        }

        try {
            await targetMember.kick(`${reason} | Kicked by ${interaction.user.tag}`);

            const successEmbed = createSuccessEmbed(
                'User Kicked',
                `${targetUser.tag} has been kicked from the server.`
            );
            successEmbed.addFields(
                { name: 'Reason', value: reason },
                { name: 'Moderator', value: interaction.user.tag }
            );

            await interaction.reply({ embeds: [successEmbed] });

            await logService.logModeration(interaction.guild.id, {
                action: 'KICK',
                moderator: interaction.user,
                target: targetUser,
                reason
            });
        } catch (error) {
            return interaction.reply({
                embeds: [createErrorEmbed(
                    'Failed to Kick',
                    `An error occurred while trying to kick ${targetUser.tag}.`
                )],
                ephemeral: true
            });
        }
    }
};