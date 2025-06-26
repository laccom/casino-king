const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  name: 'infosservers',
  description: 'Affiche l’icône, le nom et les coins totaux d’un serveur via son ID (admin uniquement).',
  async execute(message, args) {
    if (message.author.id !== '1254454375221559361') {
      return message.reply('❌ Tu n’as pas la permission d’utiliser cette commande.');
    }

    const serverId = args[0];
    if (!serverId) {
      return message.reply('❌ Utilisation : `-infosservers {idServeur}`');
    }

    const dataFile = path.join(__dirname, '../data.json');
    if (!fs.existsSync(dataFile)) {
      return message.reply('❌ Le fichier `data.json` est introuvable.');
    }

    const data = JSON.parse(fs.readFileSync(dataFile));
    if (!data[serverId]) {
      return message.reply('❌ Ce serveur n’existe pas dans `data.json`.');
    }

    const guild = message.client.guilds.cache.get(serverId);
    const serverName = guild ? guild.name : `Serveur inconnu (${serverId})`;
    const iconURL = guild?.iconURL({ dynamic: true, size: 1024 }) || null;

    const users = data[serverId].users || {};
    const totalCoins = Object.values(users).reduce((acc, u) => acc + (u.coins || 0), 0);

    const embed = new EmbedBuilder()
      .setTitle(`📡 ${serverName}`)
      .setColor('#2ECC71')
      .setThumbnail(iconURL)
      .addFields({ name: '💰 Coins totaux', value: `${totalCoins}`, inline: true })
      .setFooter({ text: `ID serveur : ${serverId}` })
      .setTimestamp();

    message.channel.send({ embeds: [embed] });
  }
};
