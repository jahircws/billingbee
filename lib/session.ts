import { auth } from "@/auth"

export async function getSession() {
  return await auth()
}

export async function getOrgId(): Promise<string> {
  const session = await auth()
  const orgId = session?.user?.orgId
  if (!orgId) throw new Error("No orgId in session")
  return orgId
}

export async function getClientSession(): Promise<{ clientId: string; orgId: string }> {
  const session = await auth()
  const clientId = session?.user?.clientId
  const orgId = session?.user?.orgId
  if (!clientId || !orgId) throw new Error("No client session")
  return { clientId, orgId }
}
