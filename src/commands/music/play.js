const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { createErrorEmbed } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Play a song')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('Song name or URL')
                .setRequired(true)
        ),
    
    cooldown: 3000,

    async execute(interaction, client) {
        const query = interaction.options.getString('query');
        const member = interaction.member;
        const voiceChannel = member.voice.channel;

        if (!voiceChannel) {
            return interaction.reply({
                embeds: [createErrorEmbed(
                    'Not in Voice Channel',
                    'You need to be in a voice channel to play music.'
                )],
                ephemeral: true
            });
        }

        const botChannel = interaction.guild.members.me.voice.channel;
        if (botChannel && botChannel.id !== voiceChannel.id) {
            return interaction.reply({
                embeds: [createErrorEmbed(
                    'Different Voice Channel',
                    'I\'m already playing music in another voice channel.'
                )],
                ephemeral: true
            });
        }

        await interaction.deferReply();

        try {
            const searchResult = await client.player.search(query, {
                requestedBy: interaction.user
            });

            if (!searchResult || !searchResult.tracks.length) {
                return interaction.editReply({
                    embeds: [createErrorEmbed(
                        'No Results',
                        'No results found for your query.'
                    )]
                });
            }

            const queue = client.player.nodes.create(interaction.guild, {
                metadata: {
                    channel: interaction.channel,
                    voiceChannel: voiceChannel
                },
                leaveOnEmpty: true,
                leaveOnEmptyCooldown: 300000,
                leaveOnEnd: true,
                leaveOnEndCooldown: 300000,
                selfDeaf: true
            });

            try {
                if (!queue.connection) {
                    await queue.connect(voiceChannel);
                }
            } catch {
                queue.delete();
                return interaction.editReply({
                    embeds: [createErrorEmbed(
                        'Connection Failed',
                        'Could not join your voice channel.'
                    )]
                });
            }

            searchResult.playlist ? queue.addTrack(searchResult.tracks) : queue.addTrack(searchResult.tracks[0]);

            if (!queue.isPlaying()) {
                await queue.node.play();
            }

            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle(searchResult.playlist ? '📋 Playlist Added' : '🎵 Song Added to Queue')
                .setDescription(searchResult.playlist 
                    ? `**${searchResult.playlist.title}**\nAdded ${searchResult.tracks.length} songs to the queue.`
                    : `[${searchResult.tracks[0].title}](${searchResult.tracks[0].url})`
                )
                .addFields(
                    { name: 'Duration', value: searchResult.playlist ? `${searchResult.tracks.length} songs` : searchResult.tracks[0].duration, inline: true },
                    { name: 'Requested By', value: interaction.user.toString(), inline: true }
                )
                .setThumbnail(searchResult.playlist ? searchResult.playlist.thumbnail : searchResult.tracks[0].thumbnail)
                .setTimestamp();

            if (!searchResult.playlist && queue.tracks.size > 0) {
                embed.addFields({ name: 'Position in Queue', value: `#${queue.tracks.size}`, inline: true });
            }

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            return interaction.editReply({
                embeds: [createErrorEmbed(
                    'Playback Error',
                    'An error occurred while trying to play the song.'
                )]
            });
        }
    }
};