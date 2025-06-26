const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');

module.exports = {
  name: 'convert',
  description: 'Convertir coins en tirages ou tirages en coins (1 tirage = 1000 coins).',
  async execute(message, args, data, fs, dataFile) {
    const userId = message.author.id;
    const guildId = message.guild.id;
    const userData = data[guildId].users[userId];

    const amount = parseInt(args[0]);
    if (isNaN(amount) || amount <= 0) {
      return message.reply('❌ Utilisation : `-convert {nombre}` où nombre est un entier positif.');
    }

    const embed = new EmbedBuilder()
      .setColor(0x0099FF)
      .setTitle('💱 Conversion coins et tirages')
      .setDescription(`Tu veux convertir **${amount}**.`)
      .addFields(
        { name: 'Conversion 1', value: `Transférer **${amount}** coins en tirages (1000 coins = 1 tirage).` },
        { name: 'Conversion 2', value: `Transférer **${amount}** tirages en coins (1 tirage = 1000 coins).` },
        { name: 'Ton solde', value: `Coins: ${userData.coins}\nTirages: ${userData.tirage}` }
      );

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('coins_to_tirages')
          .setLabel(`Convertir ${amount} coins en tirages`)
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('tirages_to_coins')
          .setLabel(`Convertir ${amount} tirages en coins`)
          .setStyle(ButtonStyle.Secondary),
      );

    const msg = await message.channel.send({ embeds: [embed], components: [row] });

    const filter = i => i.user.id === userId;
    const collector = msg.createMessageComponentCollector({ filter, componentType: ComponentType.Button, time: 30000 });

    collector.on('collect', async interaction => {
      await interaction.deferUpdate();

      if (interaction.customId === 'coins_to_tirages') {
        if (userData.coins < amount) {
          return interaction.followUp({ content: '❌ Tu n\'as pas assez de coins.', ephemeral: true });
        }
        const tiragesGagnes = Math.floor(amount / 1000);
        if (tiragesGagnes < 1) {
          return interaction.followUp({ content: '❌ Tu dois convertir au moins 1000 coins pour obtenir 1 tirage.', ephemeral: true });
        }
        userData.coins -= tiragesGagnes * 1000;
        userData.tirage += tiragesGagnes;

        fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));

        return interaction.followUp({ content: `✅ Tu as converti ${tiragesGagnes * 1000} coins en ${tiragesGagnes} tirage(s).`, ephemeral: true });
      }

      if (interaction.customId === 'tirages_to_coins') {
        if (userData.tirage < amount) {
          return interaction.followUp({ content: '❌ Tu n\'as pas assez de tirages.', ephemeral: true });
        }
        const coinsGagnes = amount * 1000;
        userData.tirage -= amount;
        userData.coins += coinsGagnes;

        fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));

        return interaction.followUp({ content: `✅ Tu as converti ${amount} tirages en ${coinsGagnes} coins.`, ephemeral: true });
      }
    });

    collector.on('end', () => {
      if (msg.editable) {
        const disabledRow = new ActionRowBuilder()
          .addComponents(
            row.components.map(btn => btn.setDisabled(true))
          );
        msg.edit({ components: [disabledRow] }).catch(() => {});
      }
    });
  },
};
