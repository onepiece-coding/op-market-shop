/**
 * @file frontend/src/cache/CacheContext.ts
 */

import { CacheStore } from "./CacheStore";
import { createContext } from "react";

// React Context is how we make ONE single value (our one CacheStore instance)
// available to EVERY component in the whole app, without manually passing it
// down as a prop through every component in between (a painful pattern
// nicknamed "prop drilling"). We start it as "null" because there's technically
// a brief moment before our Provider component below actually runs.
export const CacheContext = createContext<CacheStore | null>(null);
