import { Injectable, Logger } from '@nestjs/common';
import { applications } from '../data/phase0-seed';
import { buildIdf, tokenize, tfidfVector } from '../phase1/similarity';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Persists lexical TF-IDF vectors into PrecedentEmbedding.embedding (Json)
 * when Prisma is connected. pgvector column is filled later via SQL helpers.
 */
@Injectable()
export class EmbeddingPersistService {
  private readonly log = new Logger(EmbeddingPersistService.name);
  private lastRefresh: { at: string; count: number; method: string } | null = null;

  constructor(private readonly prisma: PrismaService) {}

  status() {
    return {
      prismaEnabled: this.prisma.enabled,
      lastRefresh: this.lastRefresh,
      note: 'TF-IDF Json vectors by default; creek_similar_applications() when pgvector is live.',
    };
  }

  async refreshFromPublicApplications() {
    const publicApps = applications.filter((a) => a.status !== 'DRAFT');
    const docs = publicApps.map((a) => tokenize(`${a.projectType} ${a.description}`));
    const idf = buildIdf(docs);

    if (!this.prisma.enabled) {
      this.lastRefresh = {
        at: new Date().toISOString(),
        count: publicApps.length,
        method: 'memory-only',
      };
      return this.lastRefresh;
    }

    let count = 0;
    for (let i = 0; i < publicApps.length; i++) {
      const app = publicApps[i];
      const vec = tfidfVector(docs[i], idf);
      const embedding = Object.fromEntries(vec.entries());
      const sourceText = `${app.projectType}: ${app.description}`;
      try {
        await this.prisma.precedentEmbedding.upsert({
          where: { applicationId: app.id },
          create: {
            applicationId: app.id,
            sourceText,
            embedding,
          },
          update: {
            sourceText,
            embedding,
            refreshedAt: new Date(),
          },
        });
        count += 1;
      } catch (e) {
        this.log.warn(`Embedding upsert skipped for ${app.id}: ${(e as Error).message}`);
      }
    }

    this.lastRefresh = {
      at: new Date().toISOString(),
      count,
      method: 'prisma-json-tfidf',
    };
    return this.lastRefresh;
  }
}
