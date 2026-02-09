'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  Github, GitBranch, GitCommit, GitPullRequest, Star,
  Eye, Code, Clock, RefreshCw, Link, Lock, Unlock,
  Download, Upload, Trash2, Settings, CheckCircle,
  FolderGit2, FileCode, GitMerge, GitCompare, ExternalLink,
  Copy, Plus, ChevronRight, AlertCircle, Server
} from 'lucide-react'
import { Menu } from '@headlessui/react'
import clsx from 'clsx'

export default function GitHubRepos() {
  const [repos, setRepos] = useState([])
  const [bots, setBots] = useState([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState({})
  const [showConnectModal, setShowConnectModal] = useState(false)
  const [selectedRepo, setSelectedRepo] = useState(null)
  const [stats, setStats] = useState({
    totalRepos: 0,
    syncedRepos: 0,
    totalCommits: 0,
    lastSync: null
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [reposResponse, botsResponse] = await Promise.all([
      supabase.from('Github_Repos').select('*').eq('user_id', user.id),
      supabase.from('Discord_bots').select('id, bot_name, status').eq('user_id', user.id)
    ])

    if (reposResponse.data) {
      setRepos(reposResponse.data)
      setStats({
        totalRepos: reposResponse.data.length,
        syncedRepos: reposResponse.data.filter(r => r.discord_bot_id).length,
        totalCommits: reposResponse.data.reduce((acc, repo) => acc + (repo.commits || 0), 0),
        lastSync: reposResponse.data[0]?.last_sync || null
      })
    }
    if (botsResponse.data) setBots(botsResponse.data)
    setLoading(false)
  }

  const connectGitHub = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: 'repo,user,write:repo_hook'
      }
    })
    
    if (error) {
      toast.error('Failed to connect GitHub: ' + error.message)
    }
  }

  const disconnectGitHub = async () => {
    if (!confirm('Are you sure? This will remove all GitHub connections.')) return
    
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast.error('Failed to disconnect: ' + error.message)
    } else {
      toast.success('GitHub disconnected')
      setRepos([])
    }
  }

  const syncRepo = async (repoId, botId) => {
    setSyncing({ ...syncing, [repoId]: true })
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.provider_token) {
        toast.error('GitHub token not found')
        return
      }

      const repo = repos.find(r => r.id === repoId)
      const bot = bots.find(b => b.id === botId)

      // Get bot code
      const { data: botData } = await supabase
        .from('Discord_bots')
        .select('commands')
        .eq('id', botId)
        .single()

      if (!botData?.commands?.code) {
        toast.error('No bot code found')
        return
      }

      // Push to GitHub
      const response = await fetch('/api/github/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.provider_token}`
        },
        body: JSON.stringify({
          repo_name: repo.repo_name,
          content: botData.commands.code,
          path: 'discord-bot/bot.js',
          message: `Sync Discord bot: ${bot.bot_name}`
        })
      })

      if (response.ok) {
        // Update sync timestamp
        await supabase
          .from('Github_Repos')
          .update({ 
            last_sync: new Date().toISOString(),
            discord_bot_id: botId
          })
          .eq('id', repoId)

        toast.success('Synced to GitHub!')
        fetchData()
      } else {
        toast.error('Sync failed')
      }
    } catch (error) {
      toast.error('Sync error: ' + error.message)
    } finally {
      setSyncing({ ...syncing, [repoId]: false })
    }
  }

  const createWebhook = async (repoId) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      const response = await fetch('/api/github/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.provider_token}`
        },
        body: JSON.stringify({
          repo_id: repoId,
          webhook_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/github/webhook`
        })
      })

      if (response.ok) {
        toast.success('Webhook created!')
      }
    } catch (error) {
      toast.error('Webhook creation failed')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-gray-400">Loading repositories...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { 
            label: 'Total Repos', 
            value: stats.totalRepos, 
            icon: FolderGit2, 
            color: 'from-blue-500 to-cyan-500',
            change: '+1'
          },
          { 
            label: 'Synced Bots', 
            value: stats.syncedRepos, 
            icon: GitMerge, 
            color: 'from-green-500 to-emerald-500',
            change: '+2'
          },
          { 
            label: 'Total Commits', 
            value: stats.totalCommits, 
            icon: GitCommit, 
            color: 'from-purple-500 to-pink-500',
            change: '+24'
          },
          { 
            label: 'Last Sync', 
            value: stats.lastSync ? new Date(stats.lastSync).toLocaleDateString() : 'Never',
            icon: Clock, 
            color: 'from-orange-500 to-red-500',
            change: 'Now'
          }
        ].map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={clsx(
              'relative overflow-hidden rounded-2xl border border-white/5 p-6',
              'bg-gradient-to-br from-gray-900 to-gray-950'
            )}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={clsx(
                'p-3 rounded-xl bg-white/5 backdrop-blur-sm',
                'border border-white/10'
              )}>
                <stat.icon className={clsx(
                  'w-6 h-6',
                  stat.color.replace('from-', 'text-').split(' ')[0]
                )} />
              </div>
              <span className="text-sm font-semibold px-3 py-1 rounded-full bg-white/5">
                {stat.change}
              </span>
            </div>
            <h3 className="text-3xl font-bold mb-1">{stat.value}</h3>
            <p className="text-gray-400 font-medium">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">GitHub Repositories</h2>
            <p className="text-gray-400">Sync your Discord bots with GitHub</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={connectGitHub}
              className="px-6 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl font-semibold flex items-center gap-2"
            >
              <Github className="w-5 h-5" />
              Connect GitHub
            </button>
            <button
              onClick={() => fetchData()}
              className="px-4 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {repos.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 bg-gradient-to-b from-gray-900/50 to-transparent rounded-2xl border border-gray-800"
          >
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-800 to-gray-900 rounded-full flex items-center justify-center">
              <Github className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold mb-3">No GitHub repositories</h3>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              Connect your GitHub account to sync Discord bot code and enable automatic deployments
            </p>
            <button
              onClick={connectGitHub}
              className="px-8 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl font-semibold text-lg flex items-center gap-3 mx-auto"
            >
              <Github className="w-6 h-6" />
              Connect GitHub Account
            </button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {repos.map((repo, idx) => (
              <motion.div
                key={repo.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="group bg-gradient-to-br from-gray-900 to-gray-950 rounded-2xl border border-gray-800 p-6 hover:border-blue-500/50 transition-all"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-gray-800 rounded-xl">
                      <FolderGit2 className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-lg">{repo.repo_name}</h3>
                        {repo.private ? (
                          <Lock className="w-4 h-4 text-gray-400" />
                        ) : (
                          <Eye className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <a 
                          href={repo.repo_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hover:text-blue-400 flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          View on GitHub
                        </a>
                        {repo.last_sync && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Synced {new Date(repo.last_sync).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <Menu as="div" className="relative">
                    <Menu.Button className="p-2 hover:bg-white/5 rounded-lg">
                      <Settings className="w-5 h-5" />
                    </Menu.Button>
                    <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right bg-gray-900 border border-gray-800 rounded-xl shadow-2xl py-2 z-10">
                      <Menu.Item>
                        {({ active }) => (
                          <button className={clsx(
                            'w-full text-left px-4 py-3 flex items-center gap-3 text-sm',
                            active && 'bg-white/5'
                          )}>
                            <Copy className="w-4 h-4" />
                            Clone URL
                          </button>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <button 
                            onClick={() => createWebhook(repo.id)}
                            className={clsx(
                              'w-full text-left px-4 py-3 flex items-center gap-3 text-sm',
                              active && 'bg-white/5'
                            )}
                          >
                            <GitPullRequest className="w-4 h-4" />
                            Setup Webhook
                          </button>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <button className={clsx(
                            'w-full text-left px-4 py-3 flex items-center gap-3 text-sm text-red-400',
                            active && 'bg-red-500/10'
                          )}>
                            <Trash2 className="w-4 h-4" />
                            Disconnect
                          </button>
                        )}
                      </Menu.Item>
                    </Menu.Items>
                  </Menu>
                </div>

                {/* Sync Section */}
                <div className="bg-gray-800/50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Server className="w-4 h-4" />
                      <span className="font-medium">Sync with Discord Bot</span>
                    </div>
                    {repo.discord_bot_id && (
                      <span className="flex items-center gap-2 text-sm text-green-400">
                        <CheckCircle className="w-4 h-4" />
                        Synced
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <select
                      value={repo.discord_bot_id || ''}
                      onChange={(e) => {
                        if (e.target.value) {
                          syncRepo(repo.id, e.target.value)
                        }
                      }}
                      className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg"
                      disabled={syncing[repo.id]}
                    >
                      <option value="">Select a bot to sync</option>
                      {bots.map(bot => (
                        <option key={bot.id} value={bot.id}>
                          {bot.bot_name} ({bot.status})
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => syncRepo(repo.id, repo.discord_bot_id)}
                      disabled={!repo.discord_bot_id || syncing[repo.id]}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg flex items-center gap-2"
                    >
                      {syncing[repo.id] ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Syncing...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4" />
                          Sync Now
                        </>
                      )}
                    </button>
                  </div>

                  {repo.discord_bot_id && (
                    <div className="mt-4 p-3 bg-gray-900/50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Bot className="w-4 h-4" />
                          <span className="font-medium">
                            {bots.find(b => b.id === repo.discord_bot_id)?.bot_name}
                          </span>
                        </div>
                        <a 
                          href={`/dashboard?bot=${repo.discord_bot_id}`}
                          className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
                        >
                          Open Bot
                          <ChevronRight className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
