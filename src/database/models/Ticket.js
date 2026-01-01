const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
    guildId: {
        type: String,
        required: true
    },
    channelId: {
        type: String,
        required: true,
        unique: true
    },
    userId: {
        type: String,
        required: true
    },
    ticketNumber: {
        type: Number,
        required: true
    },
    subject: {
        type: String,
        default: 'No subject provided'
    },
    status: {
        type: String,
        enum: ['open', 'closed'],
        default: 'open'
    },
    claimedBy: String,
    closedBy: String,
    closedAt: Date,
    transcript: String
}, {
    timestamps: true
});

ticketSchema.index({ guildId: 1, ticketNumber: 1 });

ticketSchema.statics.getNextTicketNumber = async function(guildId) {
    const lastTicket = await this.findOne({ guildId })
        .sort({ ticketNumber: -1 })
        .limit(1);
    
    return lastTicket ? lastTicket.ticketNumber + 1 : 1;
};

ticketSchema.statics.getUserOpenTickets = async function(userId, guildId) {
    return await this.countDocuments({ userId, guildId, status: 'open' });
};

module.exports = mongoose.model('Ticket', ticketSchema);