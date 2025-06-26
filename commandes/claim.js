module.exports = {
  name: 'claim',
  async execute(message, args, data, fs, dataFile) {
    const userId = message.author.id;
    const guildId = message.guild.id;
    const userData = data[guildId].users[userId];
    const now = Date.now();

    if (now - userData.lastClaim < 86400000) {
      const remaining = 86400000 - (now - userData.lastClaim);
      const hours = Math.floor(remaining / 3600000);
      const minutes = Math.floor((remaining % 3600000) / 60000);
      return message.reply(`⏳ Patiente encore ${hours}h ${minutes}m.`);
    }

    userData.coins += 5;
    userData.lastClaim = now;

    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
    return message.reply(`✅ Tu as reçu 5 coins ! Total : ${userData.coins} 💰`);
  },
};
