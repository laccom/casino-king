const { PermissionsBitField } = require('discord.js');

module.exports = {
  name: 'sup',
  description: 'Supprime les 100 derniers messages du bot en MP uniquement.',
  async execute(message, args) {
    if (message.guild) {
      return message.reply('❌ Cette commande ne fonctionne qu’en message privé.');
    }

    // Récupérer les 100 derniers messages dans le DM
    const messages = await message.channel.messages.fetch({ limit: 100 });

    // Filtrer les messages envoyés par le bot
    const botMessages = messages.filter(msg => msg.author.id === message.client.user.id);

    try {
      // Supprimer chaque message un par un (bulkDelete ne marche pas sur DM)
      for (const msg of botMessages.values()) {
        await msg.delete();
      }

      await message.channel.send('✅ Les messages du bot ont été supprimés.');
    } catch (error) {
      console.error('Erreur suppression messages :', error);
      await message.channel.send('❌ Une erreur est survenue lors de la suppression.');
    }
  }
};
