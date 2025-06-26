const fs = require('fs');
const dataFile = './data.json';

module.exports = {
  name: 'product',
  description: 'Ajouter un produit au shop du serveur (admin only)',
  async execute(message, args, data) {
    if (!message.member.permissions.has('Administrator')) {
      return message.reply('❌ Tu dois être administrateur pour utiliser cette commande.');
    }

    const guildId = message.guild.id;
    const tirages = parseInt(args[0]);
    const coins = parseInt(args[1]);
    const productName = args.slice(2).join(' ');

    if (isNaN(tirages) || tirages < 0) {
      return message.reply('❌ Le nombre de tirages doit être un entier positif ou zéro.');
    }

    if (isNaN(coins) || coins <= 0) {
      return message.reply('❌ Le nombre de coins doit être un entier strictement positif.');
    }

    if (!productName) {
      return message.reply('❌ Utilisation : `-product {tirages} {coins} {nom du produit}`');
    }

    // Initialisation solide de la structure data pour éviter les erreurs
    if (!data[guildId]) data[guildId] = {};
    if (!data[guildId].shop) data[guildId].shop = {};
    if (!data[guildId].shop.products) data[guildId].shop.products = [];

    data[guildId].shop.products.push({ tirages, coins, name: productName });

    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));

    return message.reply(`✅ Produit ajouté : ${tirages} tirages, ${coins} coins - "${productName}"`);
  }
};
