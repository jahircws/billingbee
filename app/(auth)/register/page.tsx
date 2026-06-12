import type { Metadata } from "next"
import { privateMetadata } from "@/lib/metadata"
import { RegisterForm } from "./register-form"

export const metadata: Metadata = privateMetadata

interface Props {
  searchParams: Promise<{ callbackUrl?: string; trial?: string }>
}

export default async function RegisterPage({ searchParams }: Props) {
  const { callbackUrl, trial } = await searchParams
  return <RegisterForm callbackUrl={callbackUrl} trial={trial} />
}
