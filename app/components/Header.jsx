'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import toast from 'react-hot-toast'
import {
  Menu, X, Bot, Code, Github, Settings, LogOut, User,
  Bell, HelpCircle, Sparkles, ChevronDown, ExternalLink
} from 'lucide-react'
import { Menu as HeadlessMenu, Transition } from '@headlessui/react'

export default function Header() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [notifications, setNotifications] = useState(3)
  const pathname = usePathname()

  useEffect(() => {
    checkUser()
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null)
        if (event === 'SIGNED_IN') {
          toast.success('Successfully logged in!')
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    toast.success('Logged out successfully')
    window.location.href = '/'
  }

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: Bot },
    { name: 'Bot Editor', href: '/editor', icon: Code },
    { name: 'Repositories', href: '/repos', icon: Github },
    { name: 'Settings', href: '/settings', icon: Settings },
  ]

  return (
    <header className="sticky top-0 z-50 glass border-b border-white/5 backdrop-blur-xl">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-discord-blurple to-discord-fuchsia rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <motion.div
                className="absolute -inset-1 bg-gradient-to-r from-discord-blurple to-discord-fuchsia rounded-xl blur opacity-30 group-hover:opacity-70 transition-opacity -z-10"
                animate={{
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
              />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-discord-blurple via-white to-discord-green bg-clip-text text-transparent">
                BotForge Studio
              </h1>
              <p className="text-xs text-discord-light-gray">Professional Discord Bot Creator</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300 ${
                  pathname.startsWith(item.href)
                    ? 'bg-discord-blurple/20 text-white border border-discord-blurple/30'
                    : 'text-discord-light-gray hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span className="font-medium">{item.name}</span>
              </Link>
            ))}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center gap-4">
            {/* AI Assistant Button */}
            <button className="hidden md:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-discord-fuchsia to-discord-blurple rounded-lg hover:shadow-glow transition-all">
              <Sparkles className="w-4 h-4" />
              <span className="font-semibold">AI Assistant</span>
            </button>

            {/* Notifications */}
            <button className="relative p-2 rounded-lg hover:bg-white/5 transition-colors">
              <Bell className="w-5 h-5" />
              {notifications > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-discord-red rounded-full text-xs flex items-center justify-center">
                  {notifications}
                </span>
              )}
            </button>

            {/* Help */}
            <Link href="/help" className="p-2 rounded-lg hover:bg-white/5 transition-colors">
              <HelpCircle className="w-5 h-5" />
            </Link>

            {user ? (
              <HeadlessMenu as="div" className="relative">
                <HeadlessMenu.Button className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors">
                  <div className="w-8 h-8 bg-gradient-to-br from-discord-blurple to-discord-green rounded-full flex items-center justify-center">
                    {user.user_metadata.avatar_url ? (
                      <img
                        src={user.user_metadata.avatar_url}
                        alt="Profile"
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <User className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-semibold">
                      {user.user_metadata.full_name || user.email?.split('@')[0]}
                    </p>
                    <p className="text-xs text-discord-light-gray">
                      {user.user_metadata.provider || 'User'}
                    </p>
                  </div>
                  <ChevronDown className="w-4 h-4" />
                </HeadlessMenu.Button>

                <Transition
                  enter="transition duration-100 ease-out"
                  enterFrom="transform scale-95 opacity-0"
                  enterTo="transform scale-100 opacity-100"
                  leave="transition duration-75 ease-out"
                  leaveFrom="transform scale-100 opacity-100"
                  leaveTo="transform scale-95 opacity-0"
                >
                  <HeadlessMenu.Items className="absolute right-0 mt-2 w-56 origin-top-right panel divide-y divide-white/5 shadow-2xl">
                    <div className="p-2">
                      <HeadlessMenu.Item>
                        {({ active }) => (
                          <Link
                            href="/profile"
                            className={`${active ? 'bg-white/5' : ''} flex items-center gap-3 w-full px-3 py-2 rounded-lg`}
                          >
                            <User className="w-4 h-4" />
                            <span>Profile</span>
                          </Link>
                        )}
                      </HeadlessMenu.Item>
                      <HeadlessMenu.Item>
                        {({ active }) => (
                          <Link
                            href="/settings"
                            className={`${active ? 'bg-white/5' : ''} flex items-center gap-3 w-full px-3 py-2 rounded-lg`}
                          >
                            <Settings className="w-4 h-4" />
                            <span>Settings</span>
                          </Link>
                        )}
                      </HeadlessMenu.Item>
                    </div>
                    <div className="p-2">
                      <HeadlessMenu.Item>
                        {({ active }) => (
                          <button
                            onClick={handleLogout}
                            className={`${active ? 'bg-red-500/20 text-red-400' : ''} flex items-center gap-3 w-full px-3 py-2 rounded-lg`}
                          >
                            <LogOut className="w-4 h-4" />
                            <span>Logout</span>
                          </button>
                        )}
                      </HeadlessMenu.Item>
                    </div>
                  </HeadlessMenu.Items>
                </Transition>
              </HeadlessMenu>
            ) : (
              <div className="flex gap-2">
                <Link
                  href="/api/auth?provider=discord"
                  className="btn-primary flex items-center gap-2"
                >
                  <Bot className="w-4 h-4" />
                  <span>Login with Discord</span>
                </Link>
                <Link
                  href="/api/auth?provider=github"
                  className="btn-secondary flex items-center gap-2"
                >
                  <Github className="w-4 h-4" />
                  <span>GitHub</span>
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-white/5"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden mt-4 pb-4 border-t border-white/10 pt-4"
            >
              <div className="space-y-2">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
                      pathname.startsWith(item.href)
                        ? 'bg-discord-blurple/20 text-white'
                        : 'text-discord-light-gray hover:bg-white/5'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                ))}
                {!user && (
                  <>
                    <Link
                      href="/api/auth?provider=discord"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 bg-discord-blurple rounded-lg"
                    >
                      <Bot className="w-5 h-5" />
                      <span>Login with Discord</span>
                    </Link>
                    <Link
                      href="/api/auth?provider=github"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 bg-discord-darker border border-discord-gray rounded-lg"
                    >
                      <Github className="w-5 h-5" />
                      <span>Login with GitHub</span>
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  )
}
