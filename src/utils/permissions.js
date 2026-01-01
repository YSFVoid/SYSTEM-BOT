const { PermissionFlagsBits } = require('discord.js');

const checkPermissions = (member, permissions) => {
    if (!Array.isArray(permissions)) {
        permissions = [permissions];
    }

    for (const permission of permissions) {
        if (!member.permissions.has(permission)) {
            return false;
        }
    }
    return true;
};

const checkBotPermissions = (guild, permissions) => {
    const botMember = guild.members.me;
    return checkPermissions(botMember, permissions);
};

const isOwner = (member) => {
    return member.guild.ownerId === member.id;
};

const isModerator = (member) => {
    return checkPermissions(member, [
        PermissionFlagsBits.ModerateMembers,
        PermissionFlagsBits.KickMembers,
        PermissionFlagsBits.BanMembers
    ]) || isOwner(member);
};

const isAdmin = (member) => {
    return checkPermissions(member, PermissionFlagsBits.Administrator) || isOwner(member);
};

const canModerate = (moderator, target) => {
    if (moderator.id === target.id) return false;
    if (target.guild.ownerId === target.id) return false;
    
    return moderator.roles.highest.position > target.roles.highest.position;
};

const canBotModerate = (guild, target) => {
    const botMember = guild.members.me;
    if (target.guild.ownerId === target.id) return false;
    
    return botMember.roles.highest.position > target.roles.highest.position;
};

module.exports = {
    checkPermissions,
    checkBotPermissions,
    isOwner,
    isModerator,
    isAdmin,
    canModerate,
    canBotModerate
};