import { zValidator } from "@hono/zod-validator"
import { ChatGroq } from "@langchain/groq"
import { Hono } from "hono"
import { cache } from "hono/cache"
import { logger } from "hono/logger"
import { z } from "zod"
import { getRawWhois } from "./lib/utils"

import type { BaseLanguageModelInput } from "@langchain/core/language_models/base"
import type { Runnable, RunnableConfig } from "@langchain/core/runnables"
import { bearerAuth } from "hono/bearer-auth"
import { whoisSchema } from "./lib/schemas"

type Bindings = {
  AI: Ai
  CLOUDFLARE_ACCOUNT_ID: string
  CLOUDFLARE_API_TOKEN: string
  GROQ_API_KEY: string
}

declare module "hono" {
  interface ContextVariableMap {
    model: Runnable<BaseLanguageModelInput, z.infer<typeof whoisSchema>, RunnableConfig>
  }
}

const app = new Hono<{ Bindings: Bindings }>()

app.use(async (c, next) => {
  const groqModel = new ChatGroq({
    model: "llama3-groq-8b-8192-tool-use-preview",
    apiKey: c.env.GROQ_API_KEY,
    temperature: 0,
  })

  const structuredLlm = groqModel.withStructuredOutput(whoisSchema)

  c.set("model", structuredLlm)

  await next()
})

const token = "Ij3Xl8vnhpssXioyTg4Ej"

app.use("*", bearerAuth({ token }))

app.use(logger())

app.get(
  "/whois",
  cache({
    cacheName: "whois-cache",
    cacheControl: "max-age=3600",
  })
)
app.get(
  "/whois",
  zValidator(
    "query",
    z.object({
      domain: z.string(),
    })
  ),
  async (c) => {
    console.log(c.env)

    const domain = c.req.valid("query").domain
    const whoisRaw = await getRawWhois(domain)

    const modelResponse = await c
      .get("model")
      .invoke(`Extract relevant information from the following WHOIS data: \n${whoisRaw}`)

    return c.json(modelResponse)
  }
)

export default app
