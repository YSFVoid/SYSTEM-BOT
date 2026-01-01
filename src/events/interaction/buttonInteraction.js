const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const ticketService = require('../../services/ticketService');
const Ticket = require('../../database/models/Ticket');
const { createErrorEmbed } = require('../../utils/embeds');
const logger = require('../../utils/logger');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        if (!interaction.isButton()) return;

        try {
            // Ticket Create Button
            if (interaction.customId === 'ticket_create') {
                const modal = new ModalBuilder()
                    .setCustomId('ticket_modal')
                    .setTitle('Create Support Ticket');

                const subjectInput = new TextInputBuilder()
                    .setCustomId('ticket_subject')
                    .setLabel('What do you need help with?')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('Brief description of your issue')
                    .setRequired(true)
                    .setMaxLength(100);

                const row = new ActionRowBuilder().addComponents(subjectInput);
                modal.addComponents(row);

                await interaction.showModal(modal);
            }

            // Ticket Close Button
            if (interaction.customId === 'ticket_close') {
                await ticketService.closeTicket(interaction, 'Closed by user request');
            }

            // Ticket Claim Button
            if (interaction.customId === 'ticket_claim') {
                const ticket = await Ticket.findOne({
                    channelId: interaction.channel.id,
                    status: 'open'
                });

                if (!ticket) {
                    return interaction.reply({
                        embeds: [createErrorEmbed(
                            'Not a Ticket',
                            'This is not a valid ticket channel.'
                        )],
                        ephemeral: true
                    });
                }

                if (ticket.claimedBy) {
                    return interaction.reply({
                        embeds: [createErrorEmbed(
                            'Already Claimed',
                            `This ticket has already been claimed by <@${ticket.claimedBy}>.`
                        )],
                        ephemeral: true
                    });
                }

                ticket.claimedBy = interaction.user.id;
                await ticket.save();

                await interaction.reply({
                    content: `✅ Ticket claimed by ${interaction.user}. They will assist you shortly.`
                });

                logger.info(`Ticket #${ticket.ticketNumber} claimed by ${interaction.user.tag}`);
            }
        } catch (error) {
            logger.error('Error handling button interaction:', error);
        }
    }
};

// Handle Modal Submit
const modalHandler = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        if (!interaction.isModalSubmit()) return;

        try {
            if (interaction.customId === 'ticket_modal') {
                const subject = interaction.fields.getTextInputValue('ticket_subject');
                await ticketService.createTicket(interaction, subject);
            }
        } catch (error) {
            logger.error('Error handling modal submit:', error);
        }
    }
};

module.exports.modalHandler = modalHandler;