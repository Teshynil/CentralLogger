const { buildEmbedAuthorField, buildEmbedFooterField } = require("../utils/embeds")

module.exports = {
  func: async message => {
    message.channel.createMessage({
      embeds: [{
        description: `Hi, you can invite me via [this link](https://discord.com/oauth2/authorize?client_id=${global.bot.user.id}). To see what invite is used for a member joining, you MUST grant **manage channels** and **manage server** for it to work (Discord does not send invite info to the bot otherwise)!`,
        color: 3553599,
        timestamp: new Date(),
        author: buildEmbedAuthorField(message.author),
        footer: buildEmbedFooterField(global.bot.user)
      }]
    })
  },
  name: 'invite',
  quickHelp: 'Returns an embed with multiple invites to choose your preferred permissions.',
  examples: `\`${process.env.GLOBAL_BOT_PREFIX}invite\` <- returns an embed with invites for different use cases (fewer required perms = better!)`,
  type: 'any',
  category: 'General'
}
