# API image for Railway / containers
FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN npm ci

FROM deps AS build
COPY . .
# Prisma client must exist before nest/tsc — otherwise $queryRawUnsafe and
# store findMany results are untyped and the Docker build fails.
RUN npm run prisma:generate -w @creek-street/api \
  && npm run build -w @creek-street/api

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api ./apps/api
# Fail the image build if Nest did not emit the production entrypoint.
RUN test -f apps/api/dist/main.js
EXPOSE 3001
CMD ["npm", "run", "start", "-w", "@creek-street/api"]
