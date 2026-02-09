'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Bot, Github, Code, Server, Zap, ArrowRight, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'

export default function HomePage() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const handleLogin = async (provider) => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    if (error) toast.error(error.message)
  }

  const features = [
    {
      icon: Bot,
      title: 'Discord Bot Creation',
      description: 'Build, test, and deploy Discord bots directly from your browser'
    },
    {
      icon: Github,
      title: 'GitHub Integration',
      description: 'Automatically sync your bot code to GitHub repositories'
    },
    {
      icon: Code,
      title: 'Live Code Editor',
      description: 'Write JavaScript with full IntelliSense and real-time preview'
    },
    {
      icon: Server,
      title: 'Bot Hosting',
      description: 'Deploy your bots with one click - no server setup required'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      {/* Header */}
      <header className="container mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Bot className="w-7 h-7" />
            </div>
            <span className="text-2xl font-bold">Discord Bot Creator</span>
          </div>
          <div className="flex gap-4">
            {user ? (
              <a 
                href="/dashboard" 
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium"
              >
                Dashboard
              </a>
            ) : (
              <>
                <button 
                  onClick={() => handleLogin('discord')}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium"
                >
                  Login with Discord
                </button>
                <button 
                  onClick={() => handleLogin('github')}
                  className="px-6 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg font-medium"
                >
                  Login with GitHub
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-6 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-bold mb-6"
          >
            Create Professional
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600">
              Discord Bots
            </span>
          </motion.h1>
          
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Build, deploy, and manage Discord bots with our complete platform. 
            No coding experience required.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
            <button 
              onClick={() => handleLogin('discord')}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl text-lg font-semibold flex items-center justify-center gap-3"
            >
              <Bot className="w-6 h-6" />
              Start with Discord
              <ArrowRight className="w-5 h-5" />
            </button>
            <button 
              onClick={() => handleLogin('github')}
              className="px-8 py-4 bg-gray-900 hover:bg-gray-800 border border-gray-700 rounded-xl text-lg font-semibold flex items-center justify-center gap-3"
            >
              <Github className="w-6 h-6" />
              Connect GitHub
            </button>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 hover:border-blue-500/50 transition-all"
              >
                <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>

          {/* Stats */}
          <div className="mt-20 pt-10 border-t border-gray-800">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400">10,000+</div>
                <div className="text-gray-400">Bots Created</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-400">99.8%</div>
                <div className="text-gray-400">Uptime</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400">24/7</div>
                <div className="text-gray-400">Support</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-400">∞</div>
                <div className="text-gray-400">Possibilities</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
