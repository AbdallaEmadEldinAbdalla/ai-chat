import { Message } from "ai";
import { InferSelectModel } from "drizzle-orm";
import { pgTable, varchar, timestamp, json, uuid, serial } from "drizzle-orm/pg-core";

export const user = pgTable("User", {
  id: serial('id').primaryKey(),
  email: varchar("email", { length: 64 }).notNull(),
  password: varchar("password", { length: 64 }),
  createdAt: timestamp("createdAt").notNull().defaultNow()
});

export type User = InferSelectModel<typeof user>;

export const chat = pgTable("Chat", {
  id: serial('id').primaryKey(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  messages: json("messages").notNull(),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id),
});

export type Chat = Omit<InferSelectModel<typeof chat>, "messages"> & {
  messages: Array<Message>;
};
