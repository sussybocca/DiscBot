import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const provider = searchParams.get('provider')
  const returnTo = searchParams.get('returnTo') || '/dashboard'

  if (!provider || !['discord', 'github'].includes(provider)) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?returnTo=${encodeURIComponent(returnTo)}`,
      scopes: provider === 'github' ? 'repo,user' : 'identify email'
    }
  })

  if (error) {
    return NextResponse.redirect(new URL(`/?error=${error.message}`, request.url))
  }

  return NextResponse.redirect(data.url)
}

export async function DELETE() {
  await supabase.auth.signOut()
  return NextResponse.json({ success: true })
}
