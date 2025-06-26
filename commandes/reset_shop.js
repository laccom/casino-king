const fs = require('fs');

module.exports = {
  name: 'reset_shop',
  description: '*(Admin)* Supprime tous les produits du shop du serveur.',
  async execute(message, args, data, fs, dataFile) {
    if (!message.member.permissions.has('Administrator')) {
      return message.reply('❌ Tu dois être administrateur pour utiliser cette commande.');
    }

    const guildId = message.guild.id;

    // Initialisation structure si besoin
    if (!data[guildId]) data[guildId] = {};
    if (!data[guildId].shop) data[guildId].shop = {};
    
    // Supprimer tous les produits
    data[guildId].shop.products = [];

    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));

    return message.reply('✅ Tous les produits du shop ont été supprimés.');
  }
};
