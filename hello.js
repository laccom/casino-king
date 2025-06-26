const { EmbedBuilder } = require('discord.js');

module.exports = async function sendHelloMessage(guild) {
  const systemChannel = guild.systemChannel || guild.channels.cache.find(c => c.type === 0 && c.permissionsFor(guild.members.me).has('SendMessages'));
  if (!systemChannel) return;

  const embed = new EmbedBuilder()
    .setColor(0x00AE86)
    .setTitle('👋 Bonjour !')
    .setDescription(`Merci de m'avoir ajouté sur **${guild.name}** !\n\nTapez \`-help\` pour voir mes commandes. **COMMENT ACTIVER LE CASINO :** tappez la commande **-categorie** dans un canal de la catégorie ou vous voudrez avoir le casino.`)
    .setImage('https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExNm1kcHphYXR4ZHA5ZXJjN3gyeGpnbml4ZHNuZHR1a3lmZjNqeTM5OCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/26uf2YTgF5upXUTm0/giphy.gif');

  await systemChannel.send({ embeds: [embed] }).catch(console.error);
};
