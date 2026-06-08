import type { Metadata } from "next"
import { privateMetadata } from "@/lib/metadata"

export const metadata: Metadata = privateMetadata

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return children
}
