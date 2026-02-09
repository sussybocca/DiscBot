import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request) {
  try {
    const { bot_token, code } = await request.json()
    
    // Validate bot token with Discord API
    const discordResponse = await fetch('https://discord.com/api/v10/users/@me', {
      headers: {
        'Authorization': `Bot ${bot_token}`
      }
    })

    if (!discordResponse.ok) {
      return NextResponse.json(
        { error: 'Invalid bot token' },
        { status: 401 }
      )
    }

    const botData = await discordResponse.json()
    
    // Test code syntax (basic validation)
    try {
      // Simple syntax check - in production use proper validation
      if (!code.includes('client.login')) {
        throw new Error('Missing client.login()')
      }
      if (!code.includes('require(\'discord.js\')')) {
        throw new Error('Missing discord.js import')
      }
    } catch (error) {
      return NextResponse.json(
        { error: `Code validation failed: ${error.message}` },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      bot: {
        id: botData.id,
        username: botData.username,
        discriminator: botData.discriminator,
        avatar: botData.avatar
      },
      message: 'Bot token is valid and code passes basic validation'
    })

  } catch (error) {
    console.error('Bot test error:', error)
    return NextResponse.json(
      { error: 'Test failed: ' + error.message },
      { status: 500 }
    )
  }
}
