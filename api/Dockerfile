# 构建阶段
FROM node:18-alpine AS builder

WORKDIR /app

# 复制 package.json 和 tsconfig.json
COPY package*.json ./
COPY tsconfig.json ./

# 安装依赖
RUN npm install

# 复制源代码
COPY . .

# 构建 TypeScript
RUN npm run build

# 运行阶段
FROM node:18-alpine

WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 只安装生产依赖
RUN npm install --production

# 从构建阶段复制编译后的代码
COPY --from=builder /app/dist ./dist

# 创建环境配置文件
RUN echo "database:" > .env.yml && \
    echo "  mongo_uri: mongodb://synapse_admin:Syn%40pse2024_MongoDB%23Secure@mongodb:27017/api?authSource=admin" >> .env.yml && \
    echo "  redis_uri: redis://:Redis%40Synapse2024%23Complex@redis:6379" >> .env.yml && \
    echo "" >> .env.yml && \
    echo "jwt:" >> .env.yml && \
    echo "  secret: your_custom_jwt_secret_key_here_please_change_in_production" >> .env.yml && \
    echo "  expiresIn: 7d" >> .env.yml && \
    echo "" >> .env.yml && \
    echo "monitoring:" >> .env.yml && \
    echo "  enable_metrics: true" >> .env.yml && \
    echo "  prometheus_port: 9090" >> .env.yml

# 暴露端口
EXPOSE 3088

# 设置环境变量
ENV NODE_ENV=production

# 启动命令
CMD ["npm", "start"] 