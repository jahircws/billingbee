/**
 * Converts Prisma Decimal objects (and Dates) to plain JS values so they
 * can be safely passed from Server Components to Client Components.
 *
 * Prisma returns Decimal for numeric fields — Next.js can't serialize them
 * across the server→client boundary without this transformation.
 *
 * Usage:
 *   const data = serialize(await prisma.invoice.findMany(...))
 */
export function serialize<T>(data: T): T {
  return JSON.parse(
    JSON.stringify(data, (_key, value) => {
      // Prisma Decimal — convert to number
      if (
        value !== null &&
        typeof value === "object" &&
        typeof value.toNumber === "function" &&
        typeof value.toFixed === "function"
      ) {
        return value.toNumber()
      }
      return value
    })
  )
}
