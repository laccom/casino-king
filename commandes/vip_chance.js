module.exports = {
  name: 'chance',
  async execute(message, args, data, fs, dataFile) {
    // Vérifier permission admin
    if (!message.member.permissions.has('Administrator')) {
      return message.reply('❌ Tu n’as pas la permission d’utiliser cette commande.');
    }

    const guildId = message.guild.id;
    const chanceValue = parseFloat(args[0]);

    if (isNaN(chanceValue) || chanceValue < 0 || chanceValue > 100) {
      return message.reply('❌ Utilisation : `-chance {pourcentage entre 0 et 100}`');
    }

    // Initialisation si besoin
    if (!data[guildId]) data[guildId] = { users: {}, shop: {}, chance: 0.49 };
    data[guildId].chance = chanceValue / 100;

    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
    return message.reply(`✅ Chance réglée à **${chanceValue}%** pour ce serveur.`);
  }
};
