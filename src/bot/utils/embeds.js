const { displayUsername } = require("./constants")

module.exports = {
  buildEmbedAuthorField (user) {
    return {
      name: displayUsername(user),
      icon_url: user.avatarURL
    }
  },
  buildEmbedFooterField (user) {
    return {
      text: displayUsername(user),
      icon_url: user.dynamicAvatarURL(null, 64)
    }
  },
}
