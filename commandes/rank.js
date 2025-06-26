const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'rank',
  description: 'Affiche le top 10 des joueurs avec le plus de coins.',
  async execute(message, args, data) {
    const guildId = message.guild.id;
    const users = data[guildId]?.users || {};

    // Trier les utilisateurs par nombre de coins
    const sortedUsers = Object.entries(users)
      .sort(([, a], [, b]) => b.coins - a.coins)
      .slice(0, 10);

    if (sortedUsers.length === 0) {
      return message.reply('Aucun joueur enregistré sur ce serveur.');
    }

    const leaderboard = await Promise.all(sortedUsers.map(async ([userId, userData], index) => {
      const member = await message.guild.members.fetch(userId).catch(() => null);
      const username = member?.user?.username || `Utilisateur inconnu`;
      return `**${index + 1}.** ${username} — 💰 ${userData.coins} coins`;
    }));

    const embed = new EmbedBuilder()
      .setTitle('🏆 Top 10 des joueurs')
      .setDescription(leaderboard.join('\n'))
      .setColor('#FFD700')
      .setFooter({ text: 'Classement basé sur les coins.' })
      .setTimestamp();

    message.channel.send({ embeds: [embed] });
  }
};
