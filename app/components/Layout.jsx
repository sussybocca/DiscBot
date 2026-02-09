'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Toaster } from 'react-hot-toast'
import { usePathname } from 'next/navigation'
import Header from './Header'
import { Bot, Code, Github, Sparkles } from 'lucide-react'

export default function Layout({ children }) {
  const pathname = usePathname()
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const gradientPos = {
    background: `radial-gradient(600px at ${mousePosition.x}px ${mousePosition.y}px, rgba(88, 101, 242, 0.15), transparent 80%)`
  }

  return (
    <div className="min-h-screen bg-discord-darkest overflow-hidden relative">
      {/* Animated background */}
      <div className="fixed inset-0 grid-background opacity-30" />
      <div className="fixed inset-0" style={gradientPos} />
      
      {/* Floating particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-[1px] h-[1px] bg-discord-blurple rounded-full"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            animate={{
              y: [null, Math.random() * -100],
              x: [null, Math.random() * 100 - 50],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        ))}
      </div>

      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#1E1F22',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
          },
          success: {
            iconTheme: {
              primary: '#57F287',
              secondary: '#1E1F22',
            },
          },
          error: {
            iconTheme: {
              primary: '#ED4245',
              secondary: '#1E1F22',
            },
          },
        }}
      />

      <Header />

      <AnimatePresence mode="wait">
        <motion.main
          key={pathname}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="relative z-10"
        >
          {children}
        </motion.main>
      </AnimatePresence>

      {/* Feature showcase */}
      {pathname === '/' && (
        <div className="fixed bottom-8 right-8 flex gap-4">
          {[
            { icon: Bot, label: 'Bot Builder', color: 'text-discord-blurple' },
            { icon: Code, label: 'Code Editor', color: 'text-discord-green' },
            { icon: Github, label: 'GitHub Sync', color: 'text-discord-light-gray' },
            { icon: Sparkles, label: 'AI Assistant', color: 'text-discord-fuchsia' },
          ].map((feature, idx) => (
            <motion.div
              key={feature.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="glass-dark px-4 py-2 rounded-lg flex items-center gap-2 backdrop-blur-sm"
            >
              <feature.icon className={`w-4 h-4 ${feature.color}`} />
              <span className="text-sm font-medium">{feature.label}</span>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
