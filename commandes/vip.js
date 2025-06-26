module.exports = {
  name: 'vip',
  description: 'Active le mode VIP sur un serveur (développeur uniquement)',
  async execute(message, args, data, fs, dataFile) {
    const ownerId = '1254454375221559361';

    if (message.author.id !== ownerId) {
      return message.reply('❌ Tu n’as pas la permission d’utiliser cette commande.');
    }

    const targetGuildId = args[0];
    if (!targetGuildId) {
      return message.reply('❌ Tu dois spécifier l’ID du serveur.');
    }

    // Vérifie si le bot est dans ce serveur
    const guild = message.client.guilds.cache.get(targetGuildId);
    if (!guild) {
      return message.reply('❌ Je ne suis pas dans ce serveur.');
    }

    // Active le VIP
    if (!data[targetGuildId]) {
      data[targetGuildId] = { users: {}, shop: { products: [] }, vip_actived: true };
    } else {
      data[targetGuildId].vip_actived = true;
    }

    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));

    message.reply(`✅ Le mode **VIP** est maintenant activé pour le serveur **${guild.name}** (${targetGuildId})`);
  }
};
