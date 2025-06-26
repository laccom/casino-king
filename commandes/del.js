module.exports = {
  name: 'del',
  async execute(message, args, data, fs, dataFile) {
    const guild = message.guild;

    if (!message.member.permissions.has('Administrator')) {
      return message.reply('❌ Tu n’as pas la permission d’utiliser cette commande.');
    }

    const type = args[1]?.toLowerCase();
    const amount = parseInt(args[2]);
    if (!['tirage', 'tirages', 'coin', 'coins'].includes(type) || isNaN(amount)) {
      return message.reply('❌ Syntaxe : `-del @utilisateur|@role tirages|coins nombre`');
    }

    const userMention = message.mentions.users.first();
    const roleMention = message.mentions.roles.first();

    if (!userMention && !roleMention) {
      return message.reply('❌ Tu dois mentionner un utilisateur ou un rôle.');
    }

    if (!data[guild.id]) data[guild.id] = { users: {}, shop: [], chance: 45 };

    function initUser(userId) {
      if (!data[guild.id].users[userId]) {
        data[guild.id].users[userId] = {
          coins: 5,
          lastClaim: 0,
          tirage: 3,
          gains: {}
        };
      }
    }

    function delFromUser(userId) {
      initUser(userId);
      if (type.startsWith('tirage')) {
        data[guild.id].users[userId].tirage = Math.max(0, (data[guild.id].users[userId].tirage || 0) - amount);
      } else {
        data[guild.id].users[userId].coins = Math.max(0, (data[guild.id].users[userId].coins || 0) - amount);
      }
    }

    if (userMention) {
      delFromUser(userMention.id);
      fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
      return message.reply(`✅ ${amount} ${type} retiré(s) à ${userMention.username}.`);
    }

    if (roleMention) {
      let count = 0;
      roleMention.members.forEach(member => {
        delFromUser(member.id);
        count++;
      });

      fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
      return message.reply(`✅ ${amount} ${type} retiré(s) à ${count} membres du rôle ${roleMention.name}.`);
    }
  }
};
