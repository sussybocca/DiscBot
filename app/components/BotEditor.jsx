'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import Editor from '@monaco-editor/react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  Save, X, Play, Terminal, Copy, Download, Bot,
  RefreshCw, CheckCircle, AlertCircle, Loader2,
  Send, TestTube, Cpu, Shield, Zap, Brain
} from 'lucide-react'
import clsx from 'clsx'

export default function BotEditor({ bot, onClose }) {
  const [code, setCode] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [terminalOutput, setTerminalOutput] = useState([])
  const [showTerminal, setShowTerminal] = useState(false)
  const [activeTab, setActiveTab] = useState('bot.js')
  const editorRef = useRef(null)

  // REAL Discord bot code template
  const defaultCode = `// Discord Bot Template
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

// Create a new Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Bot ready event
client.once('ready', () => {
  console.log(\`✅ Bot is online as \${client.user.tag}\`);
  client.user.setActivity('with Discord.js');
});

// Message handler
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  
  // Ping command
  if (message.content === '!ping') {
    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('🏓 Pong!')
      .setDescription(\`Latency: \${Date.now() - message.createdTimestamp}ms\\nAPI: \${Math.round(client.ws.ping)}ms\`);
    
    await message.reply({ embeds: [embed] });
  }
  
  // Help command
  if (message.content === '!help') {
    const embed = new EmbedBuilder()
      .setColor(0x57F287)
      .setTitle('🤖 Bot Commands')
      .addFields(
        { name: '!ping', value: 'Check bot latency', inline: true },
        { name: '!help', value: 'Show this menu', inline: true },
        { name: '!info', value: 'Bot information', inline: true }
      );
    
    await message.reply({ embeds: [embed] });
  }
});

// Login with your bot token
client.login('YOUR_BOT_TOKEN_HERE').catch(console.error);`

  useEffect(() => {
    if (bot?.commands?.code) {
      setCode(bot.commands.code)
    } else {
      setCode(defaultCode.replace('YOUR_BOT_TOKEN_HERE', bot?.bot_token || 'YOUR_TOKEN'))
    }
  }, [bot])

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor
    
    // Configure Monaco for Discord.js
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false
    })

    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      allowNonTsExtensions: true
    })
  }

  const saveCode = async () => {
    setIsSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('Discord_bots')
        .update({
          commands: { 
            code,
            updated_at: new Date().toISOString(),
            version: '1.0.0'
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', bot.id)
        .eq('user_id', user.id)

      if (error) throw error

      toast.success('Code saved successfully!')
      
      // Also push to GitHub if linked
      const { data: repo } = await supabase
        .from('Github_Repos')
        .select('*')
        .eq('discord_bot_id', bot.id)
        .single()

      if (repo) {
        await pushToGitHub(repo, code)
      }
      
    } catch (error) {
      toast.error('Failed to save: ' + error.message)
    } finally {
      setIsSaving(false)
    }
  }

  const pushToGitHub = async (repo, code) => {
    try {
      // Get GitHub token from Supabase session
      const { data: { session } } = await supabase.auth.getSession()
      const githubToken = session?.provider_token

      if (!githubToken) {
        toast.error('GitHub token not found')
        return
      }

      const response = await fetch('/api/github/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${githubToken}`
        },
        body: JSON.stringify({
          repo_name: repo.repo_name,
          content: code,
          path: 'bot.js',
          message: 'Update Discord bot code'
        })
      })

      if (response.ok) {
        toast.success('Pushed to GitHub!')
      }
    } catch (error) {
      console.error('GitHub push failed:', error)
    }
  }

  const testBot = async () => {
    setIsRunning(true)
    setShowTerminal(true)
    
    // Add initial terminal message
    setTerminalOutput(prev => [...prev, {
      type: 'info',
      message: '🚀 Starting bot test...',
      timestamp: new Date()
    }])

    try {
      // Test Discord API connection
      const response = await fetch('/api/bot/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          bot_token: bot.bot_token,
          code: code 
        })
      })

      const result = await response.json()

      setTerminalOutput(prev => [...prev, {
        type: response.ok ? 'success' : 'error',
        message: response.ok ? '✅ Bot test passed!' : '❌ Bot test failed',
        timestamp: new Date()
      }])

      if (response.ok) {
        toast.success('Bot test successful!')
      } else {
        toast.error('Bot test failed: ' + (result.error || 'Unknown error'))
      }
    } catch (error) {
      setTerminalOutput(prev => [...prev, {
        type: 'error',
        message: '❌ Test failed: ' + error.message,
        timestamp: new Date()
      }])
      toast.error('Test failed')
    } finally {
      setIsRunning(false)
    }
  }

  const deployBot = async () => {
    toast.loading('Deploying bot...')
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      const response = await fetch('/api/bot/deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          bot_id: bot.id,
          code: code,
          token: bot.bot_token
        })
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('Bot deployed successfully!')
        
        // Update bot status
        await supabase
          .from('Discord_bots')
          .update({ status: 'deployed' })
          .eq('id', bot.id)
      } else {
        toast.error('Deployment failed: ' + (result.error || 'Unknown error'))
      }
    } catch (error) {
      toast.error('Deployment failed')
    }
  }

  const copyCode = () => {
    navigator.clipboard.writeText(code)
    toast.success('Code copied to clipboard')
  }

  const downloadCode = () => {
    const blob = new Blob([code], { type: 'application/javascript' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'bot.js'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Code downloaded')
  }

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Bot className="w-5 h-5" />
                  {bot.bot_name} - Editor
                </h2>
                <div className="flex items-center gap-3 text-sm">
                  <span className={clsx(
                    'px-2 py-1 rounded text-xs font-medium',
                    bot.status === 'online' 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-red-500/20 text-red-400'
                  )}>
                    {bot.status}
                  </span>
                  <span className="text-gray-400">
                    ID: {bot.id.slice(0, 8)}...
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={copyCode}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Copy className="w-4 h-4" />
                Copy
              </button>
              <button
                onClick={downloadCode}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
              <button
                onClick={saveCode}
                disabled={isSaving}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {isSaving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={testBot}
                disabled={isRunning}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                {isRunning ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <TestTube className="w-4 h-4" />
                )}
                {isRunning ? 'Testing...' : 'Test Bot'}
              </button>
              <button
                onClick={deployBot}
                className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Send className="w-4 h-4" />
                Deploy
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4">
            {['bot.js', 'config.json', 'package.json', 'commands'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={clsx(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  activeTab === tab
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor */}
        <div className="flex-1">
          <Editor
            height="100%"
            language="javascript"
            value={code}
            onChange={setCode}
            theme="vs-dark"
            onMount={handleEditorDidMount}
            options={{
              minimap: { enabled: true },
              fontSize: 14,
              wordWrap: 'on',
              automaticLayout: true,
              formatOnPaste: true,
              formatOnType: true,
              suggestOnTriggerCharacters: true,
              acceptSuggestionOnEnter: 'on',
              tabCompletion: 'on',
              wordBasedSuggestions: true,
              parameterHints: { enabled: true },
              scrollBeyondLastLine: false,
              renderLineHighlight: 'all',
              cursorBlinking: 'smooth',
              cursorSmoothCaretAnimation: 'on',
              smoothScrolling: true
            }}
          />
        </div>

        {/* Side Panel */}
        <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
          {/* AI Suggestions */}
          <div className="p-4 border-b border-gray-700">
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-400" />
              AI Suggestions
            </h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {AI_SUGGESTIONS.slice(0, 5).map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setCode(prev => prev + `\n\n// ${suggestion}\n// TODO: Implement this feature`)
                    toast.success('Suggestion added')
                  }}
                  className="w-full text-left p-3 bg-gray-900 hover:bg-gray-700 rounded-lg text-sm transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          {/* Terminal */}
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <h3 className="font-bold flex items-center gap-2">
                <Terminal className="w-4 h-4" />
                Terminal
              </h3>
              <button
                onClick={() => setShowTerminal(!showTerminal)}
                className="p-1 hover:bg-gray-700 rounded"
              >
                {showTerminal ? 'Hide' : 'Show'}
              </button>
            </div>
            
            {showTerminal && (
              <div className="flex-1 bg-black p-4 font-mono text-sm overflow-auto">
                {terminalOutput.length === 0 ? (
                  <div className="text-gray-500">$ Ready for commands...</div>
                ) : (
                  terminalOutput.map((log, idx) => (
                    <div
                      key={idx}
                      className={clsx(
                        'mb-2',
                        log.type === 'error' && 'text-red-400',
                        log.type === 'success' && 'text-green-400',
                        log.type === 'info' && 'text-blue-400'
                      )}
                    >
                      [{log.timestamp.toLocaleTimeString()}] {log.message}
                    </div>
                  ))
                )}
                
                {isRunning && (
                  <div className="flex items-center gap-2 text-yellow-400">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Testing bot...
                  </div>
                )}
              </div>
            )}

            {/* Quick Actions */}
            <div className="p-4 border-t border-gray-700">
              <h3 className="font-bold mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                Quick Actions
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setCode(defaultCode)
                    toast.success('Template loaded')
                  }}
                  className="p-2 bg-gray-900 hover:bg-gray-700 rounded text-sm"
                >
                  Load Template
                </button>
                <button
                  onClick={() => {
                    const formatted = code.replace(/\n\s*\n\s*\n/g, '\n\n')
                    setCode(formatted)
                    toast.success('Code formatted')
                  }}
                  className="p-2 bg-gray-900 hover:bg-gray-700 rounded text-sm"
                >
                  Format Code
                </button>
                <button
                  onClick={async () => {
                    const { data: { user } } = await supabase.auth.getUser()
                    const discordToken = user?.user_metadata?.provider_token
                    
                    if (discordToken) {
                      // Use Discord OAuth token to validate bot
                      toast.loading('Validating bot token...')
                    } else {
                      toast.error('Discord token not found')
                    }
                  }}
                  className="p-2 bg-gray-900 hover:bg-gray-700 rounded text-sm"
                >
                  Validate Token
                </button>
                <button
                  onClick={() => {
                    // Create invite link using bot client ID
                    const clientId = bot.client_id
                    if (clientId && clientId !== 'pending') {
                      const inviteLink = `https://discord.com/oauth2/authorize?client_id=${clientId}&scope=bot&permissions=8`
                      navigator.clipboard.writeText(inviteLink)
                      toast.success('Invite link copied!')
                    } else {
                      toast.error('Client ID not available')
                    }
                  }}
                  className="p-2 bg-gray-900 hover:bg-gray-700 rounded text-sm"
                >
                  Get Invite Link
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
