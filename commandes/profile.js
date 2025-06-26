const { createCanvas, loadImage } = require('canvas');

module.exports = {
  name: 'profile',
  async execute(message, args, data, fs, dataFile) {
    const target = message.mentions.users.first() || message.author;
    const userId = target.id;
    const username = target.username;
    const avatarURL = target.displayAvatarURL({ extension: 'jpg' });
    const guildId = message.guild.id;

    if (!data[guildId]) data[guildId] = { users: {}, shop: [], chance: 45 };

    if (!data[guildId].users[userId]) {
      const defaultCoins = data[guildId].defaultCoins ?? 5;
      data[guildId].users[userId] = {
        coins: defaultCoins,
        lastClaim: 0,
        tirage: 3,
        gains: {}
      };
      fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
    }

    // 1. Message de chargement
    const loadingMessage = await message.channel.send('⏳ Chargement du profil en cours...');

    const userData = data[guildId].users[userId];
    const canvas = createCanvas(700, 250);
    const ctx = canvas.getContext('2d');

    try {
      const background = await loadImage('https://cdn.laccom.org/fond.png');
      ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
    } catch {
      ctx.fillStyle = '#2C2F33';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.fillStyle = '#fff';
    ctx.font = '28px sans-serif';
    ctx.fillText(`Profil de ${username}`, 200, 40);
    ctx.fillStyle = '#00FF88';
    ctx.font = '22px sans-serif';
    ctx.fillText(`💰 Coins : ${userData.coins}`, 200, 100);
    ctx.fillStyle = '#FFD700';
    ctx.fillText(`🎟️ Tirages : ${userData.tirage}`, 200, 150);

    try {
      const avatar = await loadImage(avatarURL);
      ctx.save();
      ctx.beginPath();
      ctx.arc(100, 125, 75, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatar, 25, 50, 150, 150);
      ctx.restore();
    } catch {}

    const buffer = canvas.toBuffer();

    // 2. Supprimer le message de chargement
    await loadingMessage.delete().catch(() => {});

    // 3. Envoyer l'image du profil
    await message.channel.send({ files: [{ attachment: buffer, name: 'profile.png' }] });
  }
};
