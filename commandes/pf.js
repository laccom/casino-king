const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'pf',
  description: 'Parie sur pile ou face ! Si tu gagnes, tu gagnes x3 ta mise.',
  async execute(message, args, data, fs, dataFile) {
    const userId = message.author.id;
    const guildId = message.guild.id;

    // Vérifications de base
    if (!args[0] || !['pile', 'face'].includes(args[0].toLowerCase())) {
      return message.reply('❌ Utilisation : `-pf pile 100` ou `-pileface face 50`');
    }

    const choix = args[0].toLowerCase();
    const mise = parseInt(args[1]);

    if (isNaN(mise) || mise <= 0) {
      return message.reply('❌ Tu dois miser un nombre valide de coins.');
    }

    const userData = data[guildId].users[userId];

    if (userData.coins < mise) {
      return message.reply('❌ Tu n’as pas assez de coins pour cette mise.');
    }

    // Envoie du GIF pour le suspense
    const suspenseEmbed = new EmbedBuilder()
      .setTitle('🪙 Pile ou Face...')
      .setImage('https://media.tenor.com/bvOIpP10B5kAAAAj/eth-ethere.gif')
      .setColor(0x5865F2);

    await message.reply({ embeds: [suspenseEmbed] });

    // Petite pause pour le suspense (2.5 sec)
    await new Promise(resolve => setTimeout(resolve, 2500));

    // Résultat aléatoire
    const resultat = Math.random() < 0.5 ? 'pile' : 'face';

    let resultEmbed = new EmbedBuilder().setColor(0x2ecc71);

    if (choix === resultat) {
      const gain = mise * 3;
      userData.coins += gain;
      resultEmbed
        .setTitle('🎉 Gagné !')
        .setDescription(`C'était **${resultat}** ! Tu remportes **+${gain} coins** 💰`);
    } else {
      userData.coins -= mise;
      resultEmbed
        .setTitle('😢 Perdu !')
        .setDescription(`C'était **${resultat}**. Tu perds **-${mise} coins**.`);
    }

    await message.channel.send({ embeds: [resultEmbed] });

    // Sauvegarde des données
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
  }
};
