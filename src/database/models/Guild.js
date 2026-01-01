const mongoose = require('mongoose');

const guildSchema = new mongoose.Schema({
    guildId: {
        type: String,
        required: true,
        unique: true
    },
    guildName: String,
    prefix: {
        type: String,
        default: '!'
    },
    moderation: {
        enabled: {
            type: Boolean,
            default: true
        },
        modLogChannel: String,
        muteRole: String,
        autoModEnabled: {
            type: Boolean,
            default: false
        }
    },
    leveling: {
        enabled: {
            type: Boolean,
            default: true
        },
        levelUpChannel: String,
        levelUpMessage: {
            type: String,
            default: 'Congratulations {user}! You reached level {level}!'
        },
        roleRewards: [{
            level: Number,
            roleId: String
        }]
    },
    tickets: {
        enabled: {
            type: Boolean,
            default: false
        },
        categoryId: String,
        supportRoleId: String,
        transcriptChannel: String,
        maxTickets: {
            type: Number,
            default: 3
        }
    },
    welcome: {
        enabled: {
            type: Boolean,
            default: false
        },
        channelId: String,
        message: {
            type: String,
            default: 'Welcome {user} to {server}!'
        },
        autoRole: String
    },
    logging: {
        enabled: {
            type: Boolean,
            default: false
        },
        channelId: String,
        events: {
            memberJoin: { type: Boolean, default: true },
            memberLeave: { type: Boolean, default: true },
            messageDelete: { type: Boolean, default: true },
            messageEdit: { type: Boolean, default: true },
            channelCreate: { type: Boolean, default: true },
            channelDelete: { type: Boolean, default: true },
            roleCreate: { type: Boolean, default: true },
            roleDelete: { type: Boolean, default: true }
        }
    }
}, {
    timestamps: true
});

guildSchema.statics.getGuild = async function(guildId) {
    let guild = await this.findOne({ guildId });
    if (!guild) {
        guild = await this.create({ guildId });
    }
    return guild;
};

module.exports = mongoose.model('Guild', guildSchema);