const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    guildId: {
        type: String,
        required: true
    },
    xp: {
        type: Number,
        default: 0
    },
    level: {
        type: Number,
        default: 0
    },
    lastXP: {
        type: Date,
        default: null
    },
    totalMessages: {
        type: Number,
        default: 0
    },
    warnings: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

userSchema.index({ userId: 1, guildId: 1 }, { unique: true });

userSchema.statics.getUser = async function(userId, guildId) {
    let user = await this.findOne({ userId, guildId });
    if (!user) {
        user = await this.create({ userId, guildId });
    }
    return user;
};

userSchema.methods.addXP = function(amount) {
    this.xp += amount;
    const requiredXP = this.level * this.level * 100 + 100;
    
    if (this.xp >= requiredXP) {
        this.level++;
        this.xp = this.xp - requiredXP;
        return true; // Level up
    }
    return false;
};

userSchema.methods.getRequiredXP = function() {
    return this.level * this.level * 100 + 100;
};

module.exports = mongoose.model('User', userSchema);