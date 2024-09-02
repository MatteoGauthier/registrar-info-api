import { Hono } from "hono"
import { ChatOpenAI } from "@langchain/openai"
import { z } from "zod"
import { ChatGroq } from "@langchain/groq"

const app = new Hono()

// Define the Zod schema for the structured output
const whoisSchema = z.object({
  domainName: z.string().describe("The domain name"),
  registrar: z.string().describe("The registrar of the domain"),
  creationDate: z.string().describe("The creation date of the domain"),
  expirationDate: z.string().describe("The expiration date of the domain"),
  status: z.string().describe("The status of the domain"),
  nameServers: z.array(z.string()).describe("The name servers of the domain"),
})

// Instantiate the model
const model = new ChatGroq({
  model: "llama-3.1-8b-instant",
  temperature: 0,
})

// Define the endpoint
app.get("/structured-whois", async (c) => {
  const domain = c.req.query("domain")
  if (!domain) {
    return c.json({ error: "Domain query parameter is required" }, 400)
  }

  // Fetch the WHOIS data
  const whoisResponse = await fetch(`https://whois.aber.sh/?domain=${domain}`, {
    headers: { Accept: "application/json" },
  })
  const whoisData = await whoisResponse.json()
  console.log("🚀 ~ whoisData:", whoisData)

  const whoisRaw = whoisData.whois

  // Pass the raw WHOIS data to the LLM model
  const structuredLlm = model.withStructuredOutput(whoisSchema)
  const response = await structuredLlm.invoke(
    `Extract relevant information from the following WHOIS data: \n${whoisRaw}`
  )
  console.log('🚀 ~ response:', response)

  return c.json(response)
})

app.get("/", (c) => c.text("Hello, Hono!"))

export default {
  port: 3000,
  fetch: app.fetch,
}
