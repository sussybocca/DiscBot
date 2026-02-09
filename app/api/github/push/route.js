import { NextResponse } from 'next/server'
import { Octokit } from '@octokit/rest'

export async function POST(request) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing authentication' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { repo_name, content, path, message } = await request.json()

    const [owner, repo] = repo_name.split('/')
    if (!owner || !repo) {
      return NextResponse.json(
        { error: 'Invalid repository name' },
        { status: 400 }
      )
    }

    const octokit = new Octokit({ auth: token })

    // Get the current SHA if file exists
    let sha = null
    try {
      const { data } = await octokit.repos.getContent({
        owner,
        repo,
        path
      })
      sha = data.sha
    } catch (error) {
      // File doesn't exist, that's fine
    }

    // Create or update file
    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: message || 'Update Discord bot code',
      content: Buffer.from(content).toString('base64'),
      sha,
      committer: {
        name: 'Discord Bot Creator',
        email: 'bot@discord-creator.com'
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Code pushed to GitHub successfully'
    })

  } catch (error) {
    console.error('GitHub push error:', error)
    return NextResponse.json(
      { error: 'Failed to push to GitHub: ' + error.message },
      { status: 500 }
    )
  }
}
