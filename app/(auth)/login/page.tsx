import type { Metadata } from "next"
import { privateMetadata } from "@/lib/metadata"
import { LoginForm } from "./login-form"

export const metadata: Metadata = privateMetadata

export default function LoginPage() {
  return <LoginForm />
}
