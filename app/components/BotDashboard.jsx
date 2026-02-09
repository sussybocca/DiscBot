'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  Bot, Plus, Play, StopCircle, Trash2, Edit3,
  Copy, ExternalLink, BarChart3, Users, Zap,
  ChevronRight, Clock, Activity, Server
} from 'lucide-react'
import Link from 'next/link'
import BotEditor from './BotEditor'
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'

const statsData = [
  { name: 'Total Bots', value: 5, change: '+2', icon: Bot, color: 'text-discord-blurple' },
  { name: 'Active Bots', value: 3, change: '+1', icon: Activity, color: 'text-discord-green' },
  { name: 'Total Users', value: '1.2k', change: '+120', icon: Users, color: 'text-discord-fuchsia' },
  { name: 'Uptime', value: '99.8%', change: '+0.2%', icon: Server, color: 'text-discord-yellow' },
]

const activityData = [
  { time: '10:00', commands: 120, errors: 2 },
  { time: '11:00', commands: 180, errors: 1 },
  { time: '12:00', commands: 220, errors: 0 },
  { time: '13:00', commands: 190, errors: 3 },
  { time: '14:00', commands: 250, errors: 1 },
  { time: '15:00', commands: 300, errors: 2 },
  { time: '16:00', commands: 280, errors: 0 },
]

const commandData = [
  { name: '!help', value: 35, color: '#5865F2' },
  { name: '!ping', value: 25, color: '#57F287' },
  { name: '!play', value: 20, color: '#FEE75C' },
  { name: '!info', value: 15, color: '#EB459E' },
  { name: 'Other', value: 5, color: '#ED4245' },
]

export default function BotDashboard() {
  const [bots, setBots] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedBot, setSelectedBot] = useState(null)
  const [showEditor, setShowEditor] = useState(false)

  useEffect(() => {
    fetchBots()
  }, [])

  const fetchBots = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('Discord_bots')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setBots(data)
    }
    setLoading(false)
  }

  const handleCreateBot = async (formData) => {
    const { data: { user } } = await supabase.auth.getUser()
    
    const { data, error } = await supabase
      .from('Discord_bots')
      .insert([{
        bot_name: formData.name,
        bot_token: formData.token,
        client_id: 'pending',
        user_id: user.id,
        status: 'offline',
        commands: { code: defaultCode, last_updated: new Date().toISOString() }
      }])
      .select()

    if (!error && data) {
      toast.success(`Bot "${formData.name}" created successfully!`)
      setBots([data[0], ...bots])
      setShowCreateModal(false)
    } else {
      toast.error('Failed to create bot')
    }
  }

  const toggleBotStatus = async (bot) => {
    const newStatus = bot.status === 'online' ? 'offline' : 'online'
    
    const { error } = await supabase
      .from('Discord_bots')
      .update({ status: newStatus })
      .eq('id', bot.id)

    if (!error) {
      toast.success(`Bot ${newStatus === 'online' ? 'started' : 'stopped'}`)
      setBots(bots.map(b => b.id === bot.id ? { ...b, status: newStatus } : b))
    }
  }

  const deleteBot = async (botId, botName) => {
    if (!confirm(`Are you sure you want to delete "${botName}"?`)) return

    const { error } = await supabase
      .from('Discord_bots')
      .delete()
      .eq('id', botId)

    if (!error) {
      toast.success('Bot deleted successfully')
      setBots(bots.filter(bot => bot.id !== botId))
    }
  }

  const copyToken = (token) => {
    navigator.clipboard.writeText(token)
    toast.success('Token copied to clipboard')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-discord-blurple/30 border-t-discord-blurple rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Bot className="w-8 h-8 text-discord-blurple" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsData.map((stat, idx) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="panel p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <stat.icon className={`w-8 h-8 ${stat.color}`} />
              <span className="text-sm font-semibold px-2 py-1 rounded-full bg-white/5">
                {stat.change}
              </span>
            </div>
            <h3 className="text-2xl font-bold mb-1">{stat.value}</h3>
            <p className="text-discord-light-gray">{stat.name}</p>
          </motion.div>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column - Bots List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Your Bots</h2>
              <p className="text-discord-light-gray">Manage and deploy your Discord bots</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              <span>New Bot</span>
            </button>
          </div>

          {/* Bots Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {bots.map((bot, idx) => (
              <motion.div
                key={bot.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                className="panel p-6 card-hover"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      bot.status === 'online' ? 'bg-discord-green/20' : 
                      bot.status === 'testing' ? 'bg-discord-yellow/20' : 'bg-discord-red/20'
                    }`}>
                      <Bot className={`w-6 h-6 ${
                        bot.status === 'online' ? 'text-discord-green' : 
                        bot.status === 'testing' ? 'text-discord-yellow' : 'text-discord-red'
                      }`} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{bot.bot_name}</h3>
                      <div className="flex items-center gap-2">
                        <span className={`badge ${
                          bot.status === 'online' ? 'status-online' : 
                          bot.status === 'testing' ? 'status-testing' : 'status-offline'
                        }`}>
                          {bot.status}
                        </span>
                        <span className="text-sm text-discord-light-gray">
                          {bot.commands?.length || 0} commands
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => copyToken(bot.bot_token)}
                      className="p-2 hover:bg-white/5 rounded-lg"
                      title="Copy token"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteBot(bot.id, bot.bot_name)}
                      className="p-2 hover:bg-red-500
