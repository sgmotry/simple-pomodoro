FROM node:20-slim

RUN apt-get update && apt-get install -y git && apt-get clean

# pnpmを有効化
RUN corepack enable && corepack prepare pnpm@latest --activate

# pnpm のストア設定（オプション）
# コンテナ内でのキャッシュ効率を上げるために環境変数を設定することもあります
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

WORKDIR /app

VOLUME ["/app/node_modules"]