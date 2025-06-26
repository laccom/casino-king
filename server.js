require('dotenv').config();
const fs = require('fs');
const path = require('path');
const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder,
  InteractionType,
  Partials
} = require('discord.js');

const status = require('./status');
const sendHelloMessage = require('./hello');
const { askGemini } = require('./ai'); // Gemini IA

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.DirectMessages
  ],
  partials: [Partials.Channel] // Pour accéder aux DMs partiels
});

const prefix = '-';
const dataFile = './data.json';
const giveawayFile = './giveaway.json';
const commandes = new Map();
const vipCommandFiles = new Set();

// Chargement des commandes
const commandsPath = path.join(__dirname, 'commandes');
fs.readdirSync(commandsPath).forEach(file => {
  if (file.endsWith('.js')) {
    const command = require(`./commandes/${file}`);
    commandes.set(command.name, command);
    if (file.startsWith('vip_')) vipCommandFiles.add(command.name);
  }
});

client.once('ready', async () => {
  status.setStatus(client);
  console.log(`✅ Bot connecté en tant que ${client.user.tag}`);

  const data = fs.existsSync(dataFile) ? JSON.parse(fs.readFileSync(dataFile)) : {};
  for (const [guildId] of client.guilds.cache) {
    if (!data[guildId]) {
      data[guildId] = { users: {}, shop: { products: [] }, vip_actived: false };
    }
  }
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));

  if (fs.existsSync(giveawayFile)) {
    const giveaways = JSON.parse(fs.readFileSync(giveawayFile));
    for (const [messageId, gw] of Object.entries(giveaways)) {
      const delay = gw.endTime - Date.now();
      if (delay <= 0) continue;

      setTimeout(async () => {
        const data = JSON.parse(fs.readFileSync(dataFile));
        const giveaways = JSON.parse(fs.readFileSync(giveawayFile));
        const guild = client.guilds.cache.get(gw.guildId);
        const channel = guild?.channels.cache.get(gw.channelId);
        const message = await channel?.messages.fetch(gw.messageId).catch(() => null);

        if (!channel || !message) {
          delete giveaways[messageId];
          return fs.writeFileSync(giveawayFile, JSON.stringify(giveaways, null, 2));
        }

        const users = await message.reactions.cache.get('🎉')?.users.fetch();
        const participants = users?.filter(u => !u.bot).map(u => u.id);

        if (!participants || participants.length === 0) {
          await channel.send('🎉 Giveaway terminé ! Aucun participant.');
        } else {
          const winnerId = participants[Math.floor(Math.random() * participants.length)];
          const winnerMention = `<@${winnerId}>`;
          if (!data[gw.guildId].users[winnerId]) {
            data[gw.guildId].users[winnerId] = { coins: 0, lastClaim: 0, tirage: 3, gains: {} };
          }
          data[gw.guildId].users[winnerId].coins += gw.amount;
          fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
          await channel.send(`🎉 Bravo ${winnerMention} ! Tu as gagné **${gw.amount} coins** !`);
        }

        delete giveaways[messageId];
        fs.writeFileSync(giveawayFile, JSON.stringify(giveaways, null, 2));
      }, delay);
    }
  }

  // Slash Command /clean-ai
  const slashCommands = [
    new SlashCommandBuilder()
      .setName('clean-ai')
      .setDescription("Supprime vos messages récents dans le salon actuel")
      .toJSON()
  ];

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  try {
    await rest.put(Routes.applicationCommands(client.user.id), { body: slashCommands });
    console.log('✅ Slash command "/clean-ai" enregistrée.');
  } catch (err) {
    console.error('❌ Erreur enregistrement slash command :', err);
  }
});

client.on('guildCreate', async (guild) => {
  const banFile = './ban.json';
  const banned = fs.existsSync(banFile) ? JSON.parse(fs.readFileSync(banFile)) : [];

  if (banned.includes(guild.id)) {
    console.log(`⛔ Serveur banni détecté (${guild.name}), quittant...`);
    return guild.leave();
  }

  const data = fs.existsSync(dataFile) ? JSON.parse(fs.readFileSync(dataFile)) : {};
  if (!data[guild.id]) {
    data[guild.id] = { users: {}, shop: { products: [] }, vip_actived: false };
  }

  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
  await sendHelloMessage(guild);
});

client.on('messageCreate', async (message) => {
  // Gestion des messages privés avec Gemini
  if (!message.guild && !message.author.bot) {
    console.log(`💌 MP reçu de ${message.author.tag}: ${message.content}`);

    try {
      await message.channel.sendTyping();

      const messages = await message.channel.messages.fetch({ limit: 50 });
      const userMessages = messages
        .filter(msg => msg.author.id === message.author.id)
        .sort((a, b) => a.createdTimestamp - b.createdTimestamp)
        .map(msg => `👤 ${message.author.username} : ${msg.content}`)
        .join('\n');

      const prompt = `
Tu es un assistant intelligent dans Discord. Voici les infos utilisateur :

- Pseudo : ${message.author.username}
- Statut Discord : ${message.author.presence?.status || 'inconnu'}
- Bio : ${message.author.bio || 'Aucune description.'}

Voici les 50 derniers messages privés :
${userMessages}

Dernier message : "${message.content}"
Réponds de manière naturelle, utile et amicale.
`;

      const response = await askGemini(prompt);
      await message.reply(response.slice(0, 2000));
    } catch (error) {
      console.error('❌ Erreur MP IA :', error);
      message.reply('❌ Erreur lors du traitement avec Gemini.');
    }
    return;
  }

  // Commandes classiques (préfix)
  if (message.author.bot || !message.content.startsWith(prefix)) return;
  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();
  const userId = message.author.id;
  const guildId = message.guild ? message.guild.id : null;

  let data = {};
  if (guildId) {
    data = fs.existsSync(dataFile) ? JSON.parse(fs.readFileSync(dataFile)) : {};
    if (!data[guildId]) {
      data[guildId] = { users: {}, shop: { products: [] }, vip_actived: false };
    }
    if (!data[guildId].users[userId]) {
      data[guildId].users[userId] = { coins: 5, lastClaim: 0, tirage: 3, gains: {} };
    }
  }

  const command = commandes.get(commandName);
  if (!command) return;

  // Restriction catégorie (supprimé 'sup')
  if (
    commandName !== 'categorie' &&
    data[guildId]?.id_categorie &&
    message.channel.parentId !== data[guildId].id_categorie
  ) return;

  if (vipCommandFiles.has(commandName) && !data[guildId].vip_actived) {
    return message.reply('❌ Cette commande est réservée aux serveurs **VIP**.');
  }

  try {
    await command.execute(message, args, data, fs, dataFile);
  } catch (err) {
    console.error(`❌ Erreur dans la commande ${commandName}:`, err);
    message.reply('❌ Une erreur est survenue.');
  }
});

// Vérif régulière des giveaways
setInterval(async () => {
  if (!fs.existsSync(giveawayFile)) return;
  const giveaways = JSON.parse(fs.readFileSync(giveawayFile));
  const data = JSON.parse(fs.readFileSync(dataFile));

  for (const messageId in giveaways) {
    const gw = giveaways[messageId];
    if (Date.now() < gw.endTime) continue;

    const guild = client.guilds.cache.get(gw.guildId);
    const channel = guild?.channels.cache.get(gw.channelId);
    const message = await channel?.messages.fetch(gw.messageId).catch(() => null);

    if (!message || !channel) {
      delete giveaways[messageId];
      fs.writeFileSync(giveawayFile, JSON.stringify(giveaways, null, 2));
      continue;
    }

    const users = await message.reactions.cache.get('🎉')?.users.fetch();
    const participants = users?.filter(u => !u.bot).map(u => u.id);

    if (!participants || participants.length === 0) {
      await channel.send('🎉 Giveaway terminé ! Aucun participant.');
    } else {
      const winnerId = participants[Math.floor(Math.random() * participants.length)];
      const winnerMention = `<@${winnerId}>`;

      if (!data[gw.guildId].users[winnerId]) {
        data[gw.guildId].users[winnerId] = { coins: 0, lastClaim: 0, tirage: 3, gains: {} };
      }

      data[gw.guildId].users[winnerId].coins += gw.amount;
      fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
      await channel.send(`🎉 Bravo ${winnerMention} ! Tu as gagné **${gw.amount} coins** !`);
    }

    delete giveaways[messageId];
    fs.writeFileSync(giveawayFile, JSON.stringify(giveaways, null, 2));
  }
}, 3000);

// Slash /clean-ai
client.on('interactionCreate', async (interaction) => {
  if (interaction.type !== InteractionType.ApplicationCommand) return;

  if (interaction.commandName === 'clean-ai') {
    if (!interaction.guild) {
      return interaction.reply({ content: '❌ Cette commande doit être utilisée dans un serveur.', ephemeral: true });
    }

    const channel = interaction.channel;
    const userId = interaction.user.id;

    try {
      const messages = await channel.messages.fetch({ limit: 100 });
      const userMessages = messages.filter(msg => msg.author.id === userId);

      const deleted = [];
      for (const msg of userMessages.values()) {
        try {
          await msg.delete();
          deleted.push(msg.id);
        } catch (err) {
          // Ignore
        }
      }

      await interaction.reply({
        content: `✅ ${deleted.length} message(s) supprimé(s) dans ce salon.`,
        ephemeral: true
      });
    } catch (error) {
      console.error('❌ Erreur /clean-ai :', error);
      await interaction.reply({
        content: '❌ Une erreur est survenue lors de la suppression.',
        ephemeral: true
      });
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
