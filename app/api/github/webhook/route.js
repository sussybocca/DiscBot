import { NextResponse } from 'next/server'
import { Octokit } from '@octokit/rest'
import { supabase } from '@/lib/supabase'
import crypto from 'crypto'

export async function POST(request) {
  try {
    const signature = request.headers.get('x-hub-signature-256')
    const body = await request.text()
    
    // Verify webhook signature
    const secret = process.env.GITHUB_WEBHOOK_SECRET
    if (secret) {
      const hmac = crypto.createHmac('sha256', secret)
      const digest = 'sha256=' + hmac.update(body).digest('hex')
      
      if (signature !== digest) {
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        )
      }
    }

    const event = request.headers.get('x-github-event')
    const payload = JSON.parse(body)

    // Handle push events
    if (event === 'push') {
      const { repository, commits } = payload
      
      // Update last sync in database
      await supabase
        .from('Github_Repos')
        .update({ 
          last_sync: new Date().toISOString(),
          commits: (commits || []).length
        })
        .eq('repo_name', repository.full_name)

      // Trigger bot redeployment if bot.js was changed
      const changedFiles = commits?.flatMap(c => c.added.concat(c.modified).concat(c.removed)) || []
      if (changedFiles.some(f => f.includes('bot.js') || f.includes('discord-bot'))) {
        // Find associated bot
        const { data: repo } = await supabase
          .from('Github_Repos')
          .select('discord_bot_id')
          .eq('repo_name', repository.full_name)
          .single()

        if (repo?.discord_bot_id) {
          // Trigger deployment
          // This would connect to your deployment service
          console.log(`Trigger deployment for bot: ${repo.discord_bot_id}`)
        }
      }
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
