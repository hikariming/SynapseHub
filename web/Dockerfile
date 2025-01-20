# 构建阶段
FROM node:18-alpine AS builder

WORKDIR /app

# 复制 package.json
COPY package*.json ./

# 安装依赖（使用 --legacy-peer-deps 解决依赖冲突）
RUN npm install --legacy-peer-deps

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 运行阶段
FROM node:18-alpine

WORKDIR /app

# 复制 package.json
COPY package*.json ./

# 只安装生产依赖（使用 --legacy-peer-deps）
RUN npm install --production --legacy-peer-deps

# 复制构建产物
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["npm", "start"]