module.exports = {
  name: 'trade',
  async execute(message, args, data, fs, dataFile) {
    const userId = message.author.id;
    const guildId = message.guild.id;
    const userData = data[guildId].users[userId];

    const target = message.mentions.users.first();
    const amount = parseInt(args[1]);

    if (!target || isNaN(amount) || amount <= 0) {
      return message.reply('❌ Utilisation : `-trade @user montant`');
    }

    if (userData.coins < amount) {
      return message.reply('❌ Tu n’as pas assez de coins.');
    }

    if (!data[guildId].users[target.id]) {
      data[guildId].users[target.id] = {
        coins: 0,
        lastClaim: 0,
        tirage: 3,
        gains: {}
      };
    }

    userData.coins -= amount;
    data[guildId].users[target.id].coins += amount;

    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
    return message.reply(`✅ Tu as envoyé ${amount} coins à ${target.username} !`);
  },
};
