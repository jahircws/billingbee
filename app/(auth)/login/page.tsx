import type { Metadata } from "next"
import { privateMetadata } from "@/lib/metadata"
import { LoginForm } from "./login-form"

export const metadata: Metadata = privateMetadata

interface Props {
  searchParams: Promise<{ callbackUrl?: string }>
}

export default async function LoginPage({ searchParams }: Props) {
  const { callbackUrl } = await searchParams
  return <LoginForm callbackUrl={callbackUrl} />
}
