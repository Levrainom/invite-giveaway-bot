const { Client, GatewayIntentBits, Partials } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.GuildMember]
});

// Variables du giveaway
let giveawayActive = false;
let inviteCount = new Map();
let inviteCache = new Map();

// Quand le bot est prêt
client.once("ready", async () => {
  console.log(`Connecté en tant que ${client.user.tag}`);

  // On charge le cache des invites pour chaque serveur
  client.guilds.cache.forEach(async guild => {
    try {
      const invites = await guild.invites.fetch();
      inviteCache.set(guild.id, invites);
    } catch (err) {
      console.log(`Impossible de récupérer les invites pour ${guild.name}: ${err}`);
    }
  });
});

// Quand un membre rejoint
client.on("guildMemberAdd", async member => {
  if (!giveawayActive) return;

  try {
    const invites = await member.guild.invites.fetch();
    const oldInvites = inviteCache.get(member.guild.id);

    // Trouve l’invite utilisée
    const usedInvite = invites.find(i => oldInvites.get(i.code)?.uses < i.uses);

    // Met à jour le cache
    inviteCache.set(member.guild.id, invites);

    if (!usedInvite || !usedInvite.inviter) return;

    const inviterId = usedInvite.inviter.id;
    inviteCount.set(inviterId, (inviteCount.get(inviterId) || 0) + 1);

    console.log(`${member.user.tag} a rejoint via ${usedInvite.code} (${usedInvite.inviter.tag})`);
  } catch (err) {
    console.log(`Erreur lors de guildMemberAdd: ${err}`);
  }
});

// Commandes
client.on("messageCreate", async message => {
  if (message.author.bot) return;

  // DEBUG : voir tous les messages
  console.log("Message reçu :", message.content);

  if (!message.member.permissions.has("Administrator")) return;

  if (message.content === "!giveaway start") {
    giveawayActive = true;
    inviteCount.clear();
    message.channel.send("🎉 Giveaway démarré !");
  }

  if (message.content === "!giveaway end") {
    giveawayActive = false;

    let tickets = [];
    inviteCount.forEach((count, userId) => {
      for (let i = 0; i < count; i++) tickets.push(userId);
    });

    if (tickets.length === 0)
      return message.channel.send("❌ Aucun participant.");

    const winnerId = tickets[Math.floor(Math.random() * tickets.length)];
    message.channel.send(`🏆 Gagnant : <@${winnerId}>`);
  }
});

// Login
client.login(process.env.TOKEN);
