const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');

module.exports = {
  name: 'shop',
  async execute(message, args, data, fs, dataFile) {
    const userId = message.author.id;
    const guildId = message.guild.id;
    const userData = data[guildId].users[userId];

    const guildShop = data[guildId].shop || { products: [] };

    // Affichage boutique
    const embed = new EmbedBuilder()
      .setColor(0x00AEFF)
      .setTitle('🛒 Boutique')
      .setDescription(`🎟️ **Tirages actuels :** ${userData.tirage} | 💰 **Coins actuels :** ${userData.coins}`);

    if (guildShop.products.length === 0) {
      embed.addFields({ name: 'Aucun produit disponible', value: 'Le shop est vide pour ce serveur.' });
      return message.channel.send({ embeds: [embed] });
    }

    for (const product of guildShop.products) {
      embed.addFields({ 
        name: product.name, 
        value: `🎟️ ${product.tirages ?? 'N/A'} tirages | 💰 ${product.coins ?? 'N/A'} coins`, 
        inline: false 
      });
    }

    const options = guildShop.products.map((product, i) => ({
      label: product.name,
      value: `buy_${i}`,
    }));

    const menu = new StringSelectMenuBuilder()
      .setCustomId('shop_select')
      .setPlaceholder('Choisis un produit')
      .addOptions(options);

    const row = new ActionRowBuilder().addComponents(menu);

    const shopMessage = await message.channel.send({ embeds: [embed], components: [row] });

    const filter = i => i.user.id === userId && i.customId === 'shop_select';
    const collector = shopMessage.createMessageComponentCollector({ filter, componentType: ComponentType.StringSelect, time: 60000 });

    collector.on('collect', async interaction => {
      await interaction.deferUpdate();
      const choice = interaction.values[0]; // buy_{index}
      const index = parseInt(choice.split('_')[1]);
      const product = guildShop.products[index];
      if (!product) return interaction.followUp({ content: '❌ Produit invalide.', ephemeral: true });

      // On propose maintenant un choix paiement tirages ou coins
      const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`pay_tirages_${index}`)
          .setLabel(`Payer avec tirages (${product.tirages ?? 'N/A'})`)
          .setStyle(ButtonStyle.Primary)
          .setDisabled(product.tirages == null),
        new ButtonBuilder()
          .setCustomId(`pay_coins_${index}`)
          .setLabel(`Payer avec coins (${product.coins ?? 'N/A'})`)
          .setStyle(ButtonStyle.Success)
          .setDisabled(product.coins == null),
      );

      await interaction.editReply({ content: `Choisis le mode de paiement pour **${product.name}** :`, components: [buttons] });
    });

    collector.on('end', () => {
      if (shopMessage.editable) shopMessage.edit({ components: [] }).catch(() => {});
    });

    // Création d'un autre collector pour les boutons de paiement
    const paymentFilter = i => i.user.id === userId && (i.customId.startsWith('pay_tirages_') || i.customId.startsWith('pay_coins_'));
    const paymentCollector = shopMessage.createMessageComponentCollector({ filter: paymentFilter, componentType: ComponentType.Button, time: 60000 });

    paymentCollector.on('collect', async interaction => {
      await interaction.deferUpdate();

      const [_, method, indexStr] = interaction.customId.split('_');
      const index = parseInt(indexStr);
      const product = guildShop.products[index];
      if (!product) return interaction.followUp({ content: '❌ Produit invalide.', ephemeral: true });

      if (method === 'tirages') {
        if (userData.tirage < product.tirages) {
          return interaction.followUp({ content: '❌ Pas assez de tirages.', ephemeral: true });
        }
        userData.tirage -= product.tirages;
      } else if (method === 'coins') {
        if (userData.coins < product.coins) {
          return interaction.followUp({ content: '❌ Pas assez de coins.', ephemeral: true });
        }
        userData.coins -= product.coins;
      } else {
        return interaction.followUp({ content: '❌ Méthode de paiement invalide.', ephemeral: true });
      }

      if (!userData.gains[product.name]) {
        userData.gains[product.name] = [];
      }
      userData.gains[product.name].push({ recupe: "no" });

      fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));

      const success = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle('🛒 Achat réussi !')
        .setDescription(`✅ Tu as acheté **${product.name}** pour ${method === 'tirages' ? product.tirages + ' tirages' : product.coins + ' coins'}. Récupérer la récompense en ticket.`);

      await interaction.editReply({ embeds: [success], components: [] });
      paymentCollector.stop();
      collector.stop();
    });

    paymentCollector.on('end', () => {
      if (shopMessage.editable) shopMessage.edit({ components: [] }).catch(() => {});
    });
  },
};
