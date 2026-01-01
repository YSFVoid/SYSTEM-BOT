const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, ChannelType, EmbedBuilder } = require('discord.js');
const { createErrorEmbed, createSuccessEmbed } = require('../../utils/embeds');
const Guild = require('../../database/models/Guild');
const Ticket = require('../../database/models/Ticket');
const ticketService = require('../../services/ticketService');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket')
        .setDescription('Ticket system management')
        .addSubcommand(subcommand =>
            subcommand
                .setName('setup')
                .setDescription('Setup the ticket system')
                .addChannelOption(option =>
                    option.setName('category')
                        .setDescription('Category for ticket channels')
                        .addChannelTypes(ChannelType.GuildCategory)
                        .setRequired(true)
                )
                .addRoleOption(option =>
                    option.setName('support')
                        .setDescription('Support role')
                        .setRequired(true)
                )
                .addChannelOption(option =>
                    option.setName('transcript')
                        .setDescription('Channel for transcripts')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('panel')
                .setDescription('Create a ticket panel')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Channel to send the panel')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('close')
                .setDescription('Close the current ticket')
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Reason for closing')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a user to the ticket')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to add')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a user from the ticket')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to remove')
                        .setRequired(true)
                )
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    
    permissions: [PermissionFlagsBits.ManageChannels],
    botPermissions: [PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ManageRoles],
    cooldown: 5000,

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'setup') {
            const category = interaction.options.getChannel('category');
            const supportRole = interaction.options.getRole('support');
            const transcriptChannel = interaction.options.getChannel('transcript');

            const guildConfig = await Guild.getGuild(interaction.guild.id);
            guildConfig.tickets.enabled = true;
            guildConfig.tickets.categoryId = category.id;
            guildConfig.tickets.supportRoleId = supportRole.id;
            if (transcriptChannel) {
                guildConfig.tickets.transcriptChannel = transcriptChannel.id;
            }
            await guildConfig.save();

            return interaction.reply({
                embeds: [createSuccessEmbed(
                    'Ticket System Setup',
                    `Ticket system has been configured!\n\n**Category:** ${category}\n**Support Role:** ${supportRole}${transcriptChannel ? `\n**Transcript Channel:** ${transcriptChannel}` : ''}`
                )],
                ephemeral: true
            });
        }

        if (subcommand === 'panel') {
            const channel = interaction.options.getChannel('channel');
            
            const guildConfig = await Guild.getGuild(interaction.guild.id);
            if (!guildConfig.tickets.enabled) {
                return interaction.reply({
                    embeds: [createErrorEmbed(
                        'Ticket System Not Setup',
                        'Please setup the ticket system first using `/ticket setup`.'
                    )],
                    ephemeral: true
                });
            }

            const embed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle('🎫 Support Tickets')
                .setDescription('Need help? Click the button below to create a support ticket.\n\nOur team will assist you as soon as possible.')
                .addFields(
                    { name: '📋 Before Creating a Ticket', value: '• Make sure your issue hasn\'t been answered in FAQs\n• Provide as much detail as possible\n• Be patient, we\'ll respond soon' }
                )
                .setFooter({ text: 'Click the button below to get started' })
                .setTimestamp();

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('ticket_create')
                        .setLabel('Create Ticket')
                        .setEmoji('🎫')
                        .setStyle(ButtonStyle.Primary)
                );

            await channel.send({ embeds: [embed], components: [row] });

            return interaction.reply({
                embeds: [createSuccessEmbed(
                    'Panel Created',
                    `Ticket panel has been created in ${channel}.`
                )],
                ephemeral: true
            });
        }

        if (subcommand === 'close') {
            const reason = interaction.options.getString('reason') || 'No reason provided';
            await ticketService.closeTicket(interaction, reason);
        }

        if (subcommand === 'add') {
            const user = interaction.options.getUser('user');
            const ticket = await Ticket.findOne({ channelId: interaction.channel.id, status: 'open' });

            if (!ticket) {
                return interaction.reply({
                    embeds: [createErrorEmbed(
                        'Not a Ticket',
                        'This command can only be used in ticket channels.'
                    )],
                    ephemeral: true
                });
            }

            await interaction.channel.permissionOverwrites.create(user, {
                ViewChannel: true,
                SendMessages: true,
                ReadMessageHistory: true
            });

            return interaction.reply({
                embeds: [createSuccessEmbed(
                    'User Added',
                    `${user} has been added to this ticket.`
                )]
            });
        }

        if (subcommand === 'remove') {
            const user = interaction.options.getUser('user');
            const ticket = await Ticket.findOne({ channelId: interaction.channel.id, status: 'open' });

            if (!ticket) {
                return interaction.reply({
                    embeds: [createErrorEmbed(
                        'Not a Ticket',
                        'This command can only be used in ticket channels.'
                    )],
                    ephemeral: true
                });
            }

            if (user.id === ticket.userId) {
                return interaction.reply({
                    embeds: [createErrorEmbed(
                        'Cannot Remove User',
                        'You cannot remove the ticket creator.'
                    )],
                    ephemeral: true
                });
            }

            await interaction.channel.permissionOverwrites.delete(user);

            return interaction.reply({
                embeds: [createSuccessEmbed(
                    'User Removed',
                    `${user} has been removed from this ticket.`
                )]
            });
        }
    }
};