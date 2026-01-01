const mongoose = require('mongoose');

const muteSchema = new mongoose.Schema({
    guildId: {
        type: String,
        required: true
    },
    userId: {
        type: String,
        required: true
    },
    moderatorId: {
        type: String,
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    mutedAt: {
        type: Date,
        default: Date.now
    },
    expiresAt: {
        type: Date,
        required: true
    },
    active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

muteSchema.index({ guildId: 1, userId: 1, active: 1 });
muteSchema.index({ expiresAt: 1 });

module.exports = mongoose.model('Mute', muteSchema);