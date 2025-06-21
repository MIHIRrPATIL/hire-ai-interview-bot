'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../services/supabaseClient'
import { useRouter, useSearchParams } from 'next/navigation'
import { User, Calendar, FileText, Star, TrendingUp, AlertTriangle, CheckCircle, Clock, Briefcase, ChevronDown, ChevronRight, Filter } from 'lucide-react'
import { getUserDisplayName } from '../../../lib/utils'

export default function ReportsPage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [reports, setReports] = useState([])
  const [reportsLoading, setReportsLoading] = useState(true)
  const [selectedInterviewId, setSelectedInterviewId] = useState(null)
  const [interviews, setInterviews] = useState([])
  const [expandedInterviews, setExpandedInterviews] = useState(new Set())
  const [groupedReports, setGroupedReports] = useState({})
  const router = useRouter()
  const searchParams = useSearchParams()

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
    const interviewId = searchParams.get('interviewId')
    if (interviewId) {
      setSelectedInterviewId(interviewId)
      setExpandedInterviews(new Set([interviewId]))
    }
  }, [searchParams])

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all interviews first
        const { data: interviewsData, error: interviewsError } = await supabase
          .from('interviews')
          .select('*')
          .order('created_at', { ascending: false })

        if (interviewsError) {
          console.error('Error fetching interviews:', interviewsError)
        } else {
          setInterviews(interviewsData || [])
        }

        // Fetch all reports
        const { data: reportsData, error: reportsError } = await supabase
          .from('interview-feedback')
          .select('*')
          .order('created_at', { ascending: false })

        if (reportsError) {
          console.error('Error fetching reports:', reportsError)
        } else {
          setReports(reportsData || [])
          
          // Group reports by interview_id and then by candidate name
          const grouped = {}
          reportsData?.forEach(report => {
            if (!grouped[report.interview_id]) {
              grouped[report.interview_id] = {}
            }
            if (!grouped[report.interview_id][report.name]) {
              grouped[report.interview_id][report.name] = []
            }
            grouped[report.interview_id][report.name].push(report)
          })
          setGroupedReports(grouped)
        }
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setReportsLoading(false)
      }
    }

    if (!loading) {
      fetchData()
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

  const getScoreColor = (score) => {
    if (score >= 8) return 'text-green-600'
    if (score >= 6) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getRecommendationColor = (recommendation) => {
    switch (recommendation) {
      case 'Strong Match':
        return 'text-green-600'
      case 'Moderate Fit':
        return 'text-yellow-600'
      case 'Not Recommended':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const calculateAverageScores = (reports) => {
    if (reports.length === 0) return null

    const totals = reports.reduce((acc, report) => ({
      clarity: acc.clarity + (report.clarity || 0),
      relevance: acc.relevance + (report.relevance || 0),
      depth: acc.depth + (report.depth || 0),
      confidence: acc.confidence + (report.confidence || 0),
      communication: acc.communication + (report.communication || 0)
    }), { clarity: 0, relevance: 0, depth: 0, confidence: 0, communication: 0 })

    return {
      clarity: Math.round(totals.clarity / reports.length * 10) / 10,
      relevance: Math.round(totals.relevance / reports.length * 10) / 10,
      depth: Math.round(totals.depth / reports.length * 10) / 10,
      confidence: Math.round(totals.confidence / reports.length * 10) / 10,
      communication: Math.round(totals.communication / reports.length * 10) / 10
    }
  }

  const toggleInterviewExpansion = (interviewId) => {
    const newExpanded = new Set(expandedInterviews)
    if (newExpanded.has(interviewId)) {
      newExpanded.delete(interviewId)
    } else {
      newExpanded.add(interviewId)
    }
    setExpandedInterviews(newExpanded)
  }

  const getFilteredInterviews = () => {
    if (selectedInterviewId) {
      return interviews.filter(i => i.interview_id === selectedInterviewId)
    }
    return interviews.filter(i => groupedReports[i.interview_id] && Object.keys(groupedReports[i.interview_id]).length > 0)
  }

  const getTotalCandidatesForInterview = (interviewId) => {
    const interviewReports = groupedReports[interviewId] || {}
    return Object.keys(interviewReports).length
  }

  const getTotalQuestionsForInterview = (interviewId) => {
    const interviewReports = groupedReports[interviewId] || {}
    let totalQuestions = 0
    Object.values(interviewReports).forEach(candidateReports => {
      totalQuestions += candidateReports.length
    })
    return totalQuestions
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
  const filteredInterviews = getFilteredInterviews()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Interview Reports</h1>
            <p className="text-gray-600">View detailed feedback and evaluations</p>
          </div>
          <div className="flex items-center space-x-4">
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
          {/* Filter Controls */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <h2 className="text-lg font-semibold text-gray-900">Interview Reports</h2>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Filter className="w-4 h-4" />
                  <span>{Object.keys(groupedReports).length} interviews with reports</span>
                </div>
              </div>
              <select
                value={selectedInterviewId || ''}
                onChange={(e) => {
                  const value = e.target.value
                  setSelectedInterviewId(value || null)
                  if (value) {
                    router.push(`/reports?interviewId=${value}`)
                    setExpandedInterviews(new Set([value]))
                  } else {
                    router.push('/reports')
                    setExpandedInterviews(new Set())
                  }
                }}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Interviews</option>
                {interviews.map((interview) => (
                  <option key={interview.id} value={interview.interview_id}>
                    {interview.jobPosition || 'Interview'} - {interview.interview_id}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {reportsLoading ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading reports...</p>
            </div>
          ) : filteredInterviews.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Reports Found</h3>
              <p className="text-gray-600">
                {selectedInterviewId 
                  ? 'No feedback has been generated for this interview yet.'
                  : 'No interview feedback has been generated yet.'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredInterviews.map((interview) => {
                const interviewReports = groupedReports[interview.interview_id] || {}
                const averageScores = calculateAverageScores(Object.values(interviewReports).flat())
                const isExpanded = expandedInterviews.has(interview.interview_id)

                return (
                  <div key={interview.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    {/* Interview Header */}
                    <div 
                      className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => toggleInterviewExpansion(interview.interview_id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Briefcase className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{interview.jobPosition || 'Interview'}</h3>
                            <p className="text-sm text-gray-500">ID: {interview.interview_id} • {getTotalCandidatesForInterview(interview.interview_id)} candidates, {getTotalQuestionsForInterview(interview.interview_id)} questions</p>
                            <p className="text-xs text-gray-400">{formatDate(interview.created_at)}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          {averageScores && (
                            <div className="text-right">
                              <div className="text-sm text-gray-600">Average Score</div>
                              <div className="text-lg font-bold text-blue-600">
                                {Math.round(Object.values(averageScores).reduce((a, b) => a + b, 0) / 5 * 10) / 10}
                              </div>
                            </div>
                          )}
                          {isExpanded ? (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="border-t border-gray-200">
                        {/* Summary Stats */}
                        {averageScores && (
                          <div className="p-6 bg-gray-50">
                            <h4 className="font-semibold text-gray-900 mb-4">Performance Summary</h4>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                              {Object.entries(averageScores).map(([key, score]) => (
                                <div key={key} className="text-center">
                                  <div className={`text-2xl font-bold ${getScoreColor(score)}`}>{score}</div>
                                  <div className="text-sm text-gray-600 capitalize">{key}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Individual Reports */}
                        <div className="p-6 space-y-6">
                          {Object.entries(interviewReports).map(([candidateName, reports]) => (
                            <div key={candidateName} className="border border-gray-200 rounded-lg p-4">
                              <div className="flex items-start justify-between mb-4">
                                <div>
                                  <h5 className="font-semibold text-gray-900 mb-1">
                                    Candidate: {candidateName}
                                  </h5>
                                  <p className="text-sm text-gray-600 mb-2">{reports.length} questions</p>
                                </div>
                              </div>

                              {reports.map((report, index) => (
                                <div key={report.id} className="border border-gray-200 rounded-lg p-4">
                                  <div className="flex items-start justify-between mb-4">
                                    <div>
                                      <h6 className="font-medium text-gray-900 mb-1">
                                        Question {index + 1}
                                      </h6>
                                      <p className="text-sm text-gray-600 mb-2">{report.question}</p>
                                    </div>
                                    <div className="text-right">
                                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRecommendationColor(report.final_recommendation)}`}>
                                        {report.final_recommendation || 'Not Evaluated'}
                                      </span>
                                      <p className="text-xs text-gray-500 mt-1">
                                        {formatDate(report.created_at)}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="mb-4">
                                    <h7 className="font-medium text-gray-900 mb-2">Candidate's Answer:</h7>
                                    <p className="text-gray-700 bg-gray-50 p-3 rounded-md text-sm">
                                      {report.candidate_answer || 'No answer provided'}
                                    </p>
                                  </div>

                                  {/* Scores */}
                                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                                    {['clarity', 'relevance', 'depth', 'confidence', 'communication'].map((metric) => (
                                      <div key={metric} className="text-center">
                                        <div className={`text-lg font-bold ${getScoreColor(report[metric])}`}>
                                          {report[metric] || 'N/A'}
                                        </div>
                                        <div className="text-xs text-gray-600 capitalize">{metric}</div>
                                      </div>
                                    ))}
                                  </div>

                                  {/* Summary */}
                                  {report.summary && (
                                    <div className="mb-4">
                                      <h7 className="font-medium text-gray-900 mb-2">Summary:</h7>
                                      <p className="text-gray-700 text-sm">{report.summary}</p>
                                    </div>
                                  )}

                                  {/* Red Flags */}
                                  {report.red_flags && Object.keys(report.red_flags).length > 0 && (
                                    <div className="border-l-4 border-red-400 bg-red-50 p-3 rounded-r-md">
                                      <h7 className="font-medium text-red-900 mb-2 flex items-center">
                                        <AlertTriangle className="w-4 h-4 mr-1" />
                                        Red Flags:
                                      </h7>
                                      <ul className="text-sm text-red-800 space-y-1">
                                        {Object.entries(report.red_flags).map(([key, value]) => (
                                          <li key={key}>• {value}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}