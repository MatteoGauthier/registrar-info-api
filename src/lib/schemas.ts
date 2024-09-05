import { z } from "zod"
export const whoisSchema = z.object({
  domainName: z.string().describe("The domain name in lowercase"),
  registrar: z.string().describe("The registrar of the domain"),
  registrarUrl: z.string().describe("The URL of the registrar"),
  creationDate: z.string().describe("The creation date of the domain"),
  expirationDate: z.string().describe("The expiration date of the domain"),
  status: z.string().describe("The status of the domain"),
  nameServers: z.array(z.string()).describe("The name servers of the domain in lowercase, make sure to include all"),
})
