// ecosystem.config.js
module.exports = {
    apps : [{
      name   : "atomify",
      script : "./server.js",
      env_production: {
         NODE_ENV: "production",
      }
    }]
  }