import type { FastifyPluginCallback } from 'fastify';
import { z } from 'zod';

const placementTierSchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string(),
  basePrice: z.number(),
  currency: z.string(),
  maxDurationDays: z.number().int().positive(),
  displayOrder: z.number().int()
});

type PlacementTier = z.infer<typeof placementTierSchema>;

const boardSlugParamSchema = z.object({ slug: z.string() });

const quoteBodySchema = z.object({
  tierId: z.string(),
  days: z.number().min(1).max(30)
});

const boardListResponseSchema = z.object({
  boards: z.array(
    z.object({
      id: z.string(),
      slug: z.string(),
      title: z.string(),
      description: z.string(),
      owner: z.object({ displayName: z.string() }),
      tierCount: z.number().int().nonnegative()
    })
  )
});

const boardWithTiersResponseSchema = z.object({
  board: z.object({
    id: z.string(),
    slug: z.string(),
    title: z.string(),
    tiers: z.array(placementTierSchema)
  })
});

const quoteResponseSchema = z.object({
  boardId: z.string(),
  tierId: z.string(),
  currency: z.string(),
  total: z.number(),
  breakdown: z.object({
    base: z.number(),
    durationMultiplier: z.number(),
    subtotal: z.number(),
    serviceFee: z.number()
  })
});

type Board = {
  id: string;
  slug: string;
  title: string;
  description: string;
  owner: {
    displayName: string;
  };
  placementTiers: PlacementTier[];
};

const mockBoards: Board[] = [
  {
    id: 'board_downtown',
    slug: 'downtown-wall',
    title: 'Downtown Wall',
    description: 'High foot traffic board in the arts district. Ideal for splashy campaigns.',
    owner: { displayName: 'Avery Stone' },
    placementTiers: [
      {
        id: 'spotlight',
        label: 'Spotlight Banner',
        description: 'Hero position spanning the top row with animated entry.',
        basePrice: 25,
        currency: 'USD',
        maxDurationDays: 3,
        displayOrder: 1
      },
      {
        id: 'prime',
        label: 'Prime Quadrant',
        description: 'Large tile in the upper-left grid. Limited to 6 per day.',
        basePrice: 12,
        currency: 'USD',
        maxDurationDays: 7,
        displayOrder: 2
      },
      {
        id: 'community',
        label: 'Community Tile',
        description: 'Standard tile with rotation. Free while in beta.',
        basePrice: 0,
        currency: 'USD',
        maxDurationDays: 2,
        displayOrder: 3
      }
    ]
  },
  {
    id: 'board_remote',
    slug: 'async-playground',
    title: 'Async Playground',
    description: 'Remote-first makers sharing early product teasers and job posts.',
    owner: { displayName: 'Misha Quinn' },
    placementTiers: [
      {
        id: 'spotlight',
        label: 'Spotlight Banner',
        description: 'Top-of-board banner with animated background.',
        basePrice: 18,
        currency: 'USD',
        maxDurationDays: 5,
        displayOrder: 1
      },
      {
        id: 'prime',
        label: 'Prime Quadrant',
        description: 'Large tile mid-board. Includes analytics snapshot.',
        basePrice: 10,
        currency: 'USD',
        maxDurationDays: 7,
        displayOrder: 2
      },
      {
        id: 'community',
        label: 'Community Tile',
        description: 'Small tile with rotation. Free for 12 hours.',
        basePrice: 0,
        currency: 'USD',
        maxDurationDays: 1,
        displayOrder: 3
      }
    ]
  }
];

const findBoardBySlug = (slug: string): Board | undefined =>
  mockBoards.find((board) => board.slug === slug);

export const registerBoardRoutes: FastifyPluginCallback = (app, _opts, done) => {
  app.get('/boards', () =>
    boardListResponseSchema.parse({
      boards: mockBoards.map((board) => ({
        id: board.id,
        slug: board.slug,
        title: board.title,
        description: board.description,
        owner: board.owner,
        tierCount: board.placementTiers.length
      }))
    })
  );

  app.get('/boards/:slug/tiers', (request, reply) => {
    const { slug } = boardSlugParamSchema.parse(request.params);
    const board = findBoardBySlug(slug);

    if (!board) {
      return reply.code(404).send({ message: 'Board not found' });
    }

    return boardWithTiersResponseSchema.parse({
      board: {
        id: board.id,
        slug: board.slug,
        title: board.title,
        tiers: [...board.placementTiers].sort((a, b) => a.displayOrder - b.displayOrder)
      }
    });
  });

  app.post('/boards/:slug/quote', (request, reply) => {
    const { slug } = boardSlugParamSchema.parse(request.params);
    const { tierId, days } = quoteBodySchema.parse(request.body);
    const board = findBoardBySlug(slug);

    if (!board) {
      return reply.code(404).send({ message: 'Board not found' });
    }

    const tier = board.placementTiers.find((item) => item.id === tierId);

    if (!tier) {
      return reply.code(400).send({ message: 'Unknown placement tier' });
    }

    const cappedDays = Math.min(days, tier.maxDurationDays);
    const durationMultiplier = Math.max(1, Math.min(cappedDays, 7));
    const subtotal = tier.basePrice * durationMultiplier;
    const serviceFee = Number((subtotal * 0.08).toFixed(2));
    const total = Number((subtotal + serviceFee).toFixed(2));

    return quoteResponseSchema.parse({
      boardId: board.id,
      tierId: tier.id,
      currency: tier.currency,
      total,
      breakdown: {
        base: tier.basePrice,
        durationMultiplier,
        subtotal,
        serviceFee
      }
    });
  });

  done();
};
