# Unified API + web image for Railway / containers
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
  && npm run build -w @creek-street/api \
  && npm run build -w @creek-street/web

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001
ENV WEB_DIST=/app/apps/web/dist
ARG RAILWAY_GIT_COMMIT_SHA=
ARG BUILD_SHA=
ENV BUILD_SHA=${BUILD_SHA:-${RAILWAY_GIT_COMMIT_SHA:-unknown}}
COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api ./apps/api
COPY --from=build /app/apps/web/dist ./apps/web/dist
# Fail the image build if Nest / Vite did not emit production assets.
RUN test -f apps/api/dist/main.js \
  && test -f apps/web/dist/index.html \
  && test -f apps/web/dist/hero-creek.jpg
EXPOSE 3001
CMD ["npm", "run", "start", "-w", "@creek-street/api"]
