import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp, boolean } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  name: text('name').notNull().default(''),
  handle: text('handle').notNull(),
  avatar: text('avatar').notNull().default(''),
  bio: text('bio').notNull().default(''),
  verified: boolean('verified').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  content: text('content').notNull(),
  image: text('image'),
  likesCount: integer('likes_count').notNull().default(0),
  repliesCount: integer('replies_count').notNull().default(0),
  repostsCount: integer('reposts_count').notNull().default(0),
  viewsCount: integer('views_count').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

export const aiTwins = pgTable('ai_twins', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull()
    .unique(),
  isSyncing: boolean('is_syncing').notNull().default(false),
  lastSyncedAt: timestamp('last_synced_at'),
  personalityProfile: text('personality_profile'),
  postCountAnalyzed: integer('post_count_analyzed').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

export const otps = pgTable('otps', {
  email: text('email').primaryKey(),
  code: text('code').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  failedAttempts: integer('failed_attempts').notNull().default(0),
  blockedUntil: timestamp('blocked_until'),
  requestsCount: integer('requests_count').notNull().default(0),
  windowStartAt: timestamp('window_start_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const usersRelations = relations(users, ({ many, one }) => ({
  posts: many(posts),
  aiTwin: one(aiTwins, {
    fields: [users.id],
    references: [aiTwins.userId],
  })
}));

export const postsRelations = relations(posts, ({ one }) => ({
  author: one(users, {
    fields: [posts.userId],
    references: [users.id],
  }),
}));
