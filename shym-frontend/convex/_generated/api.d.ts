/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ai from "../ai.js";
import type * as cart from "../cart.js";
import type * as categories from "../categories.js";
import type * as lots from "../lots.js";
import type * as notifications from "../notifications.js";
import type * as orders from "../orders.js";
import type * as reviews from "../reviews.js";
import type * as seedMockLots from "../seedMockLots.js";
import type * as telegram from "../telegram.js";
import type * as telegram_actions from "../telegram_actions.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  ai: typeof ai;
  cart: typeof cart;
  categories: typeof categories;
  lots: typeof lots;
  notifications: typeof notifications;
  orders: typeof orders;
  reviews: typeof reviews;
  seedMockLots: typeof seedMockLots;
  telegram: typeof telegram;
  telegram_actions: typeof telegram_actions;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
