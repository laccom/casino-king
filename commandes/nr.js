const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');

module.exports = {
  name: 'nr',
  description: 'Jeu Rouge ou Noir. x4 si tu gagnes, sinon tu perds tout.',
  async execute(message, args, data, fs, dataFile) {
    const userId = message.author.id;
    const guildId = message.guild.id;

    const mise = parseInt(args[0], 10);
    if (isNaN(mise) || mise <= 0) {
      return message.reply('❌ Utilisation : `-nr {montant}`');
    }

    if (!data[guildId].users[userId]) {
      data[guildId].users[userId] = { coins: 5, lastClaim: 0, tirage: 3, gains: {} };
    }

    if (data[guildId].users[userId].coins < mise) {
      return message.reply('❌ Tu n’as pas assez de coins pour miser autant.');
    }

    const embed = new EmbedBuilder()
      .setTitle('🎲 Noir ou Rouge ?')
      .setDescription(`Choisis ta couleur ! Si tu gagnes, tu gagnes **x4** ta mise : \`${mise * 4} coins\``)
      .addFields({ name: '💰 Mise', value: `\`${mise} coins\`` })
      .setColor('#999999');

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('choix_noir')
        .setLabel('Noir')
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId('choix_rouge')
        .setLabel('Rouge')
        .setStyle(ButtonStyle.Danger)
    );

    const gameMessage = await message.reply({ embeds: [embed], components: [row] });

    const collector = gameMessage.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 15000,
      max: 1,
      filter: interaction => interaction.user.id === userId,
    });

    collector.on('collect', async interaction => {
      await interaction.deferUpdate();

      await gameMessage.edit({
        components: [],
        embeds: [
          new EmbedBuilder()
            .setTitle('**Lancement...**')
            .setImage('https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExN3B3OXl6Mmpia3Q5d2t3Y2hkdGc4bDAxZDZtNWpnZTA0Z2I4MXkybiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/1DEJwfwdknKZq/giphy.gif')
            .setColor('#2f3136')
        ]
      });

      await new Promise(resolve => setTimeout(resolve, 5000));

      const choixUtilisateur = interaction.customId === 'choix_noir' ? 'Noir' : 'Rouge';
      const gagnant = Math.random() < 0.5 ? 'Noir' : 'Rouge';
      const win = choixUtilisateur === gagnant;

      if (win) {
        data[guildId].users[userId].coins += mise * 4;
      } else {
        data[guildId].users[userId].coins -= mise;
      }

      fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));

      const resultEmbed = new EmbedBuilder()
        .setTitle('🎲 Résultat')
        .setDescription(
          win
            ? `✅ Tu as choisi **${choixUtilisateur}** et c'était **${gagnant}** ! Tu gagnes \`${mise * 4} coins\` !`
            : `❌ Tu as choisi **${choixUtilisateur}** mais c'était **${gagnant}**. Tu perds \`${mise} coins\`.`
        )
        .setImage(win
          ? 'https://cdn.discordapp.com/attachments/1375077399984865320/1376993078480470046/image0.gif?ex=6837583d&is=683606bd&hm=4cd8097b949dbf2270fd3d5b15cd6e2522827a67afcf8a6f7275ff8c238b2d48&'
          : 'https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExOTdhdTFpZHdoZnkzejR1MmljbG4wdzlsNzBybXpuejFieXJ2NHloOCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/755R55Nk79oWI/giphy.gif'
        )
        .setColor(win ? '#00FF00' : '#FF0000');

      await gameMessage.edit({ embeds: [resultEmbed] });
    });

    collector.on('end', collected => {
      if (collected.size === 0) {
        gameMessage.edit({
          components: [],
          embeds: [
            new EmbedBuilder()
              .setTitle('⏱️ Temps écoulé')
              .setDescription('Tu n’as pas cliqué à temps.')
              .setColor('#808080')
          ]
        });
      }
    });
  }
};
