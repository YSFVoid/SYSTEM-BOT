const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { createErrorEmbed } = require('../../utils/embeds');

const triviaQuestions = [
    {
        question: 'What is the capital of France?',
        options: ['London', 'Berlin', 'Paris', 'Madrid'],
        correct: 2
    },
    {
        question: 'Which planet is known as the Red Planet?',
        options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
        correct: 1
    },
    {
        question: 'Who painted the Mona Lisa?',
        options: ['Vincent van Gogh', 'Pablo Picasso', 'Leonardo da Vinci', 'Michelangelo'],
        correct: 2
    },
    {
        question: 'What is the largest ocean on Earth?',
        options: ['Atlantic Ocean', 'Indian Ocean', 'Arctic Ocean', 'Pacific Ocean'],
        correct: 3
    },
    {
        question: 'In what year did World War II end?',
        options: ['1943', '1944', '1945', '1946'],
        correct: 2
    },
    {
        question: 'What is the smallest country in the world?',
        options: ['Monaco', 'Vatican City', 'San Marino', 'Liechtenstein'],
        correct: 1
    },
    {
        question: 'Which programming language is known as the "language of the web"?',
        options: ['Python', 'JavaScript', 'Java', 'C++'],
        correct: 1
    },
    {
        question: 'How many continents are there?',
        options: ['5', '6', '7', '8'],
        correct: 2
    }
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('trivia')
        .setDescription('Play a trivia game')
        .addStringOption(option =>
            option.setName('difficulty')
                .setDescription('Difficulty level')
                .addChoices(
                    { name: 'Easy', value: 'easy' },
                    { name: 'Medium', value: 'medium' },
                    { name: 'Hard', value: 'hard' }
                )
                .setRequired(false)
        ),
    
    cooldown: 10000,

    async execute(interaction) {
        const difficulty = interaction.options.getString('difficulty') || 'medium';
        const question = triviaQuestions[Math.floor(Math.random() * triviaQuestions.length)];

        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('🎯 Trivia Question')
            .setDescription(question.question)
            .addFields(
                { name: 'Option A', value: question.options[0], inline: true },
                { name: 'Option B', value: question.options[1], inline: true },
                { name: 'Option C', value: question.options[2], inline: true },
                { name: 'Option D', value: question.options[3], inline: true }
            )
            .setFooter({ text: `Difficulty: ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} | You have 30 seconds to answer` })
            .setTimestamp();

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('trivia_0')
                    .setLabel('A')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('trivia_1')
                    .setLabel('B')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('trivia_2')
                    .setLabel('C')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('trivia_3')
                    .setLabel('D')
                    .setStyle(ButtonStyle.Primary)
            );

        const message = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

        const collector = message.createMessageComponentCollector({ 
            filter: i => i.user.id === interaction.user.id,
            time: 30000,
            max: 1
        });

        collector.on('collect', async i => {
            const answer = parseInt(i.customId.split('_')[1]);
            const correct = answer === question.correct;

            const resultEmbed = new EmbedBuilder()
                .setColor(correct ? '#00FF00' : '#FF0000')
                .setTitle(correct ? '✅ Correct!' : '❌ Wrong!')
                .setDescription(correct 
                    ? `Great job! The answer was **${question.options[question.correct]}**.`
                    : `The correct answer was **${question.options[question.correct]}**.`
                )
                .setFooter({ text: `Answered by ${interaction.user.tag}` })
                .setTimestamp();

            await i.update({ embeds: [resultEmbed], components: [] });
        });

        collector.on('end', async collected => {
            if (collected.size === 0) {
                const timeoutEmbed = new EmbedBuilder()
                    .setColor('#FFA500')
                    .setTitle('⏰ Time\'s Up!')
                    .setDescription(`The correct answer was **${question.options[question.correct]}**.`)
                    .setTimestamp();

                await interaction.editReply({ embeds: [timeoutEmbed], components: [] });
            }
        });
    }
};