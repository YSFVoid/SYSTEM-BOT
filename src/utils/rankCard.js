const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');

async function createRankCard(options) {
    const {
        username,
        discriminator,
        avatar,
        level,
        xp,
        requiredXP,
        rank,
        color = '#5865F2'
    } = options;

    // Create canvas
    const canvas = createCanvas(934, 282);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#23272A';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Accent bar
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, 10);

    // Progress bar background
    ctx.fillStyle = '#2C2F33';
    ctx.beginPath();
    ctx.roundRect(240, 200, 660, 40, 20);
    ctx.fill();

    // Progress bar fill
    const progress = Math.min((xp / requiredXP) * 100, 100);
    const progressWidth = (660 * progress) / 100;
    
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(240, 200, progressWidth, 40, 20);
    ctx.fill();

    // Avatar circle background
    ctx.fillStyle = '#2C2F33';
    ctx.beginPath();
    ctx.arc(140, 141, 100, 0, Math.PI * 2);
    ctx.fill();

    // Avatar
    try {
        const avatarImage = await loadImage(avatar);
        ctx.save();
        ctx.beginPath();
        ctx.arc(140, 141, 90, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatarImage, 50, 51, 180, 180);
        ctx.restore();
    } catch (error) {
        // If avatar fails to load, draw placeholder
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(140, 141, 90, 0, Math.PI * 2);
        ctx.fill();
    }

    // Username
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 40px Arial';
    ctx.fillText(username, 260, 80);

    // Discriminator (if exists)
    if (discriminator && discriminator !== '0') {
        ctx.fillStyle = '#99AAB5';
        ctx.font = '30px Arial';
        ctx.fillText(`#${discriminator}`, 260 + ctx.measureText(username).width + 10, 80);
    }

    // Rank
    ctx.fillStyle = '#99AAB5';
    ctx.font = '30px Arial';
    ctx.fillText(`Rank #${rank}`, 260, 120);

    // Level
    ctx.fillStyle = color;
    ctx.font = 'bold 50px Arial';
    const levelText = `Level ${level}`;
    const levelWidth = ctx.measureText(levelText).width;
    ctx.fillText(levelText, canvas.width - levelWidth - 40, 120);

    // XP Text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '24px Arial';
    const xpText = `${xp.toLocaleString()} / ${requiredXP.toLocaleString()} XP`;
    const xpWidth = ctx.measureText(xpText).width;
    ctx.fillText(xpText, canvas.width - xpWidth - 40, 260);

    return canvas.toBuffer('image/png');
}

module.exports = { createRankCard };