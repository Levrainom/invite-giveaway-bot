const { Client, GatewayIntentBits } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.MessageContent,
  ]
});

let giveawayActive = false;
let inviteCount = new Map();
let inviteCache = new Map();

client.once("ready", async () => {
  console.log(`Connecté en tant que ${client.user.tag}`);
  client.guilds.cache.forEach(async guild => {
    const invites = await guild.invites.fetch();
    inviteCache.set(guild.id, invites);
  });
});

client.on("guildMemberAdd", async member => {
  if (!giveawayActive) return;

  const invites = await member.guild.invites.fetch();
  const oldInvites = inviteCache.get(member.guild.id);

  const usedInvite = invites.find(
    i => oldInvites.get(i.code)?.uses < i.uses
  );

  inviteCache.set(member.guild.id, invites);

  if (!usedInvite) return;

  const inviterId = usedInvite.inviter.id;
  inviteCount.set(inviterId, (inviteCount.get(inviterId) || 0) + 1);
});

client.on("messageCreate", async message => {
  if (!message.member.permissions.has("Administrator")) return;

  if (message.content === "!giveaway start") {
    giveawayActive = true;
    inviteCount.clear();
    message.channel.send("🎉 Giveaway démarré ! Les invitations sont comptées.");
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

// Token via variable d'environnement
client.login(process.env.TOKEN);
