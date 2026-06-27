import type { Metadata } from "next"
import { privateMetadata } from "@/lib/metadata"
import { LoginForm } from "./login-form"
import { getGeoDefaults } from "@/lib/geo"

export const metadata: Metadata = privateMetadata

interface Props {
  searchParams: Promise<{ callbackUrl?: string; registered?: string }>
}

export default async function LoginPage({ searchParams }: Props) {
  const [{ callbackUrl, registered }, geo] = await Promise.all([
    searchParams,
    getGeoDefaults(),
  ])
  return (
    <LoginForm
      callbackUrl={callbackUrl}
      registered={registered === "1"}
      isIndia={geo.country === "IN"}
    />
  )
}
