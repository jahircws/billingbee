import type { Metadata } from "next"
import { privateMetadata } from "@/lib/metadata"
import { RegisterForm } from "./register-form"

export const metadata: Metadata = privateMetadata

interface Props {
  searchParams: Promise<{ callbackUrl?: string }>
}

export default async function RegisterPage({ searchParams }: Props) {
  const { callbackUrl } = await searchParams
  return <RegisterForm callbackUrl={callbackUrl} />
}
