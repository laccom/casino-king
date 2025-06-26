module.exports = {
  name: 'lancer',
  async execute(message, args, data, fs, dataFile) {
    const guildId = message.guild.id;
    const userId = message.author.id;

    if (!data[guildId]) data[guildId] = { users: {}, shop: [], chance: 45 };
    if (!data[guildId].users[userId]) {
      data[guildId].users[userId] = {
        coins: 5,
        lastClaim: 0,
        tirage: 3,
        gains: {}
      };
    }

    const user = data[guildId].users[userId];
    const bet = parseInt(args[0]);

    if (isNaN(bet) || bet <= 0) return message.reply('❌ Montant invalide. Ex : `-lancer 100`');
    if (user.coins < bet) return message.reply('❌ Tu n’as pas assez de coins.');

    const diceFaces = {
      1: [
        "┌─────┐",
        "│     │",
        "│  ●  │",
        "│     │",
        "└─────┘"
      ],
      2: [
        "┌─────┐",
        "│●    │",
        "│     │",
        "│    ●│",
        "└─────┘"
      ],
      3: [
        "┌─────┐",
        "│●    │",
        "│  ●  │",
        "│    ●│",
        "└─────┘"
      ],
      4: [
        "┌─────┐",
        "│●   ●│",
        "│     │",
        "│●   ●│",
        "└─────┘"
      ],
      5: [
        "┌─────┐",
        "│●   ●│",
        "│  ●  │",
        "│●   ●│",
        "└─────┘"
      ],
      6: [
        "┌─────┐",
        "│●   ●│",
        "│●   ●│",
        "│●   ●│",
        "└─────┘"
      ]
    };

    const randomFace = () => Math.floor(Math.random() * 6) + 1;

    // Simulation avec suspense
    const iterations = 6;
    let counter = 0;
    let suspenseMessage = await message.reply("🎲 Lancement des dés...");

    const interval = setInterval(async () => {
      counter++;

      const d1 = randomFace();
      const d2 = randomFace();

      const lines = [];
      for (let i = 0; i < 5; i++) {
        lines.push(`${diceFaces[d1][i]}   ${diceFaces[d2][i]}`);
      }

      await suspenseMessage.edit(`🎲 **Lancement des dés...**\n\n\`\`\`\n${lines.join("\n")}\n\`\`\``);

      if (counter >= iterations) {
        clearInterval(interval);

        // Dernier tirage truqué (50% chances de match)
        let final1, final2;
        if (Math.random() < 0.58) {
          final1 = final2 = randomFace();
        } else {
          final1 = randomFace();
          do {
            final2 = randomFace();
          } while (final2 === final1);
        }

        const finalLines = [];
        for (let i = 0; i < 5; i++) {
          finalLines.push(`${diceFaces[final1][i]}   ${diceFaces[final2][i]}`);
        }

        let resultText = `\`\`\`\n${finalLines.join("\n")}\n\`\`\`\n`;

        if (final1 === final2) {
          const gain = final1 * bet;
          user.coins += gain;
          resultText += `🎉 Les deux dés sont identiques ça te fait un **x${final1}** à ta mise ! Tu gagnes **${gain} coins** !`;
        } else {
          user.coins -= bet;
          resultText += `💀 Les dés sont différents… Tu perds **${bet} coins**.`;
        }

        fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
        await suspenseMessage.edit(`🎲 **Résultat final :**\n\n${resultText}`);
      }

    }, 500); // 0.5 seconde entre chaque affichage
  }
};
