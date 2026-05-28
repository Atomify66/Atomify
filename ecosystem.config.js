// ecosystem.config.js
module.exports = {
    apps : [{
      name   : "atomify",
      script : "./server.js",
      cwd    : "/var/www/Atomify/v2",
      env_production: {
         NODE_ENV: "production",
      }
    }]
  }