const { EmbedBuilder, PermissionsBitField, ChannelType, AllowedMentionsTypes } = require('discord.js');

module.exports = {
  name: 'annonce',
  async execute(message, args, data, fs, dataFile) {
    const ownerId = '1254454375221559361';
    if (message.author.id !== ownerId) {
      return message.reply('❌ Tu n’as pas la permission d’utiliser cette commande.');
    }

    await message.reply('🕒 Envoie maintenant ton message d’annonce. Tu as 3 minutes.');

    const filter = m => m.author.id === message.author.id;
    const collected = await message.channel.awaitMessages({ filter, max: 1, time: 3 * 60 * 1000 });

    if (collected.size === 0) {
      return message.reply('⏰ Temps écoulé. Aucun message d’annonce reçu.');
    }

    const announcement = collected.first().content;

    // On extrait les mentions dans une variable séparée
    const mentionLine = announcement.match(/<@&?\d+>|@everyone|@here/g)?.join(' ') || '';

    const embed = new EmbedBuilder()
      .setDescription(announcement)
      .setColor('#FFD700')
      .setFooter({ text: 'Casino Annonce', iconURL: message.client.user.displayAvatarURL() })
      .setTimestamp();

    let successCount = 0;
    for (const [guildId, config] of Object.entries(data)) {
      const guild = message.client.guilds.cache.get(guildId);
      if (!guild) continue;

      const categoryId = config.id_categorie;
      if (!categoryId) continue;

      const categoryChannels = guild.channels.cache
        .filter(ch => ch.parentId === categoryId && ch.type === ChannelType.GuildText)
        .sort((a, b) => a.rawPosition - b.rawPosition);

      const firstChannel = categoryChannels.find(ch =>
        ch.permissionsFor(guild.members.me)?.has(PermissionsBitField.Flags.SendMessages)
      );

      if (!firstChannel) continue;

      try {
        await firstChannel.send({
          content: mentionLine, // en dehors de l'embed
          embeds: [embed],
          allowedMentions: {
            parse: ['users', 'roles', 'everyone'] // permet les mentions
          }
        });
        successCount++;
      } catch (err) {
        console.warn(`❌ Erreur dans ${guild.name}:`, err.message);
      }
    }

    return message.reply(`✅ Annonce envoyée dans **${successCount}** serveur(s).`);
  }
};
