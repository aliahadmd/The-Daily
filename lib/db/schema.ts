import { pgTable, serial, text, integer, boolean, timestamp, pgEnum, varchar } from "drizzle-orm/pg-core";

export const publicationStatusEnum = pgEnum("publication_status", ["draft", "published", "archived"]);

export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const countries = pgTable("countries", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  isoCode: varchar("iso_code", { length: 2 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const media = pgTable("media", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  url: text("url").notNull(),
  storagePath: text("storage_path").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

export const articles = pgTable("articles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  excerpt: text("excerpt"),
  body: text("body").notNull(),
  status: publicationStatusEnum("status").default("draft").notNull(),
  isBreakingNews: boolean("is_breaking_news").default(false).notNull(),
  isFeatured: boolean("is_featured").default(false).notNull(),
  coverImageId: integer("cover_image_id").references(() => media.id, { onDelete: "set null" }),
  videoId: integer("video_id").references(() => media.id, { onDelete: "set null" }),
  videoEmbedUrl: text("video_embed_url"),
  categoryId: integer("category_id").notNull().references(() => categories.id),
  countryId: integer("country_id").references(() => countries.id),
  authorName: varchar("author_name", { length: 200 }).notNull(),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const articleTags = pgTable("article_tags", {
  articleId: integer("article_id").notNull().references(() => articles.id, { onDelete: "cascade" }),
  tagId: integer("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }),
});

export const videoPosts = pgTable("video_posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  description: text("description"),
  status: publicationStatusEnum("status").default("draft").notNull(),
  coverImageId: integer("cover_image_id").references(() => media.id, { onDelete: "set null" }),
  videoMediaId: integer("video_media_id").references(() => media.id, { onDelete: "set null" }),
  videoEmbedUrl: text("video_embed_url"),
  categoryId: integer("category_id").references(() => categories.id),
  countryId: integer("country_id").references(() => countries.id),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const videoPostTags = pgTable("video_post_tags", {
  videoPostId: integer("video_post_id").notNull().references(() => videoPosts.id, { onDelete: "cascade" }),
  tagId: integer("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }),
});

export const userStatusEnum = pgEnum("user_status", ["active", "banned"]);

export const commentStatusEnum = pgEnum("comment_status", ["pending", "approved", "rejected"]);

export const publicUsers = pgTable("public_users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  status: userStatusEnum("status").default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  articleId: integer("article_id")
    .notNull()
    .references(() => articles.id, { onDelete: "cascade" }),
  userId: integer("user_id")
    .notNull()
    .references(() => publicUsers.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  status: commentStatusEnum("status").default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const subscriptionStatusEnum = pgEnum("subscription_status", ["active", "canceled"]);

export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .unique()
    .references(() => publicUsers.id, { onDelete: "cascade" }),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }).notNull(),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }).notNull(),
  status: subscriptionStatusEnum("status").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
