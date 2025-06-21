'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../services/supabaseClient'
import { useRouter } from 'next/navigation'
import { User, Calendar, Bell, Clock, Briefcase, Users, MapPin, Plus, Eye } from 'lucide-react'
import { getUserDisplayName } from '../../../lib/utils'

export default function SchedulePage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [interviews, setInterviews] = useState([])
  const [interviewsLoading, setInterviewsLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth')
        return
      }
      setUser(user)
      setLoading(false)
    }

    checkUser()
  }, [router])

  useEffect(() => {
    const fetchInterviews = async () => {
      try {
        const { data, error } = await supabase
          .from('interviews')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error fetching interviews:', error)
        } else {
          setInterviews(data || [])
        }
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setInterviewsLoading(false)
      }
    }

    if (!loading) {
      fetchInterviews()
    }
  }, [loading])

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getUpcomingInterviews = () => {
    const now = new Date()
    return interviews.filter(interview => {
      const interviewDate = new Date(interview.created_at)
      return interviewDate >= now
    }).sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
  }

  const getTodayInterviews = () => {
    const today = new Date()
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59)
    
    return interviews.filter(interview => {
      const interviewDate = new Date(interview.created_at)
      return interviewDate >= todayStart && interviewDate <= todayEnd
    })
  }

  const getWeekInterviews = () => {
    const today = new Date()
    const weekStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay())
    const weekEnd = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 6, 23, 59, 59)
    
    return interviews.filter(interview => {
      const interviewDate = new Date(interview.created_at)
      return interviewDate >= weekStart && interviewDate <= weekEnd
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  const displayName = getUserDisplayName(user)
  const upcomingInterviews = getUpcomingInterviews()
  const todayInterviews = getTodayInterviews()
  const weekInterviews = getWeekInterviews()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Schedule</h1>
            <p className="text-gray-600">Manage your interview schedule</p>
          </div>
          <div className="flex items-center space-x-4">
            <button className="p-2 text-gray-400 hover:text-gray-600">
              <Bell className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm text-gray-700">{displayName}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Today</p>
                  <p className="text-2xl font-bold text-gray-900">{todayInterviews.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">This Week</p>
                  <p className="text-2xl font-bold text-gray-900">{weekInterviews.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Upcoming</p>
                  <p className="text-2xl font-bold text-gray-900">{upcomingInterviews.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Today's Interviews */}
          {todayInterviews.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Today's Interviews</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {todayInterviews.map((interview) => (
                  <div key={interview.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Briefcase className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{interview.jobPosition || 'Interview'}</h3>
                          <p className="text-sm text-gray-500">{formatTime(interview.created_at)}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(interview.status || 'scheduled')}`}>
                        {interview.status || 'Scheduled'}
                      </span>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="w-4 h-4 mr-2" />
                        <span>{interview.duration || 'N/A'} minutes</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="w-4 h-4 mr-2" />
                        <span>{interview.type || 'General'} Interview</span>
                      </div>
                    </div>

                    <button 
                      onClick={() => router.push(`/interview/${interview.interview_id}`)}
                      className="w-full bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View Interview
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Interviews */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Interviews</h2>
            
            {interviewsLoading ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading interviews...</p>
              </div>
            ) : upcomingInterviews.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Upcoming Interviews</h3>
                <p className="text-gray-600">No interviews are scheduled for the future.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingInterviews.map((interview) => (
                  <div key={interview.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Briefcase className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{interview.jobPosition || 'Interview'}</h3>
                          <p className="text-sm text-gray-500">ID: {interview.interview_id}</p>
                          <div className="flex items-center space-x-4 mt-2">
                            <div className="flex items-center text-sm text-gray-600">
                              <Calendar className="w-4 h-4 mr-1" />
                              <span>{formatDate(interview.created_at)}</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <Clock className="w-4 h-4 mr-1" />
                              <span>{interview.duration || 'N/A'} minutes</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <Users className="w-4 h-4 mr-1" />
                              <span>{interview.type || 'General'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(interview.status || 'scheduled')}`}>
                          {interview.status || 'Scheduled'}
                        </span>
                        <button 
                          onClick={() => router.push(`/interview/${interview.interview_id}`)}
                          className="bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors flex items-center"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
} 