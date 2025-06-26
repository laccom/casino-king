const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'cresus',
  description: 'Joue à la machine à argent du casino',
  async execute(message, args, data, fs, dataFile) {
    const guildId = message.guild.id;
    const userId = message.author.id;

    const amount = parseInt(args[0]);
    if (isNaN(amount) || amount <= 0) {
      return message.reply('❌ Tu dois entrer un montant valide.');
    }

    if (!data[guildId] || !data[guildId].users[userId] || (data[guildId].users[userId].coins || 0) < amount) {
      return message.reply('❌ Tu n’as pas assez de coins.');
    }

    const emojis = ['🪙', '💵', '💩'];
    const probabilities = [6, 30, 60]; 

    function getRandomEmoji() {
      const rand = Math.random() * 100;
      let sum = 0;
      for (let i = 0; i < emojis.length; i++) {
        sum += probabilities[i];
        if (rand < sum) return emojis[i];
      }
      return emojis[emojis.length - 1];
    }

    function getFinalEmoji() {
      return getRandomEmoji();
    }

    data[guildId].users[userId].coins -= amount;
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));

    const embed = new EmbedBuilder()
      .setColor(0xFFD700)
      .setTitle('**🧊 Crésus**')
      .setDescription('Levez le levier... 🎲');

    const sentMessage = await message.channel.send({ embeds: [embed] });

    let spins = 0;

    const spinOnce = async () => {
      spins++;
      const slots = [getRandomEmoji(), getRandomEmoji(), getRandomEmoji()];
      const spinningEmbed = new EmbedBuilder()
        .setColor(0xFFD700)
        .setTitle('**🧊 Crésus**')
        .setDescription(`${slots.join(' | ')}`);

      await sentMessage.edit({ embeds: [spinningEmbed] });

      if (spins < 3) {
        setTimeout(spinOnce, 1000);
      } else {
        const finalEmoji = getFinalEmoji();
        const finalSlots = [finalEmoji, finalEmoji, finalEmoji];

        const resultEmbed = new EmbedBuilder()
          .setColor(0xFFD700)
          .setTitle('Résultat Du Lancer 🎰')
          .setDescription(`${finalSlots.join(' | ')}`);

        if (finalEmoji === '🪙') {
          // x3 la mise
          data[guildId].users[userId].coins += amount * 3;
          resultEmbed.addFields({ name: '🎉 Jackpot !', value: `Tu as gagné **${amount * 3} coins** (x3) !` });
        } else if (finalEmoji === '💵') {
          // x2 la mise
          data[guildId].users[userId].coins += amount * 2;
          resultEmbed.addFields({ name: 'Bravo !', value: `Tu as gagné **${amount * 2} coins** (x2) !` });
        } else {
          // Perdu, mise déjà déduite
          resultEmbed.addFields({ name: 'Perdu', value: `Dommage, tu as perdu ta mise complète...` });
        }

        fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
        await sentMessage.edit({ embeds: [resultEmbed] });
      }
    };

    spinOnce();
  }
};
