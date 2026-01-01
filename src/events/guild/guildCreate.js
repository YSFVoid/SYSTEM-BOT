const LevelingService = require('../../services/levelingService');

module.exports = {
    name: 'messageCreate',
    async execute(message, client) {
        if (message.author.bot || !message.guild) return;

        // Initialize leveling service if not exists
        if (!client.levelingService) {
            client.levelingService = new LevelingService(client);
        }

        // Handle XP gain
        await client.levelingService.handleMessage(message);
    }
};