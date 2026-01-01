const { EmbedBuilder } = require('discord.js');
const logger = require('../utils/logger');

async function handleCommandError(interaction, error) {
    logger.error(`Error in command ${interaction.commandName}:`, error);

    const errorEmbed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('❌ Error')
        .setDescription('An error occurred while executing this command.')
        .setFooter({ text: 'If this persists, contact support.' })
        .setTimestamp();

    const replyOptions = { embeds: [errorEmbed], ephemeral: true };

    if (interaction.replied || interaction.deferred) {
        await interaction.followUp(replyOptions);
    } else {
        await interaction.reply(replyOptions);
    }
}

async function handleInteractionError(interaction, error) {
    logger.error('Interaction error:', error);

    const errorEmbed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('❌ Error')
        .setDescription('An error occurred while processing your interaction.')
        .setTimestamp();

    try {
        if (interaction.isButton() || interaction.isStringSelectMenu()) {
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    } catch (err) {
        logger.error('Failed to send error message:', err);
    }
}

module.exports = {
    handleCommandError,
    handleInteractionError
};