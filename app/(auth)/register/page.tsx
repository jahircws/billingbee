import type { Metadata } from "next"
import { privateMetadata } from "@/lib/metadata"
import { RegisterForm } from "./register-form"

export const metadata: Metadata = privateMetadata

export default function RegisterPage() {
  return <RegisterForm />
}
