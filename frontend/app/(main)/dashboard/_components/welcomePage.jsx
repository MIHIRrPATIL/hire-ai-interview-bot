'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../../services/supabaseClient'
import { getUserDisplayName } from '../../../../lib/utils'
import { useRouter } from 'next/navigation'
import { 
  Calendar, 
  Video, 
  Users, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  ArrowRight,
  Sparkles,
  Plus
} from 'lucide-react'

export default function WelcomePage() {
  const [user, setUser] = useState(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
      }
    }

    checkUser()

    // Update time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)

    return () => clearInterval(timer)
  }, [])

  const getGreeting = () => {
    const hour = currentTime.getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const getTimeString = () => {
    return currentTime.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
  }

  const getDateString = () => {
    return currentTime.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const displayName = getUserDisplayName(user)

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              <span className="text-sm font-medium opacity-90">{getTimeString()}</span>
            </div>
            <h1 className="text-3xl font-bold">
              {getGreeting()}, {displayName}! 👋
            </h1>
            <p className="text-blue-100 text-lg">
              {getDateString()}
            </p>
          </div>
          <div className="hidden md:block">
            <div className="text-right">
              <div className="text-2xl font-bold">{getTimeString()}</div>
              <div className="text-blue-100 text-sm">{getDateString()}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Today's Interviews</p>
              <p className="text-2xl font-bold text-gray-900">5</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Video className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center text-sm text-green-600">
            <TrendingUp className="w-4 h-4 mr-1" />
            <span>+2 from yesterday</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Reviews</p>
              <p className="text-2xl font-bold text-gray-900">8</p>
            </div>
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center text-sm text-yellow-600">
            <span>3 require attention</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed Today</p>
              <p className="text-2xl font-bold text-gray-900">3</p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center text-sm text-green-600">
            <span>100% success rate</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1">
            View all
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        
        {/* Create New Interview CTA */}
        <div className="mb-6">
          <button 
            onClick={() => router.push('/dashboard/create-interview')}
            className="w-full flex items-center justify-center p-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-sm hover:shadow-md group"
          >
            <Plus className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
            <span className="font-semibold text-lg">Create New Interview</span>
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button 
            onClick={() => router.push('/dashboard/create-interview')}
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
          >
            <div className="p-2 bg-blue-100 rounded-lg mr-3 group-hover:bg-blue-200 transition-colors">
              <Video className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">Start Interview</p>
              <p className="text-sm text-gray-500">Begin a new session</p>
            </div>
          </button>
          
          <button 
            onClick={() => router.push('/schedule')}
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
          >
            <div className="p-2 bg-green-100 rounded-lg mr-3 group-hover:bg-green-200 transition-colors">
              <Calendar className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">Schedule Interview</p>
              <p className="text-sm text-gray-500">Plan upcoming sessions</p>
            </div>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1">
            View all
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-4">
          <div className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Interview completed with John Doe</p>
              <p className="text-xs text-gray-500">Frontend Developer • 2 hours ago</p>
            </div>
            <div className="text-xs text-gray-400">Score: 85%</div>
          </div>
          <div className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">New interview scheduled</p>
              <p className="text-xs text-gray-500">Product Manager • 4 hours ago</p>
            </div>
            <div className="text-xs text-gray-400">Tomorrow 10:00 AM</div>
          </div>
          <div className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Interview in progress</p>
              <p className="text-xs text-gray-500">Data Scientist • 1 day ago</p>
            </div>
            <div className="text-xs text-gray-400">In Progress</div>
          </div>
        </div>
      </div>
    </div>
  )
} 