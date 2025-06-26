const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');

module.exports = {
  name: 'achat',
  async execute(message, args, data, fs, dataFile) {
    if (!message.member.permissions.has('Administrator')) {
      return message.reply('❌ Seuls les administrateurs peuvent utiliser cette commande.');
    }

    const target = message.mentions.users.first();
    if (!target) {
      return message.reply('❌ Utilisation : `-achat @utilisateur`');
    }

    const guildId = message.guild.id;
    const userId = target.id;

    if (!data[guildId] || !data[guildId].users[userId]) {
      return message.reply('❌ Utilisateur introuvable dans la base de données.');
    }

    const userData = data[guildId].users[userId];
    const gains = userData.gains;

    if (!gains || Object.keys(gains).length === 0) {
      const emptyEmbed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle(`📦 Achats de ${target.username}`)
        .setDescription('Cet utilisateur n’a rien acheté.');
      return message.channel.send({ embeds: [emptyEmbed] });
    }

    // Fonction pour créer l'embed affichant les produits et leur statut
    function createAchatEmbed() {
      const embed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle(`📦 Achats de ${target.username}`)
        .setDescription('Clique sur un bouton pour changer le statut "Récupéré".');

      for (const produit in gains) {
        const status = gains[produit]?.recupe ?? 'no';
        embed.addFields({
          name: produit,
          value: `Récupéré : **${status.toUpperCase()}**`,
          inline: false,
        });
      }
      return embed;
    }

    // Création des boutons pour chaque produit
    const buttons = new ActionRowBuilder();
    let count = 0;
    for (const produit in gains) {
      if (count === 5) break; // Discord limite à 5 boutons par rangée
      buttons.addComponents(
        new ButtonBuilder()
          .setCustomId(`toggle_recupe_${produit}`)
          .setLabel(produit.length > 80 ? produit.slice(0, 77) + '...' : produit)
          .setStyle(ButtonStyle.Primary)
      );
      count++;
    }

    const achatEmbed = createAchatEmbed();

    const sentMessage = await message.channel.send({ embeds: [achatEmbed], components: [buttons] });

    // Collecteur pour gérer les clics sur les boutons
    const collector = sentMessage.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 120000, // 2 minutes
      filter: i => i.user.id === message.author.id,
    });

    collector.on('collect', async interaction => {
      const customId = interaction.customId;
      if (!customId.startsWith('toggle_recupe_')) return;

      const produit = customId.slice('toggle_recupe_'.length);

      if (!gains[produit]) {
        return interaction.reply({ content: '❌ Produit introuvable.', ephemeral: true });
      }

      // Toggle entre "yes" et "no"
      gains[produit].recupe = gains[produit].recupe === 'yes' ? 'no' : 'yes';

      // Sauvegarde
      try {
        fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
      } catch (err) {
        console.error('Erreur sauvegarde data.json:', err);
        return interaction.reply({ content: '❌ Impossible de sauvegarder les changements.', ephemeral: true });
      }

      // Met à jour l'embed
      const newEmbed = createAchatEmbed();
      await interaction.update({ embeds: [newEmbed] });
    });

    collector.on('end', () => {
      if (sentMessage.editable) {
        sentMessage.edit({ components: [] }).catch(() => {});
      }
    });
  }
};
