'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  Bot, Plus, Play, StopCircle, Trash2, Edit3, Copy, 
  ExternalLink, BarChart3, Users, Zap, ChevronRight, 
  Clock, Activity, Server, MoreVertical, Settings,
  Terminal, Code2, Database, Shield, Cpu
} from 'lucide-react'
import { Menu, Transition } from '@headlessui/react'
import clsx from 'clsx'
import BotEditor from './BotEditor'

export default function BotDashboard() {
  const [bots, setBots] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedBot, setSelectedBot] = useState(null)
  const [showEditor, setShowEditor] = useState(false)
  const [stats, setStats] = useState({
    totalBots: 0,
    onlineBots: 0,
    totalCommands: 0,
    avgUptime: 0
  })

  useEffect(() => {
    fetchBots()
    fetchStats()
  }, [])

  const fetchBots = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('Discord_bots')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      toast.error('Failed to load bots')
      return
    }

    setBots(data || [])
    setLoading(false)
  }

  const fetchStats = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: botsData } = await supabase
      .from('Discord_bots')
      .select('*')
      .eq('user_id', user.id)

    if (botsData) {
      const totalBots = botsData.length
      const onlineBots = botsData.filter(b => b.status === 'online').length
      const totalCommands = botsData.reduce((acc, bot) => 
        acc + (Array.isArray(bot.commands) ? bot.commands.length : 0), 0)
      
      setStats({
        totalBots,
        onlineBots,
        totalCommands,
        avgUptime: totalBots > 0 ? Math.round((onlineBots / totalBots) * 100) : 0
      })
    }
  }

  const createBot = async (formData) => {
    const { data: { user } } = await supabase.auth.getUser()
    
    const { data, error } = await supabase
      .from('Discord_bots')
      .insert([{
        bot_name: formData.name,
        bot_token: formData.token,
        client_id: 'pending',
        user_id: user.id,
        status: 'offline',
        commands: {
          code: defaultCode.replace('${formData.token}', formData.token),
          created_at: new Date().toISOString(),
          version: '1.0.0'
        },
        events: [],
        metadata: {
          version: '1.0.0',
          intents: 32767,
          permissions: '2147483647',
          created_via: 'dashboard'
        }
      }])
      .select()

    if (error) {
      toast.error(error.message || 'Failed to create bot')
      return
    }

    toast.success(`Bot "${formData.name}" created successfully!`)
    setBots([data[0], ...bots])
    setShowCreateModal(false)
    fetchStats()
  }

  const toggleBotStatus = async (bot) => {
    const newStatus = bot.status === 'online' ? 'offline' : 'online'
    
    const { error } = await supabase
      .from('Discord_bots')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', bot.id)

    if (error) {
      toast.error('Failed to update bot status')
      return
    }

    setBots(bots.map(b => b.id === bot.id ? { ...b, status: newStatus } : b))
    toast.success(`Bot ${newStatus === 'online' ? 'started' : 'stopped'}`)
    fetchStats()
  }

  const deleteBot = async (botId, botName) => {
    if (!confirm(`Are you sure you want to delete "${botName}"? This action cannot be undone.`)) return

    const { error } = await supabase
      .from('Discord_bots')
      .delete()
      .eq('id', botId)

    if (error) {
      toast.error('Failed to delete bot')
      return
    }

    toast.success('Bot deleted successfully')
    setBots(bots.filter(bot => bot.id !== botId))
    fetchStats()
  }

  const copyToken = (token) => {
    navigator.clipboard.writeText(token)
    toast.success('Token copied to clipboard')
  }

  const testBot = async (botId) => {
    toast.loading('Testing bot connection...')
    // Real API call to test bot
    try {
      const response = await fetch('/api/bot/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bot_id: botId })
      })
      
      if (response.ok) {
        toast.success('Bot test successful!')
      } else {
        toast.error('Bot test failed')
      }
    } catch (error) {
      toast.error('Test failed')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Bot className="w-10 h-10 text-blue-500" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { 
            label: 'Total Bots', 
            value: stats.totalBots, 
            change: '+2', 
            icon: Bot, 
            color: 'from-blue-500 to-cyan-500',
            bgColor: 'bg-gradient-to-br from-blue-500/10 to-cyan-500/10'
          },
          { 
            label: 'Online Now', 
            value: stats.onlineBots, 
            change: '+1', 
            icon: Activity, 
            color: 'from-green-500 to-emerald-500',
            bgColor: 'bg-gradient-to-br from-green-500/10 to-emerald-500/10'
          },
          { 
            label: 'Total Commands', 
            value: stats.totalCommands, 
            change: '+12', 
            icon: Code2, 
            color: 'from-purple-500 to-pink-500',
            bgColor: 'bg-gradient-to-br from-purple-500/10 to-pink-500/10'
          },
          { 
            label: 'Avg Uptime', 
            value: `${stats.avgUptime}%`, 
            change: '+0.5%', 
            icon: Server, 
            color: 'from-orange-500 to-red-500',
            bgColor: 'bg-gradient-to-br from-orange-500/10 to-red-500/10'
          }
        ].map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={clsx(
              'relative overflow-hidden rounded-2xl border border-white/5 p-6',
              stat.bgColor
            )}
          >
            <div className="absolute top-0 right-0 w-32 h-32 -translate-y-16 translate-x-16 opacity-10">
              <stat.icon className="w-full h-full" />
            </div>
            <div className="relative">
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
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Bot Management</h2>
            <p className="text-gray-400">Create, configure, and deploy your Discord bots</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-blue-500/25"
            >
              <Plus className="w-5 h-5" />
              New Bot
            </button>
            <Menu as="div" className="relative">
              <Menu.Button className="px-4 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl flex items-center gap-2">
                <MoreVertical className="w-5 h-5" />
              </Menu.Button>
              <Transition
                enter="transition duration-100 ease-out"
                enterFrom="transform scale-95 opacity-0"
                enterTo="transform scale-100 opacity-100"
                leave="transition duration-75 ease-out"
                leaveFrom="transform scale-100 opacity-100"
                leaveTo="transform scale-95 opacity-0"
              >
                <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right bg-gray-900 border border-gray-800 rounded-xl shadow-2xl py-2 z-10">
                  <Menu.Item>
                    {({ active }) => (
                      <button className={clsx(
                        'w-full text-left px-4 py-3 flex items-center gap-3',
                        active && 'bg-white/5'
                      )}>
                        <Settings className="w-4 h-4" />
                        Bot Settings
                      </button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button className={clsx(
                        'w-full text-left px-4 py-3 flex items-center gap-3',
                        active && 'bg-white/5'
                      )}>
                        <Terminal className="w-4 h-4" />
                        Debug Console
                      </button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button className={clsx(
                        'w-full text-left px-4 py-3 flex items-center gap-3',
                        active && 'bg-white/5'
                      )}>
                        <Database className="w-4 h-4" />
                        Database Manager
                      </button>
                    )}
                  </Menu.Item>
                </Menu.Items>
              </Transition>
            </Menu>
          </div>
        </div>

        {/* Bots Grid */}
        {bots.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 bg-gradient-to-b from-gray-900/50 to-transparent rounded-2xl border border-gray-800"
          >
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-full flex items-center justify-center">
              <Bot className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold mb-3">No bots created yet</h3>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              Create your first Discord bot to start building amazing experiences for your community
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-xl font-semibold text-lg"
            >
              Create Your First Bot
            </button>
          </motion.div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bots.map((bot, idx) => (
              <motion.div
                key={bot.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                className="group relative bg-gradient-to-br from-gray-900 to-gray-950 rounded-2xl border border-gray-800 p-6 hover:border-blue-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10"
              >
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
                
                <div className="relative">
                  {/* Bot Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className={clsx(
                        'relative p-3 rounded-xl',
                        bot.status === 'online' 
                          ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30' 
                          : 'bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30'
                      )}>
                        <Bot className={clsx(
                          'w-6 h-6',
                          bot.status === 'online' ? 'text-green-400' : 'text-red-400'
                        )} />
                        {bot.status === 'online' && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{bot.bot_name}</h3>
                        <div className="flex items-center gap-2">
                          <span className={clsx(
                            'text-xs px-3 py-1 rounded-full font-semibold',
                            bot.status === 'online'
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                              : 'bg-red-500/20 text-red-400 border border-red-500/30'
                          )}>
                            {bot.status === 'online' ? '● Online' : '○ Offline'}
                          </span>
                          <span className="text-xs text-gray-400">
                            ID: {bot.client_id || 'pending'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <Menu as="div" className="relative">
                      <Menu.Button className="p-2 hover:bg-white/5 rounded-lg">
                        <MoreVertical className="w-5 h-5" />
                      </Menu.Button>
                      <Transition
                        enter="transition duration-100 ease-out"
                        enterFrom="transform scale-95 opacity-0"
                        enterTo="transform scale-100 opacity-100"
                        leave="transition duration-75 ease-out"
                        leaveFrom="transform scale-100 opacity-100"
                        leaveTo="transform scale-95 opacity-0"
                      >
                        <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right bg-gray-900 border border-gray-800 rounded-xl shadow-2xl py-2 z-10">
                          <Menu.Item>
                            {({ active }) => (
                              <button 
                                onClick={() => copyToken(bot.bot_token)}
                                className={clsx(
                                  'w-full text-left px-4 py-3 flex items-center gap-3 text-sm',
                                  active && 'bg-white/5'
                                )}
                              >
                                <Copy className="w-4 h-4" />
                                Copy Token
                              </button>
                            )}
                          </Menu.Item>
                          <Menu.Item>
                            {({ active }) => (
                              <button 
                                onClick={() => testBot(bot.id)}
                                className={clsx(
                                  'w-full text-left px-4 py-3 flex items-center gap-3 text-sm',
                                  active && 'bg-white/5'
                                )}
                              >
                                <Terminal className="w-4 h-4" />
                                Test Connection
                              </button>
                            )}
                          </Menu.Item>
                          <Menu.Item>
                            {({ active }) => (
                              <button 
                                onClick={() => deleteBot(bot.id, bot.bot_name)}
                                className={clsx(
                                  'w-full text-left px-4 py-3 flex items-center gap-3 text-sm text-red-400',
                                  active && 'bg-red-500/10'
                                )}
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete Bot
                              </button>
                            )}
                          </Menu.Item>
                        </Menu.Items>
                      </Transition>
                    </Menu>
                  </div>

                  {/* Bot Metrics */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-3 bg-white/5 rounded-xl">
                      <div className="text-2xl font-bold text-blue-400">
                        {Array.isArray(bot.commands) ? bot.commands.length : 0}
                      </div>
                      <div className="text-xs text-gray-400">Commands</div>
                    </div>
                    <div className="text-center p-3 bg-white/5 rounded-xl">
                      <div className="text-2xl font-bold text-purple-400">
                        {Array.isArray(bot.events) ? bot.events.length : 0}
                      </div>
                      <div className="text-xs text-gray-400">Events</div>
                    </div>
                    <div className="text-center p-3 bg-white/5 rounded-xl">
                      <div className="text-2xl font-bold text-green-400">
                        24h
                      </div>
                      <div className="text-xs text-gray-400">Uptime</div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => toggleBotStatus(bot)}
                      className={clsx(
                        'flex-1 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all',
                        bot.status === 'online'
                          ? 'bg-gradient-to-r from-red-500/20 to-orange-500/20 text-red-400 hover:from-red-500/30 hover:to-orange-500/30 border border-red-500/30'
                          : 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 hover:from-green-500/30 hover:to-emerald-500/30 border border-green-500/30'
                      )}
                    >
                      {bot.status === 'online' ? (
                        <>
                          <StopCircle className="w-5 h-5" />
                          Stop
                        </>
                      ) : (
                        <>
                          <Play className="w-5 h-5" />
                          Start
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedBot(bot)
                        setShowEditor(true)
                      }}
                      className="flex-1 py-3 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-400 hover:from-blue-500/30 hover:to-cyan-500/30 border border-blue-500/30 rounded-xl font-semibold flex items-center justify-center gap-2"
                    >
                      <Edit3 className="w-5 h-5" />
                      Edit Code
                    </button>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-800">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Clock className="w-4 h-4" />
                      <span>Created {new Date(bot.created_at).toLocaleDateString()}</span>
                    </div>
                    <a 
                      href={`/bot/${bot.id}`}
                      className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
                    >
                      Details
                      <ChevronRight className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Create Bot Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateBotModal
            onSubmit={createBot}
            onClose={() => setShowCreateModal(false)}
          />
        )}
      </AnimatePresence>

      {/* Bot Editor */}
      <AnimatePresence>
        {showEditor && selectedBot && (
          <BotEditor
            bot={selectedBot}
            onClose={() => {
              setShowEditor(false)
              setSelectedBot(null)
              fetchBots()
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function CreateBotModal({ onSubmit, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    token: '',
    description: ''
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gradient-to-br from-gray-900 to-gray-950 rounded-2xl border border-gray-800 w-full max-w-lg overflow-hidden shadow-2xl"
      >
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-2xl font-bold">Create New Bot</h3>
              <p className="text-gray-400">Configure your Discord bot settings</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/5 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold mb-3">Bot Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 bg-gray-900/50 border border-gray-800 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all"
                placeholder="My Awesome Bot"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-3">Bot Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 bg-gray-900/50 border border-gray-800 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all resize-none"
                placeholder="What does your bot do?"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-3">Discord Bot Token</label>
              <input
                type="password"
                value={formData.token}
                onChange={(e) => setFormData({ ...formData, token: e.target.value })}
                className="w-full px-4 py-3 bg-gray-900/50 border border-gray-800 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all font-mono"
                placeholder="Enter your bot token"
                required
              />
              <p className="text-sm text-gray-400 mt-3">
                Get your token from the{' '}
                <a 
                  href="https://discord.com/developers/applications" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline"
                >
                  Discord Developer Portal
                </a>
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-xl font-semibold shadow-lg shadow-blue-500/25 transition-all"
              >
                Create Bot
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  )
}

const defaultCode = `const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { token } = process.env.DISCORD_TOKEN || '${formData.token}';

// Create a new client instance
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates
  ]
});

// Collections for commands and cooldowns
client.commands = new Collection();
client.cooldowns = new Collection();

// Ready event
client.once('ready', () => {
  console.log(\`✅ Logged in as \${client.user.tag}\`);
  client.user.setPresence({
    activities: [{ name: 'with Discord.js', type: 0 }],
    status: 'online'
  });
});

// Message handler
client.on('messageCreate', async message => {
  if (message.author.bot) return;

  const prefix = '!';
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/\\s+/);
  const command = args.shift().toLowerCase();

  switch (command) {
    case 'ping':
      const sent = await message.reply('🏓 Pinging...');
      const latency = sent.createdTimestamp - message.createdTimestamp;
      const apiLatency = Math.round(client.ws.ping);
      
      await sent.edit(\`🏓 Pong!\\n📊 Message latency: \${latency}ms\\n🌐 API latency: \${apiLatency}ms\`);
      break;

    case 'help':
      const embed = {
        color: 0x5865F2,
        title: '🤖 Bot Commands',
        description: 'Available commands:',
        fields: [
          { name: '!ping', value: 'Check bot latency', inline: true },
          { name: '!help', value: 'Show this help menu', inline: true },
          { name: '!user', value: 'Get user information', inline: true },
          { name: '!server', value: 'Get server information', inline: true }
        ],
        timestamp: new Date().toISOString(),
        footer: { text: 'Created with Discord Bot Creator' }
      };
      await message.reply({ embeds: [embed] });
      break;

    default:
      await message.reply(\`Unknown command: \${command}. Use !help for available commands.\`);
  }
});

// Error handling
client.on('error', console.error);
process.on('unhandledRejection', console.error);

// Login to Discord
client.login(token).catch(error => {
  console.error('Failed to login:', error);
  process.exit(1);
});`
