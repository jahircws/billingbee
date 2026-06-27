import type { Metadata } from "next"
import { privateMetadata } from "@/lib/metadata"
import { RegisterForm } from "./register-form"
import { getGeoDefaults } from "@/lib/geo"

export const metadata: Metadata = privateMetadata

interface Props {
  searchParams: Promise<{ callbackUrl?: string; trial?: string }>
}

export default async function RegisterPage({ searchParams }: Props) {
  const [{ callbackUrl, trial }, geo] = await Promise.all([
    searchParams,
    getGeoDefaults(),
  ])
  return <RegisterForm callbackUrl={callbackUrl} trial={trial} isIndia={geo.country === "IN"} />
}
