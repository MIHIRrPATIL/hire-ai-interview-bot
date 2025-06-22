'use client'

import { useState, useEffect, Suspense } from 'react'
import { supabase } from '../../../services/supabaseClient'
import { useRouter, useSearchParams } from 'next/navigation'
import { User, Calendar, FileText, Star, TrendingUp, AlertTriangle, CheckCircle, Clock, Briefcase, ChevronDown, ChevronRight, Filter } from 'lucide-react'
import { getUserDisplayName } from '../../../lib/utils'

function ReportsView() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [reports, setReports] = useState([])
  const [reportsLoading, setReportsLoading] = useState(true)
  const [selectedInterviewId, setSelectedInterviewId] = useState(null)
  const [interviews, setInterviews] = useState([])
  const [expandedInterviews, setExpandedInterviews] = useState(new Set())
  const [expandedCandidates, setExpandedCandidates] = useState({})
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
    if (score >= 5) return 'text-yellow-600'
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
    if (!reports || reports.length === 0) return null

    const totals = reports.reduce((acc, report) => {
      acc.clarity += report.clarity || 0
      acc.relevance += report.relevance || 0
      acc.depth += report.depth || 0
      acc.technical_soundness += report.technical_soundness || 0
      return acc
    }, { clarity: 0, relevance: 0, depth: 0, technical_soundness: 0 })

    const count = reports.length
    return {
      clarity: Math.round(totals.clarity / count * 10) / 10,
      relevance: Math.round(totals.relevance / count * 10) / 10,
      depth: Math.round(totals.depth / count * 10) / 10,
      technical_soundness: Math.round(totals.technical_soundness / count * 10) / 10,
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

  const toggleCandidateExpansion = (candidateId) => {
    setExpandedCandidates(prev => ({
      ...prev,
      [candidateId]: !prev[candidateId]
    }));
  };

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
              <h3 className="text-lg font-semibold text-gray-900">No Reports Found</h3>
              <p className="text-gray-600 mt-2">There are no reports available for the selected criteria.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredInterviews.map((interview) => {
                const interviewReports = groupedReports[interview.interview_id] || {}
                const candidateNames = Object.keys(interviewReports)

                return (
                  <div key={interview.id} className="bg-white rounded-lg shadow overflow-hidden">
                    <div
                      className="px-6 py-4 flex justify-between items-center cursor-pointer hover:bg-gray-50"
                      onClick={() => toggleInterviewExpansion(interview.interview_id)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <Briefcase className="w-5 h-5 text-blue-600" />
                          <h3 className="text-lg font-semibold text-gray-900">{interview.jobPosition || 'Interview'}</h3>
                          <span className="text-sm text-gray-500">({interview.interview_id})</span>
                        </div>
                        <div className="flex items-center space-x-6 mt-2 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(interview.created_at)}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4" />
                            <span>{getTotalCandidatesForInterview(interview.interview_id)} Candidates</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <FileText className="w-4 h-4" />
                            <span>{getTotalQuestionsForInterview(interview.interview_id)} Questions</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {expandedInterviews.has(interview.interview_id) ? (
                          <ChevronDown className="w-5 h-5 text-gray-500" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-500" />
                        )}
                      </div>
                    </div>

                    {expandedInterviews.has(interview.interview_id) && (
                      <div className="border-t border-gray-200 p-6 bg-gray-50">
                        {candidateNames.length === 0 ? (
                          <p className="text-gray-600">No reports available for this interview.</p>
                        ) : (
                          <div className="space-y-6">
                            {candidateNames.map(candidateName => {
                              const reportsForCandidate = interviewReports[candidateName]
                              const avgScores = calculateAverageScores(reportsForCandidate)
                              const latestReport = reportsForCandidate[0]
                              const isExpanded = expandedCandidates[`${interview.id}-${candidateName}`];

                              return (
                                <div key={candidateName} className="bg-white rounded-md border">
                                  <div
                                    className="p-4 flex justify-between items-center cursor-pointer"
                                    onClick={() => toggleCandidateExpansion(`${interview.id}-${candidateName}`)}
                                  >
                                    <div>
                                      <h4 className="font-semibold text-gray-800">{candidateName}</h4>
                                      <p className="text-sm text-gray-500 mt-1">{reportsForCandidate.length} questions answered</p>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                       <div className="text-right">
                                        <p className={`text-sm font-bold ${getRecommendationColor(latestReport.recommendation)}`}>
                                          {latestReport.recommendation || 'No Recommendation'}
                                        </p>
                                        <p className="text-xs text-gray-500">Overall Recommendation</p>
                                      </div>
                                      {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                                    </div>
                                  </div>

                                  {isExpanded && (
                                     <div className="border-t p-4 space-y-4">
                                      {reportsForCandidate.map((report, index) => (
                                        <div key={index} className="p-4 rounded-lg bg-gray-50 border">
                                          <h5 className="font-semibold text-gray-800">Q: {report.question}</h5>
                                          <p className="mt-2 text-sm text-gray-700 bg-blue-50 p-2 rounded">A: {report.candidate_answer}</p>
                                          
                                          <div className="mt-4">
                                            <h6 className="font-semibold text-xs text-gray-600 uppercase">AI Feedback</h6>
                                            <div className="mt-2 space-y-3 text-sm">
                                              
                                              <p><span className="font-semibold">Summary:</span> {report.summary}</p>
                                              
                                              <div>
                                                <p className="font-semibold text-green-700">Strengths:</p>
                                                <p className="whitespace-pre-wrap">{report.strengths}</p>
                                              </div>

                                              <div>
                                                <p className="font-semibold text-red-700">Areas for Improvement:</p>
                                                <p className="whitespace-pre-wrap">{report.areas_for_improvement}</p>
                                              </div>

                                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t">
                                                <div>
                                                  <p className="text-gray-600 capitalize">Relevance</p>
                                                  <p className={`font-bold ${getScoreColor(report.relevance)}`}>{report.relevance} / 10</p>
                                                </div>
                                                <div>
                                                  <p className="text-gray-600 capitalize">Clarity</p>
                                                  <p className={`font-bold ${getScoreColor(report.clarity)}`}>{report.clarity} / 10</p>
                                                </div>
                                                <div>
                                                  <p className="text-gray-600 capitalize">Depth</p>
                                                  <p className={`font-bold ${getScoreColor(report.depth)}`}>{report.depth} / 10</p>
                                                </div>
                                                <div>
                                                  <p className="text-gray-600 capitalize">Tech Soundness</p>
                                                  <p className={`font-bold ${getScoreColor(report.technical_soundness)}`}>{report.technical_soundness} / 10</p>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}
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

export default function ReportsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <ReportsView />
    </Suspense>
  )
}   