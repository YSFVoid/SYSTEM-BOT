const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createModerationEmbed, createErrorEmbed, createSuccessEmbed } = require('../../utils/embeds');
const { canModerate, canBotModerate } = require('../../utils/permissions');
const { validateDuration } = require('../../utils/validator');
const Mute = require('../../database/models/Mute');
const Guild = require('../../database/models/Guild');
const logService = require('../../services/logService');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Mute a member in the server')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to mute')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('duration')
                .setDescription('Duration (e.g., 10m, 1h, 1d)')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the mute')
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    
    permissions: [PermissionFlagsBits.ModerateMembers],
    botPermissions: [PermissionFlagsBits.ManageRoles],
    cooldown: 5000,

    async execute(interaction) {
        const targetUser = interaction.options.getUser('user');
        const durationStr = interaction.options.getString('duration');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        const duration = validateDuration(durationStr);
        if (!duration) {
            return interaction.reply({
                embeds: [createErrorEmbed(
                    'Invalid Duration',
                    'Please provide a valid duration (e.g., 10m, 1h, 1d)'
                )],
                ephemeral: true
            });
        }

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
                    'Cannot Mute User',
                    'You cannot mute this user due to role hierarchy.'
                )],
                ephemeral: true
            });
        }

        if (!canBotModerate(interaction.guild, targetMember)) {
            return interaction.reply({
                embeds: [createErrorEmbed(
                    'Cannot Mute User',
                    'I cannot mute this user due to role hierarchy.'
                )],
                ephemeral: true
            });
        }

        const guildConfig = await Guild.getGuild(interaction.guild.id);
        let muteRole = interaction.guild.roles.cache.get(guildConfig.moderation.muteRole);

        // Create mute role if it doesn't exist
        if (!muteRole) {
            try {
                muteRole = await interaction.guild.roles.create({
                    name: 'Muted',
                    color: '#818386',
                    permissions: [],
                    reason: 'Mute role for moderation'
                });

                // Update permissions for all channels
                const channels = interaction.guild.channels.cache;
                for (const [, channel] of channels) {
                    await channel.permissionOverwrites.create(muteRole, {
                        SendMessages: false,
                        AddReactions: false,
                        Speak: false
                    }).catch(() => {});
                }

                guildConfig.moderation.muteRole = muteRole.id;
                await guildConfig.save();
            } catch (error) {
                return interaction.reply({
                    embeds: [createErrorEmbed(
                        'Failed to Create Mute Role',
                        'Could not create or configure the mute role.'
                    )],
                    ephemeral: true
                });
            }
        }

        try {
            await targetMember.roles.add(muteRole, `${reason} | Muted by ${interaction.user.tag}`);

            const expiresAt = new Date(Date.now() + duration);
            await Mute.create({
                guildId: interaction.guild.id,
                userId: targetUser.id,
                moderatorId: interaction.user.id,
                reason,
                expiresAt
            });

            try {
                const dmEmbed = createModerationEmbed(
                    'You have been muted',
                    interaction.user,
                    targetUser,
                    reason
                );
                dmEmbed.addFields(
                    { name: 'Server', value: interaction.guild.name },
                    { name: 'Duration', value: durationStr },
                    { name: 'Expires', value: `<t:${Math.floor(expiresAt.getTime() / 1000)}:R>` }
                );
                await targetUser.send({ embeds: [dmEmbed] });
            } catch (error) {
                // User has DMs disabled
            }

            const successEmbed = createSuccessEmbed(
                'User Muted',
                `${targetUser.tag} has been muted for ${durationStr}.`
            );
            successEmbed.addFields(
                { name: 'Reason', value: reason },
                { name: 'Expires', value: `<t:${Math.floor(expiresAt.getTime() / 1000)}:R>` },
                { name: 'Moderator', value: interaction.user.tag }
            );

            await interaction.reply({ embeds: [successEmbed] });

            await logService.logModeration(interaction.guild.id, {
                action: 'MUTE',
                moderator: interaction.user,
                target: targetUser,
                reason,
                duration: durationStr
            });
        } catch (error) {
            return interaction.reply({
                embeds: [createErrorEmbed(
                    'Failed to Mute',
                    `An error occurred while trying to mute ${targetUser.tag}.`
                )],
                ephemeral: true
            });
        }
    }
};