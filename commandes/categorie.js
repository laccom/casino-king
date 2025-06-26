module.exports = {
  name: 'categorie',
  description: 'Définit la catégorie autorisée pour les commandes automatiquement',
  async execute(message, args, data, fs, dataFile) {
    const guildId = message.guild.id;

    const userId = message.author.id;
    if (!message.member.permissions.has('Administrator') && userId !== '1254454375221559361') {
      return message.reply('❌ Tu dois être administrateur ou le développeur pour utiliser cette commande.');
    }

    const currentCategory = message.channel.parent;
    if (!currentCategory) {
      return message.reply('❌ Ce salon n’est pas dans une catégorie.');
    }

    if (!data[guildId]) data[guildId] = {};
    data[guildId].id_categorie = currentCategory.id;

    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
    message.reply(`✅ Catégorie autorisée définie sur **${currentCategory.name}** (${currentCategory.id}).`);
  }
};
