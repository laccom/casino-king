module.exports = {
  name: 'add',
  async execute(message, args, data, fs, dataFile) {
    const guild = message.guild;

    if (!message.member.permissions.has('Administrator')) {
      return message.reply("❌ Tu n'as pas la permission d’utiliser cette commande.");
    }

    const type = args[1]?.toLowerCase();
    const amount = parseInt(args[2]);
    if (!['tirage', 'coins'].includes(type) || isNaN(amount)) {
      return message.reply('❌ Syntaxe : `-add @utilisateur|@role tirage|coins nombre`');
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

    if (userMention) {
      initUser(userMention.id);
      if (type === 'tirage') {
        data[guild.id].users[userMention.id].tirage += amount;
      } else {
        data[guild.id].users[userMention.id].coins += amount;
      }

      fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
      return message.reply(`✅ ${amount} ${type} ajoutés à ${userMention.username}.`);
    }

    if (roleMention) {
      let count = 0;
      roleMention.members.forEach(member => {
        initUser(member.id);
        if (type === 'tirage') {
          data[guild.id].users[member.id].tirage += amount;
        } else {
          data[guild.id].users[member.id].coins += amount;
        }
        count++;
      });

      fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
      return message.reply(`✅ ${amount} ${type} ajoutés à ${count} membres du rôle ${roleMention.name}.`);
    }
  }
};
