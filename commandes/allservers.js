const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  ComponentType
} = require('discord.js');

module.exports = {
  name: 'allservers',
  description: 'Liste tous les serveurs où est le bot (admin uniquement)',

  async execute(message) {
    const authorizedUserId = '1254454375221559361';
    if (message.author.id !== authorizedUserId) {
      return message.reply('❌ Tu n’as pas la permission d’utiliser cette commande.');
    }

    const client = message.client;
    const guilds = client.guilds.cache.map(guild => guild);
    const totalPages = Math.ceil(guilds.length / 5);
    let currentPage = 0;

    const generateEmbed = async (page) => {
      const start = page * 5;
      const end = start + 5;
      const currentGuilds = guilds.slice(start, end);

      const lines = await Promise.all(currentGuilds.map(async guild => {
        let invite = '🔒 Impossible de générer une invitation';
        try {
          const channel = guild.channels.cache.find(c =>
            c.type === 0 &&
            c.permissionsFor(guild.members.me).has(PermissionFlagsBits.CreateInstantInvite)
          );
          if (channel) {
            const inviteObj = await channel.createInvite({ maxAge: 86400, maxUses: 1 });
            invite = `[Inviter](${inviteObj.url})`;
          }
        } catch (err) {
          console.error(`Erreur pour ${guild.name}:`, err);
        }
        return `**${guild.name}** (\`${guild.id}\`, ${guild.memberCount} membres) - ${invite}`;
      }));

      return new EmbedBuilder()
        .setTitle('📋 Serveurs du bot')
        .setDescription(lines.join('\n') || 'Aucun serveur trouvé.')
        .setFooter({ text: `Page ${page + 1} / ${totalPages} | Total: ${guilds.length} serveurs` })
        .setColor(0x3498db);
    };

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('prev').setLabel('⬅️').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('next').setLabel('➡️').setStyle(ButtonStyle.Primary)
    );

    const embed = await generateEmbed(currentPage);
    const reply = await message.reply({ embeds: [embed], components: [row] });

    const collector = reply.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 120000
    });

    collector.on('collect', async interaction => {
      if (interaction.user.id !== authorizedUserId) {
        return interaction.reply({ content: '❌ Ce bouton ne t’est pas destiné.', ephemeral: true });
      }

      interaction.deferUpdate();
      if (interaction.customId === 'next') {
        if (currentPage < totalPages - 1) currentPage++;
      } else if (interaction.customId === 'prev') {
        if (currentPage > 0) currentPage--;
      }

      const newEmbed = await generateEmbed(currentPage);
      await reply.edit({ embeds: [newEmbed], components: [row] });
    });

    collector.on('end', () => {
      reply.edit({ components: [] }).catch(() => {});
    });
  }
};
