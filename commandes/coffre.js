const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

// Map de session en mémoire pour les cooldowns
const cooldowns = new Map();

module.exports = {
  name: 'coffre',
  description: 'Ouvre un coffre et tente de gagner des coins !',

  async execute(message, args, data, fs, dataFile) {
    const userId = message.author.id;
    const guildId = message.guild.id;
    const now = Date.now();

    // Cooldown de 1 heure (en millisecondes)
    const cooldown = 3_600_000;
    const userCooldown = cooldowns.get(userId);

    if (userCooldown && now - userCooldown < cooldown) {
      const timeLeft = cooldown - (now - userCooldown);
      const minutesLeft = Math.ceil(timeLeft / 60000);
      const timestamp = Math.floor((userCooldown + cooldown) / 1000);
      return message.reply(`⏳ Tu dois attendre encore **${minutesLeft} minute(s)** (<t:${timestamp}:R>) avant de pouvoir rejouer.`);
    }

    cooldowns.set(userId, now);

    const rewards = ['1000', '1000', '3000', 'perdu', 'perdu'];
    const shuffled = rewards.sort(() => Math.random() - 0.5);

    const embed = new EmbedBuilder()
      .setTitle('🎁 Choisis ton coffre !')
      .setDescription('Parmi ces 5 coffres, certains sont remplis de pièces... d\'autres sont vides.\nFais ton choix !')
      .setColor(0xFFD700)
      .setFooter({ text: 'Tu as 30 secondes pour choisir.' });

    const buttons = new ActionRowBuilder().addComponents(
      ...shuffled.map((_, i) =>
        new ButtonBuilder()
          .setCustomId(`coffre_${i}`)
          .setLabel(`Coffre ${i + 1}`)
          .setStyle(ButtonStyle.Primary)
      )
    );

    const sentMessage = await message.reply({ embeds: [embed], components: [buttons] });

    const collector = sentMessage.createMessageComponentCollector({
      filter: i => i.user.id === userId,
      time: 30_000,
      max: 1,
    });

    collector.on('collect', async interaction => {
      const index = parseInt(interaction.customId.split('_')[1], 10);
      const result = shuffled[index];

      let reply = '';
      if (result === 'perdu') {
        reply = '💥 **Raté !** Ce coffre était vide... Réessaie plus tard.';
      } else {
        reply = `💰 **Bravo !** Tu gagnes **${result} coins** !`;
        data[guildId].users[userId].coins += parseInt(result, 10);
        fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
      }

      await interaction.update({
        embeds: [
          new EmbedBuilder()
            .setTitle('🎁 Résultat du coffre')
            .setDescription(reply)
            .setColor(result === 'perdu' ? 0xFF0000 : 0x00FF00)
        ],
        components: [],
      });
    });

    collector.on('end', collected => {
      if (collected.size === 0) {
        sentMessage.edit({
          content: '⏱️ Temps écoulé, tu n’as pas ouvert de coffre.',
          components: [],
        });
        cooldowns.delete(userId); // Retire cooldown si aucun clic
      }
    });
  }
};
