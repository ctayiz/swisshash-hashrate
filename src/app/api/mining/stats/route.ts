import { NextResponse } from 'next/server'

// Cache response for 5 minutes
export const revalidate = 300

export async function GET() {
  try {
    const [priceRes, diffRes] = await Promise.all([
      fetch('https://blockchain.info/q/24hrprice', { next: { revalidate: 300 } }),
      fetch('https://blockchain.info/q/getdifficulty', { next: { revalidate: 300 } }),
    ])

    const [priceText, diffText] = await Promise.all([priceRes.text(), diffRes.text()])

    const btcPriceUsd = parseFloat(priceText)
    const difficulty = parseFloat(diffText)

    if (isNaN(btcPriceUsd) || isNaN(difficulty)) {
      return NextResponse.json({ error: 'Failed to parse data' }, { status: 502 })
    }

    // Daily BTC per TH/s = (1e12 * 86400) / (difficulty * 2^32) * block_reward
    // Block reward currently 3.125 BTC (post-halving Apr 2024)
    const BLOCK_REWARD = 3.125
    const dailyBtcPerTH = (1e12 * 86400) / (difficulty * Math.pow(2, 32)) * BLOCK_REWARD

    return NextResponse.json({ btcPriceUsd, difficulty, dailyBtcPerTH })
  } catch {
    return NextResponse.json({ error: 'Upstream error' }, { status: 502 })
  }
}
