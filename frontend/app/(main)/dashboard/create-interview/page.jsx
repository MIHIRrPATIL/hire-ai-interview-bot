'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../../services/supabaseClient'
import { useRouter, useSearchParams } from 'next/navigation'
import { User, Bell, ArrowLeft, Upload, Calendar, Clock, Users, FileText, Settings, Zap, Plus, X, Edit2, Trash2, Loader2 } from 'lucide-react'
import { getUserDisplayName } from '../../../../lib/utils'
import { AI_QUESTION_GENERATION_PROMPT } from '../../../../services/constants'
import axios from 'axios'
import MeetSummary from './_components/MeetSummary'
import { Suspense } from 'react'

function CreateInterviewPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const interviewId = searchParams.get('interview_id')

  const [summaryData, setSummaryData] = useState(null)
  const [summaryError, setSummaryError] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showQuestionModal, setShowQuestionModal] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState({ text: '', type: 'open-ended', points: 10 })
  const [editingIndex, setEditingIndex] = useState(-1)
  const [formData, setFormData] = useState({
    // Job/Interview Details
    interviewTitle: '',
    role: '',
    department: '',
    interviewDuration: '30',
    interviewDate: '',
    
    // Interview Type
    interviewTypes: ['technical'],
    
    // Question Settings
    questionSource: 'ai-generated',
    numberOfQuestions: '10',
    questionTypes: ['open-ended'],
    evaluationCriteria: ['clarity', 'relevance'],
    manualQuestions: [],
    
    // Evaluation & AI Settings
    enableAIScoring: true,
    enableHumanReview: true,
    recordingAllowed: true,
    transcriptionEnabled: true,
    useResumeCustomization: true
  })
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')

  useEffect(() => {
    const fetchInterviewSummary = async () => {
      if (!interviewId) return;

      setLoading(true)
      setSummaryError(null)
      try {
        const { data, error } = await supabase
          .from('interviews')
          .select('jobDescription, type, duration, interview_id')
          .eq('interview_id', interviewId)
          .single()

        if (error) throw error

        if (data) {
          setSummaryData({
            interviewTitle: data.jobDescription,
            interviewTypes: data.type.split(',').map(t => t.trim()),
            interviewDuration: data.duration,
            interviewId: data.interview_id,
          })
        } else {
          setSummaryError('Interview not found.')
        }
      } catch (error) {
        setSummaryError(`Error fetching summary: ${error.message}`)
      } finally {
        setLoading(false)
      }
    }

    fetchInterviewSummary()
  }, [interviewId])

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Show modal when manual mode is selected
    if (field === 'questionSource' && value === 'manual') {
      setShowQuestionModal(true)
    }
  }

  const handleArrayChange = (field, value, checked) => {
    setFormData(prev => ({
      ...prev,
      [field]: checked 
        ? [...prev[field], value]
        : prev[field].filter(item => item !== value)
    }))
  }

  const handleAddQuestion = () => {
    if (!currentQuestion.text.trim()) return
    
    if (editingIndex >= 0) {
      // Edit existing question
      const updatedQuestions = [...formData.manualQuestions]
      updatedQuestions[editingIndex] = { ...currentQuestion }
      setFormData(prev => ({
        ...prev,
        manualQuestions: updatedQuestions
      }))
      setEditingIndex(-1)
    } else {
      // Add new question
      setFormData(prev => ({
        ...prev,
        manualQuestions: [...prev.manualQuestions, { ...currentQuestion }]
      }))
    }
    
    setCurrentQuestion({ text: '', type: 'open-ended', points: 10 })
  }

  const handleEditQuestion = (index) => {
    const question = formData.manualQuestions[index]
    setCurrentQuestion({ ...question })
    setEditingIndex(index)
    setShowQuestionModal(true)
  }

  const handleDeleteQuestion = (index) => {
    setFormData(prev => ({
      ...prev,
      manualQuestions: prev.manualQuestions.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("You must be logged in to create an interview.");
        setLoading(false);
        return;
      }

      // Prepare the data
      const newInterviewId = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
      const interviewData = {
        jobPosition: formData.role,
        jobDescription: formData.interviewTitle, // using title as description
        duration: formData.interviewDuration,
        type: formData.interviewTypes.join(', '),
        questionList: formData.manualQuestions,
        userEmail: user.email,
        interview_id: newInterviewId,
      };

      // Insert into Supabase
      const { data, error } = await supabase
        .from('interviews')
        .insert([interviewData])
        .select();

      if (error) {
        console.error("Supabase insert error:", error);
        alert("Failed to create interview: " + error.message);
        setLoading(false);
        return;
      }
      
      // Redirect to summary view
      router.push(`/dashboard/create-interview?interview_id=${newInterviewId}`);

    } catch (error) {
      console.error('Error creating interview:', error);
      alert("Unexpected error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper to format prompt
  const buildAIPrompt = () => {
    return AI_QUESTION_GENERATION_PROMPT
      .replace('{interviewTitle}', formData.interviewTitle || '-')
      .replace('{role}', formData.role || '-')
      .replace('{department}', formData.department || '-')
      .replace('{interviewDuration}', formData.interviewDuration || '-')
      .replace('{interviewTypes}', formData.interviewTypes.join(', ') || '-')
      .replace('{numberOfQuestions}', formData.numberOfQuestions || '-')
      .replace('{questionTypes}', formData.questionTypes.join(', ') || '-')
      .replace('{evaluationCriteria}', formData.evaluationCriteria.join(', ') || '-')
  }

  // Fetch AI questions
  const fetchAIQuestions = async () => {
    setAiLoading(true)
    setAiError('')
    try {
      const res = await axios.post('/api/AI-model', {
        jobPosition: formData.role,
        jobDescription: buildAIPrompt(),
        duartion: formData.interviewDuration,
        type: formData.interviewTypes.join(', ')
      })
      // Debug: log the full response
      console.log('AI API response:', res.data)
      if (!res.data.questions || !Array.isArray(res.data.questions)) {
        setAiError('AI did not return questions in the expected format. Please try again or contact support.')
        return
      }
      setFormData(prev => ({ ...prev, manualQuestions: res.data.questions }))
    } catch (err) {
      if (err.response) {
        // Server responded with a status other than 2xx
        console.error('AI API error response:', err.response.data)
        setAiError('Server error: ' + (err.response.data?.error || err.response.statusText))
      } else if (err.request) {
        // Request was made but no response
        console.error('No response from AI API:', err.request)
        setAiError('No response from AI service. Please check your network or try again later.')
      } else {
        // Something else happened
        console.error('AI question generation error:', err)
        setAiError('Could not generate questions. ' + (err.message || 'Unknown error.'))
      }
    } finally {
      setAiLoading(false)
    }
  }

  const interviewTypes = [
    { value: 'technical', label: 'Technical' },
    { value: 'behavioral', label: 'Behavioral' },
    { value: 'cultural-fit', label: 'Cultural Fit' },
    { value: 'hr', label: 'HR' },
    { value: 'managerial', label: 'Managerial' },
    { value: 'case-study', label: 'Case Study' },
    { value: 'ai-driven-mock', label: 'AI-Driven Mock' }
  ]

  const questionTypes = [
    { value: 'open-ended', label: 'Open-ended' },
    { value: 'coding', label: 'Coding' },
    { value: 'mcq', label: 'MCQ' }
  ]

  const evaluationCriteria = [
    { value: 'clarity', label: 'Clarity' },
    { value: 'relevance', label: 'Relevance' },
    { value: 'technical-depth', label: 'Technical Depth' },
    { value: 'problem-solving', label: 'Problem Solving' },
    { value: 'communication', label: 'Communication' }
  ]

  if (interviewId) {
    if (loading) {
      return <div className="min-h-screen flex items-center justify-center">Loading summary...</div>
    }
    if (summaryError) {
      return <div className="min-h-screen flex items-center justify-center">Error: {summaryError}</div>
    }
    if (summaryData) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
          <MeetSummary 
            interviewTitle={summaryData.interviewTitle}
            interviewTypes={summaryData.interviewTypes}
            interviewDuration={summaryData.interviewDuration}
            interviewId={summaryData.interviewId}
          />
        </div>
      );
    }
    return null; // or a not found component
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => router.back()}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Create New Interview</h1>
              <p className="text-gray-600">Set up a new interview session</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button className="p-2 text-gray-400 hover:text-gray-600">
              <Bell className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm text-gray-700">Admin</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8">
          
          {/* Job/Interview Details */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Job/Interview Details</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Interview Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.interviewTitle}
                  onChange={(e) => handleInputChange('interviewTitle', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Senior Frontend Developer Interview"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role / Position *
                </label>
                <input
                  type="text"
                  required
                  value={formData.role}
                  onChange={(e) => handleInputChange('role', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Senior Frontend Developer"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department / Team
                </label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Engineering"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Interview Duration (minutes)
                </label>
                <select
                  value={formData.interviewDuration}
                  onChange={(e) => handleInputChange('interviewDuration', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">60 minutes</option>
                  <option value="90">90 minutes</option>
                  <option value="120">120 minutes</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Interview Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.interviewDate}
                  onChange={(e) => handleInputChange('interviewDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Interview Type */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Interview Type</h2>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {interviewTypes.map((type) => (
                <label key={type.value} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    value={type.value}
                    checked={formData.interviewTypes.includes(type.value)}
                    onChange={(e) => handleArrayChange('interviewTypes', type.value, e.target.checked)}
                    className="mr-3"
                  />
                  <span className="text-sm font-medium">{type.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Question Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-green-100 rounded-lg">
                <FileText className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Question Settings</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Question Source
                </label>
                <select
                  value={formData.questionSource}
                  onChange={(e) => handleInputChange('questionSource', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="manual">Manual</option>
                  <option value="ai-generated">AI-generated</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Questions
                </label>
                <select
                  value={formData.numberOfQuestions}
                  onChange={(e) => handleInputChange('numberOfQuestions', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="5">5 questions</option>
                  <option value="10">10 questions</option>
                  <option value="15">15 questions</option>
                  <option value="20">20 questions</option>
                  <option value="25">25 questions</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Question Types
                </label>
                <div className="space-y-2">
                  {questionTypes.map((type) => (
                    <label key={type.value} className="flex items-center">
                      <input
                        type="checkbox"
                        value={type.value}
                        checked={formData.questionTypes.includes(type.value)}
                        onChange={(e) => handleArrayChange('questionTypes', type.value, e.target.checked)}
                        className="mr-3"
                      />
                      <span className="text-sm">{type.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Evaluation Criteria
                </label>
                <div className="space-y-2">
                  {evaluationCriteria.map((criteria) => (
                    <label key={criteria.value} className="flex items-center">
                      <input
                        type="checkbox"
                        value={criteria.value}
                        checked={formData.evaluationCriteria.includes(criteria.value)}
                        onChange={(e) => handleArrayChange('evaluationCriteria', criteria.value, e.target.checked)}
                        className="mr-3"
                      />
                      <span className="text-sm">{criteria.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Question Generation Button */}
            {formData.questionSource === 'ai-generated' && (
              <div className="mt-6 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={fetchAIQuestions}
                  disabled={aiLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 w-fit"
                >
                  {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Generate Questions with AI
                </button>
                {aiError && <span className="text-red-600 text-sm">{aiError}</span>}
              </div>
            )}

            {/* Show questions if any (AI or manual) */}
            {formData.manualQuestions.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Questions ({formData.manualQuestions.length})</h3>
                  <button
                    type="button"
                    onClick={() => setShowQuestionModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Question
                  </button>
                </div>
                <div className="space-y-3">
                  {formData.manualQuestions.map((question, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{question.text}</p>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                          <span className="capitalize">{question.type}</span>
                          <span>{question.points} points</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleEditQuestion(index)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteQuestion(index)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Evaluation & AI Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-red-100 rounded-lg">
                <Zap className="w-5 h-5 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Evaluation & AI Settings</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.enableAIScoring}
                    onChange={(e) => handleInputChange('enableAIScoring', e.target.checked)}
                    className="mr-3"
                  />
                  <span className="text-sm font-medium">Enable AI Scoring</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.enableHumanReview}
                    onChange={(e) => handleInputChange('enableHumanReview', e.target.checked)}
                    className="mr-3"
                  />
                  <span className="text-sm font-medium">Enable Human Review</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.recordingAllowed}
                    onChange={(e) => handleInputChange('recordingAllowed', e.target.checked)}
                    className="mr-3"
                  />
                  <span className="text-sm font-medium">Recording Allowed</span>
                </label>
              </div>
              
              <div className="space-y-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.transcriptionEnabled}
                    onChange={(e) => handleInputChange('transcriptionEnabled', e.target.checked)}
                    className="mr-3"
                  />
                  <span className="text-sm font-medium">Transcription Enabled</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.useResumeCustomization}
                    onChange={(e) => handleInputChange('useResumeCustomization', e.target.checked)}
                    className="mr-3"
                  />
                  <span className="text-sm font-medium">Use Resume to Customize Questions</span>
                </label>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Creating Interview...
                </>
              ) : (
                'Create Interview'
              )}
            </button>
          </div>
        </form>
      </main>

      {/* Question Modal */}
      {showQuestionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingIndex >= 0 ? 'Edit Question' : 'Add Custom Question'}
              </h2>
              <button
                onClick={() => {
                  setShowQuestionModal(false)
                  setCurrentQuestion({ text: '', type: 'open-ended', points: 10 })
                  setEditingIndex(-1)
                }}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Question Text *
                </label>
                <textarea
                  value={currentQuestion.text}
                  onChange={(e) => setCurrentQuestion(prev => ({ ...prev, text: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={4}
                  placeholder="Enter your question here..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Question Type
                  </label>
                  <select
                    value={currentQuestion.type}
                    onChange={(e) => setCurrentQuestion(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="open-ended">Open-ended</option>
                    <option value="coding">Coding</option>
                    <option value="mcq">MCQ</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Points
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={currentQuestion.points}
                    onChange={(e) => setCurrentQuestion(prev => ({ ...prev, points: parseInt(e.target.value) || 10 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-4 p-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  setShowQuestionModal(false)
                  setCurrentQuestion({ text: '', type: 'open-ended', points: 10 })
                  setEditingIndex(-1)
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddQuestion}
                disabled={!currentQuestion.text.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {editingIndex >= 0 ? 'Update Question' : 'Add Question'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function CreateInterview() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreateInterviewPage />
    </Suspense>
  )
} 