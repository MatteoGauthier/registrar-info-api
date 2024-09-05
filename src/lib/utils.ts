export const getRawWhois = async (domain: string) => {
  const whoisResponse = await fetch(`https://whois.aber.sh/?domain=${domain}`, {
    headers: { Accept: "application/json" },
  })
  const whoisData = (await whoisResponse.json()) as any

  const whoisRaw = whoisData.whois
  return whoisRaw
}
