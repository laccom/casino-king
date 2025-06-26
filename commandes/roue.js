const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'roue',
  async execute(message, args, data, fs, dataFile) {
    const userId = message.author.id;
    const guildId = message.guild.id;
    const userData = data[guildId].users[userId];
    const bet = parseInt(args[0]);

    if (isNaN(bet) || bet <= 0) {
      return message.reply('❌ Utilisation : `-roue montant` (ex : `-roue 100`)');
    }

    if (userData.coins < bet) {
      return message.reply('❌ Tu n’as pas assez de coins pour miser cette somme.');
    }

    const chanceLimit = data[guildId]?.chance ?? 0.49;
    const chance = Math.random();

    let resultEmbed;

    if (chance < chanceLimit) {
      userData.coins += bet;
      resultEmbed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle('🎉 Tu as gagné !')
        .setDescription(`Tu as misé **${bet} coins** et tu gagnes **${bet * 2} coins** ! 💰`);
    } else {
      userData.coins -= bet;
      resultEmbed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('💥 Tu as perdu...')
        .setDescription(`Tu as misé **${bet} coins** et tu les as perdus... 😢`);
    }

    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
    return message.channel.send({ embeds: [resultEmbed] });
  },
};
