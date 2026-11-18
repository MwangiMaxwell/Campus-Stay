// Lean Mongoose documents expose `_id`. API clients also get a string `id` so every DTO
// can be addressed the same way, while `_id` stays for existing callers.
export function withId<T extends { _id: unknown }>(doc: T): T & { id: string } {
  return { ...doc, id: String(doc._id) };
}
