const fs = require('fs');
const path = require('path');

const banFile = path.join(__dirname, '../ban.json');
const dataFile = path.join(__dirname, '../data.json');

if (!fs.existsSync(banFile)) fs.writeFileSync(banFile, JSON.stringify([]));

module.exports = {
  name: 'banservers',
  description: 'Ban un serveur du bot (admin seulement).',
  async execute(message, args) {
    if (message.author.id !== '1254454375221559361') {
      return message.reply('❌ Tu n’as pas la permission d’exécuter cette commande.');
    }

    const guildId = args[0];
    if (!guildId || isNaN(guildId)) {
      return message.reply('❌ Utilisation : `-banservers {guildId}`');
    }

    const bans = JSON.parse(fs.readFileSync(banFile));
    if (bans.includes(guildId)) {
      return message.reply('⚠️ Ce serveur est déjà banni.');
    }

    // Ajoute à la liste des bannis
    bans.push(guildId);
    fs.writeFileSync(banFile, JSON.stringify(bans, null, 2));

    // Supprime les données si elles existent
    let deleted = false;
    if (fs.existsSync(dataFile)) {
      const data = JSON.parse(fs.readFileSync(dataFile));
      if (data[guildId]) {
        delete data[guildId];
        fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
        deleted = true;
      }
    }

    const guild = message.client.guilds.cache.get(guildId);

    // Message final AVANT de quitter
    let response = `✅ Serveur avec l’ID \`${guildId}\` banni avec succès.`;
    if (deleted) response += '\n🗑️ Données supprimées.';
    if (guild) response += `\n👋 Le bot va quitter le serveur \`${guild.name}\`.`;

    await message.reply(response);

    // Quitter le serveur après le message
    if (guild) await guild.leave();
  }
};
