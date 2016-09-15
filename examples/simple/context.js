
module.exports = handler => ({
  r: require("rethinkdbdash")(handler.settings.database),
})
