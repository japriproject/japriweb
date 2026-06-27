import crypto from 'node:crypto'
import fs from 'node:fs'

function readEnv() {
  const text = fs.readFileSync('.env', 'utf8')
  const env = {}

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#') || !line.includes('=')) continue
    const index = line.indexOf('=')
    const key = line.slice(0, index).trim()
    const value = line
      .slice(index + 1)
      .trim()
      .replace(/^['"]|['"]$/g, '')
    env[key] = value
  }

  return env
}

const env = readEnv()
const username = env.DIGIFLAZZ_USERNAME
const productionApiKey =
  env.DIGIFLAZZ_HOTEL_PRODUCTION_API_KEY ||
  env.DIGIFLAZZ_PRODUCTION_API_KEY ||
  env.DIGIFLAZZ_API_KEY_PRODUCTION ||
  env.DIGIFLAZZ_API_KEY
const developmentApiKey =
  env.DIGIFLAZZ_HOTEL_DEVELOPMENT_API_KEY ||
  env.DIGIFLAZZ_DEVELOPMENT_API_KEY ||
  env.DIGIFLAZZ_API_KEY_DEVELOPMENT
const code = env.DIGIFLAZZ_HOTEL_CODE || 'hotel'
const baseUrl = env.DIGIFLAZZ_HOTEL_URL || 'https://api.digiflazz.com/v1/hotel'
const priceListUrl = 'https://api.digiflazz.com/v1/price-list'

if (!username || !productionApiKey) {
  throw new Error('DIGIFLAZZ_USERNAME and DIGIFLAZZ_API_KEY are required')
}

function sign(apiKey, additional) {
  return crypto.createHash('md5').update(`${username}${apiKey}${additional}`).digest('hex')
}

async function post(label, path, payload, options = {}) {
  const apiKey = options.testing ? developmentApiKey : productionApiKey
  if (!apiKey) {
    console.log(
      JSON.stringify(
        {
          label,
          path,
          skipped: true,
          message: 'Development API key is required for Digiflazz hotel test case requests.',
        },
        null,
        2,
      ),
    )
    return
  }

  const body = {
    username,
    sign: sign(apiKey, options.additional || 'hotel.content'),
    ...payload,
  }

  if (options.codeField === 'code') body.code = code
  if (options.codeField === 'buyer_sku_code') body.buyer_sku_code = code
  if (options.testing) body.is_testing = true

  const response = await fetch(`${baseUrl}/${path}`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const text = await response.text()
  let parsed = null
  try {
    parsed = text ? JSON.parse(text) : null
  } catch {}

  console.log(
    JSON.stringify(
      {
        label,
        path,
        status: response.status,
        rc: parsed?.rc,
        message: parsed?.message ?? text.slice(0, 500),
      },
      null,
      2,
    ),
  )
}

async function priceList(label, cmd) {
  const response = await fetch(priceListUrl, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username,
      sign: sign(productionApiKey, 'pricelist'),
      cmd,
    }),
  })

  const text = await response.text()
  let parsed = null
  try {
    parsed = text ? JSON.parse(text) : null
  } catch {}

  console.log(
    JSON.stringify(
      {
        label,
        status: response.status,
        message: parsed?.message ?? text.slice(0, 500),
        dataCount: Array.isArray(parsed?.data) ? parsed.data.length : undefined,
      },
      null,
      2,
    ),
  )
}

await priceList('price-list prepaid', 'prepaid')
await priceList('price-list pasca', 'pasca')

await post('city production', 'content/city', {
  country: 'ID',
  page: 1,
}, { codeField: 'code' })

await post('city testing', 'content/city', {
  country: 'ID',
  page: 1,
}, { codeField: 'code', testing: true })

await post('search production', 'content/search', {
  keyword: 'jakarta',
  stars: [3, 4, 5],
}, { codeField: 'code' })

await post('search wrong sign compare', 'content/search', {
  keyword: 'jakarta',
  stars: [3, 4, 5],
}, { codeField: 'code', additional: 'wrong.sign' })

await post('search testing', 'content/search', {
  keyword: 'jakarta',
  stars: [3, 4, 5],
}, { codeField: 'code', testing: true })

await post('search no code', 'content/search', {
  keyword: 'jakarta',
  stars: [3, 4, 5],
})

await post('search buyer_sku_code', 'content/search', {
  keyword: 'jakarta',
  stars: [3, 4, 5],
}, { codeField: 'buyer_sku_code' })

await post('search sign hotel', 'content/search', {
  keyword: 'jakarta',
  stars: [3, 4, 5],
}, { codeField: 'code', additional: 'hotel' })

for (const additional of [
  'hotel.content.search',
  'hotel.search.destination',
  'hotel.search-destination',
  'hotel.destination',
  'content.search',
  'search-destination',
  'search',
  code,
]) {
  await post(`search additional ${additional}`, 'content/search', {
    keyword: 'jakarta',
    stars: [3, 4, 5],
  }, { codeField: 'code', additional })
}

await post('search keyword only', 'content/search', {
  keyword: 'jakarta',
}, { codeField: 'code' })

await post('search destination field', 'content/search', {
  destination: 'jakarta',
}, { codeField: 'code' })

await post('search-destination path', 'search-destination', {
  keyword: 'jakarta',
  stars: [3, 4, 5],
}, { codeField: 'code' })

await post('content search-destination path', 'content/search-destination', {
  keyword: 'jakarta',
  stars: [3, 4, 5],
}, { codeField: 'code' })

await post('destination search path', 'destination/search', {
  keyword: 'jakarta',
  stars: [3, 4, 5],
}, { codeField: 'code' })
