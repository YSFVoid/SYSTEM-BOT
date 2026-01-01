const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createModerationEmbed, createErrorEmbed, createSuccessEmbed } = require('../../utils/embeds');
const { canModerate } = require('../../utils/permissions');
const Warning = require('../../database/models/Warning');
const User = require('../../database/models/User');
const logService = require('../../services/logService');
const crypto = require('crypto');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Warn a member')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to warn')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the warning')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    
    permissions: [PermissionFlagsBits.ModerateMembers],
    cooldown: 3000,

    async execute(interaction) {
        const targetUser = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason');

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
                    'Cannot Warn User',
                    'You cannot warn this user due to role hierarchy.'
                )],
                ephemeral: true
            });
        }

        try {
            const warningId = crypto.randomBytes(8).toString('hex');
            
            await Warning.create({
                guildId: interaction.guild.id,
                userId: targetUser.id,
                moderatorId: interaction.user.id,
                reason,
                warningId
            });

            const userDoc = await User.getUser(targetUser.id, interaction.guild.id);
            userDoc.warnings += 1;
            await userDoc.save();

            const warningCount = await Warning.countDocuments({
                guildId: interaction.guild.id,
                userId: targetUser.id
            });

            try {
                const dmEmbed = createModerationEmbed(
                    'You have been warned',
                    interaction.user,
                    targetUser,
                    reason
                );
                dmEmbed.addFields(
                    { name: 'Server', value: interaction.guild.name },
                    { name: 'Total Warnings', value: warningCount.toString() },
                    { name: 'Warning ID', value: warningId }
                );
                await targetUser.send({ embeds: [dmEmbed] });
            } catch (error) {
                // User has DMs disabled
            }

            const successEmbed = createSuccessEmbed(
                'User Warned',
                `${targetUser.tag} has been warned.`
            );
            successEmbed.addFields(
                { name: 'Reason', value: reason },
                { name: 'Total Warnings', value: warningCount.toString() },
                { name: 'Warning ID', value: warningId },
                { name: 'Moderator', value: interaction.user.tag }
            );

            await interaction.reply({ embeds: [successEmbed] });

            await logService.logModeration(interaction.guild.id, {
                action: 'WARN',
                moderator: interaction.user,
                target: targetUser,
                reason,
                warningId
            });
        } catch (error) {
            return interaction.reply({
                embeds: [createErrorEmbed(
                    'Failed to Warn',
                    `An error occurred while trying to warn ${targetUser.tag}.`
                )],
                ephemeral: true
            });
        }
    }
};