const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const giveawayPath = path.join(__dirname, '../giveaway.json');
if (!fs.existsSync(giveawayPath)) fs.writeFileSync(giveawayPath, '{}');

module.exports = {
  name: 'giveaway',
  description: 'Lance un giveaway avec une somme et une durée (admin seulement)',
  async execute(message, args, data, fs, dataFile) {
    if (!message.member.permissions.has('Administrator')) {
      return message.reply('❌ Seuls les administrateurs peuvent lancer un giveaway.');
    }

    const amount = parseInt(args[0], 10);
    const durationArg = args[1];
    const durationMatch = /^(\d+)([mhdj])$/.exec(durationArg); // Ajout du 'j'

    if (!amount || !durationMatch) {
      return message.reply('❌ Utilisation : `-giveaway {somme} {durée ex: 10m, 2h, 1j}``');
    }

    const duration = parseInt(durationMatch[1]);
    const unit = durationMatch[2];

    let durationMs;
    switch (unit) {
      case 'm': durationMs = duration * 60 * 1000; break;
      case 'h': durationMs = duration * 60 * 60 * 1000; break;
      case 'd': // Supporte aussi 'd' pour "day" au cas où
      case 'j': durationMs = duration * 24 * 60 * 60 * 1000; break;
      default:
        return message.reply('❌ Unité de temps invalide. Utilise `m`, `h` ou `j`.');
    }

    const endTime = Date.now() + durationMs;

    const embed = new EmbedBuilder()
      .setTitle('🎉 Giveaway en cours !')
      .setDescription(`Réagis avec 🎉 pour participer et tente de gagner **${amount} coins** !`)
      .addFields({ name: 'Fin du concours', value: `<t:${Math.floor(endTime / 1000)}:R>` })
      .setColor(0xF1C40F)
      .setTimestamp();

    const giveawayMessage = await message.channel.send({ embeds: [embed] });
    await giveawayMessage.react('🎉');

    const giveaways = JSON.parse(fs.readFileSync(giveawayPath));
    giveaways[giveawayMessage.id] = {
      guildId: message.guild.id,
      channelId: message.channel.id,
      messageId: giveawayMessage.id,
      amount,
      endTime,
    };

    fs.writeFileSync(giveawayPath, JSON.stringify(giveaways, null, 2));
  }
};
