const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');

const pages = {
  main: {
    title: '📜 **Commandes disponibles**',
    description: 'Bienvenue au Casino ! Utilise les boutons ci-dessous pour naviguer entre les catégories.',
    fields: [
      { name: '🎲 Jeux & Profils', value: 'Voir les commandes liées aux jeux et à ton profil.' },
      { name: '🛒 Gestion du Shop', value: 'Voir les commandes pour gérer la boutique.' },
      { name: '⚙️ Administration', value: 'Commandes réservées aux administrateurs.' },
      { name: '🔄 Conversion', value: 'Convertir coins et tirages.' },
    ],
    color: '#5865F2',
    thumbnail: 'https://cdn.discordapp.com/app-icons/1374435663893626991/94fd1924e4a019739997bb66113ea6d3.png?size=512',
  },

  jeux: {
    title: '🎲 Jeux & Profils',
    description: [
      '`-profile` — Voir ton profil ou un autre utilisateur en le mentionnant à coté de la commande (coins, tirages, gains)',
      '`-shop` — Ouvre la boutique (tirages ou coins)',
      '`-claim` — Réclamer tes coins quotidiens (5 coins)',
      '`-trade {@user} {montant}` — Échanger des coins avec un autre joueur',
      '`-roue {montant}` — Jouer à la roue de la fortune',
      '`-cresus {montant}` — Machine à sous (🎰 triple emojis)',
      '`-nr {montant}` — Jeu rouge ou Noir mise une somme puis x4 si tu gagnes, sinon tu perds tout',
      '`-lancer {montant}` — Lancer 2 dés et essayer de gagner',
      '`-coffre` — Choisis 1 des 5 coffres, certains cachent jusqu’à 1000 coins 💰',
      '`-pf {pile|face} {mise}` — Pile ou face avec un gain x3 si tu gagnes',
      '`-rank` — Voir le classement des 10 meilleurs joueurs du serveur',
    ].join('\n'),
    color: '#57F287',
  },

  shop: {
    title: '🛒 Gestion du Shop',
    description: [
      '`-product {tirages} {coins} {nom}` — *(Admin)* Ajouter un produit',
      '`-reset_shop` — *(Admin)* Supprimer tous les produits',
      '`-achat {@user}` — *(Admin)* Voir les achats d’un utilisateur',
    ].join('\n'),
    color: '#FAA61A',
  },

  admin: {
    title: '⚙️ Administration',
    description: [
      '`-add {@user} {coins|tirage} {nombre}` — *(Admin)* Ajouter des coins/tirages',
      '`-del {@user} {coins|tirage} {nombre}` — *(Admin)* Retirer des coins/tirages',
      '`-chance {pourcentage}` — *(Admin)* Modifier la chance de gagner à la roue',
      '`-giveaway {somme} {durée (ex: 120m , 1h , 1j) }` — *(Admin)* Lancer un concours avec une récompense en coins **valeurs temps :** m = Minute(s) **|** h = Heure(s) **|** j = Jour(s)',
    ].join('\n'),
    color: '#ED4245',
  },

  convert: {
    title: '🔄 Conversion',
    description: '`-convert {nombre}` — Convertir coins ↔ tirages (1000 coins = 1 tirage)',
    color: '#7289DA',
  }
};

function createEmbed(pageKey) {
  const page = pages[pageKey];
  const embed = new EmbedBuilder()
    .setTitle(page.title)
    .setColor(page.color)
    .setTimestamp();

  if (page.thumbnail) embed.setThumbnail(page.thumbnail);
  if (page.description) embed.setDescription(page.description);
  if (page.fields) embed.addFields(page.fields);

  embed.setFooter({ 
    text: '🎰 Comptoir Casino • Amuse-toi bien !', 
    iconURL: 'https://cdn.discordapp.com/app-icons/1374435663893626991/94fd1924e4a019739997bb66113ea6d3.png?size=512' 
  });

  return embed;
}

function createButtons(activePage) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('help_main')
      .setLabel('Accueil')
      .setStyle(activePage === 'main' ? ButtonStyle.Primary : ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId('help_jeux')
      .setLabel('Jeux & Profils')
      .setStyle(activePage === 'jeux' ? ButtonStyle.Primary : ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId('help_shop')
      .setLabel('Gestion du Shop')
      .setStyle(activePage === 'shop' ? ButtonStyle.Primary : ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId('help_admin')
      .setLabel('Administration')
      .setStyle(activePage === 'admin' ? ButtonStyle.Primary : ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId('help_convert')
      .setLabel('Conversion')
      .setStyle(activePage === 'convert' ? ButtonStyle.Primary : ButtonStyle.Secondary),
  );
}

module.exports = {
  name: 'help',
  description: 'Affiche la liste des commandes disponibles.',
  async execute(message) {
    const userId = message.author.id;

    const embed = createEmbed('main');
    const row = createButtons('main');

    const helpMessage = await message.channel.send({ embeds: [embed], components: [row] });

    const collector = helpMessage.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 120000,
      filter: i => i.user.id === userId,
    });

    collector.on('collect', async interaction => {
      const page = interaction.customId.split('_')[1]; // ex: help_shop => shop
      if (!pages[page]) return interaction.reply({ content: 'Page inconnue.', ephemeral: true });

      const newEmbed = createEmbed(page);
      const newRow = createButtons(page);

      await interaction.update({ embeds: [newEmbed], components: [newRow] });
    });

    collector.on('end', () => {
      if (helpMessage.editable) {
        helpMessage.edit({ components: [] }).catch(() => {});
      }
    });
  },
};
