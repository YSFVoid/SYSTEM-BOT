const mongoose = require('mongoose');

const warningSchema = new mongoose.Schema({
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
    warningId: {
        type: String,
        required: true,
        unique: true
    }
}, {
    timestamps: true
});

warningSchema.index({ guildId: 1, userId: 1 });

module.exports = mongoose.model('Warning', warningSchema);