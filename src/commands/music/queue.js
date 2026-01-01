const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { createErrorEmbed } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('View the current music queue')
        .addIntegerOption(option =>
            option.setName('page')
                .setDescription('Page number')
                .setMinValue(1)
                .setRequired(false)
        ),
    
    cooldown: 5000,

    async execute(interaction, client) {
        const queue = client.player.nodes.get(interaction.guild.id);

        if (!queue || !queue.isPlaying()) {
            return interaction.reply({
                embeds: [createErrorEmbed(
                    'No Music Playing',
                    'There is no music playing right now.'
                )],
                ephemeral: true
            });
        }

        const page = interaction.options.getInteger('page') || 1;
        const tracksPerPage = 10;
        const totalPages = Math.ceil(queue.tracks.size / tracksPerPage);

        if (page > totalPages && totalPages > 0) {
            return interaction.reply({
                embeds: [createErrorEmbed(
                    'Invalid Page',
                    `Page ${page} does not exist. There are only ${totalPages} page(s).`
                )],
                ephemeral: true
            });
        }

        const start = (page - 1) * tracksPerPage;
        const end = start + tracksPerPage;
        const tracks = Array.from(queue.tracks.data.slice(start, end));

        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('🎵 Music Queue')
            .setDescription(`**Now Playing:**\n[${queue.currentTrack.title}](${queue.currentTrack.url}) - \`${queue.currentTrack.duration}\`\n\n**Up Next:**`)
            .setThumbnail(queue.currentTrack.thumbnail)
            .setFooter({ text: `Page ${page}/${totalPages || 1} • ${queue.tracks.size} song(s) in queue` })
            .setTimestamp();

        if (tracks.length === 0) {
            embed.setDescription(`**Now Playing:**\n[${queue.currentTrack.title}](${queue.currentTrack.url}) - \`${queue.currentTrack.duration}\`\n\n*No more songs in queue*`);
        } else {
            let queueString = '';
            for (let i = 0; i < tracks.length; i++) {
                const track = tracks[i];
                queueString += `**${start + i + 1}.** [${track.title}](${track.url}) - \`${track.duration}\`\n`;
            }
            embed.addFields({ name: 'Queue', value: queueString });
        }

        embed.addFields(
            { name: 'Volume', value: `${queue.node.volume}%`, inline: true },
            { name: 'Loop', value: queue.repeatMode ? (queue.repeatMode === 1 ? 'Track' : 'Queue') : 'Off', inline: true },
            { name: 'Total Duration', value: queue.estimatedDuration || 'Unknown', inline: true }
        );

        await interaction.reply({ embeds: [embed] });
    }
};