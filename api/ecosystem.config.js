module.exports = {
  apps: [{
    name: "my-api",           
    script: "./src/app.ts",  
    interpreter: "node",      // 明确指定使用 node
    interpreter_args: "-r ts-node/register", // 使用 ts-node 来处理 TypeScript
    watch: false,             
    env_development: {
      NODE_ENV: "development",
      PM2_NAME: "my-api",
      NODE_OPTIONS: "--enable-source-maps"
    },
    env_production: {
      NODE_ENV: "production",
      PM2_NAME: "my-api"
    }
  }]
} 