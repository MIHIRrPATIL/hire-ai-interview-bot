'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../services/supabaseClient'
import { useRouter } from 'next/navigation'
import { User, Calendar, Video, Settings, Bell, Clock, Briefcase, Eye, Users, Copy, Check, ExternalLink, X, FileText } from 'lucide-react'
import { getUserDisplayName } from '../../../lib/utils'

export default function InterviewsPage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [interviews, setInterviews] = useState([])
  const [interviewsLoading, setInterviewsLoading] = useState(true)
  const [copiedId, setCopiedId] = useState(null)
  const [showNoReportsModal, setShowNoReportsModal] = useState(false)
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

  const copyInterviewLink = async (interviewId) => {
    const interviewLink = `${window.location.origin}/interview/${interviewId}`
    try {
      await navigator.clipboard.writeText(interviewLink)
      setCopiedId(interviewId)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error('Failed to copy link:', err)
    }
  }

  const checkReportsAvailable = async (interviewId) => {
    try {
      const { data, error } = await supabase
        .from('interview-feedback')
        .select('id')
        .eq('interview_id', interviewId)
        .limit(1)

      if (error) {
        console.error('Error checking reports:', error)
        return false
      }
      return data && data.length > 0
    } catch (error) {
      console.error('Error:', error)
      return false
    }
  }

  const handleReportClick = async (interviewId) => {
    const hasReports = await checkReportsAvailable(interviewId)
    if (hasReports) {
      router.push(`/reports?interviewId=${interviewId}`)
    } else {
      setShowNoReportsModal(true)
    }
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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Interviews</h1>
            <p className="text-gray-600">Manage your interview sessions</p>
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
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">All Interviews</h2>
            <p className="text-gray-600">View and manage all interview sessions</p>
          </div>

          {interviewsLoading ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading interviews...</p>
            </div>
          ) : interviews.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Interviews Found</h3>
              <p className="text-gray-600">No interview sessions have been created yet.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {interviews.map((interview) => (
                <div key={interview.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Briefcase className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{interview.jobPosition || 'Interview'}</h3>
                        <p className="text-sm text-gray-500">ID: {interview.interview_id}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(interview.status || 'scheduled')}`}>
                      {interview.status || 'Scheduled'}
                    </span>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="w-4 h-4 mr-2" />
                      <span>{interview.duration || 'N/A'} minutes</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="w-4 h-4 mr-2" />
                      <span>{interview.type || 'General'} Interview</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>{formatDate(interview.created_at)}</span>
                    </div>
                  </div>

                  <div className="flex space-x-2 mb-3">
                    <button 
                      onClick={() => router.push(`/interview/${interview.interview_id}`)}
                      className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </button>
                    <button 
                      onClick={() => handleReportClick(interview.interview_id)}
                      className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors flex items-center justify-center"
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      Report
                    </button>
                  </div>

                  <div className="border-t pt-3">
                    <button 
                      onClick={() => copyInterviewLink(interview.interview_id)}
                      className="w-full flex items-center justify-center space-x-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      {copiedId === interview.interview_id ? (
                        <>
                          <Check className="w-4 h-4 text-green-600" />
                          <span className="text-green-600">Link Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Copy Interview Link</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* No Reports Modal */}
      {showNoReportsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">No Reports Available</h3>
              <button 
                onClick={() => setShowNoReportsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mb-6">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-yellow-600" />
              </div>
              <p className="text-gray-600 text-center">
                No interview reports have been generated for this interview yet. 
                Reports will be available once candidates complete the interview and 
                their responses are evaluated.
              </p>
            </div>
            <div className="flex justify-end">
              <button 
                onClick={() => setShowNoReportsModal(false)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 