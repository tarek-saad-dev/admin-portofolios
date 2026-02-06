'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Plus, Trash2, Check, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { Challenge, QuizOption, WordOption } from '@/types/lms'

export default function ChallengeEditorPage() {
  const router = useRouter()
  const params = useParams()
  const challengeId = params.id as string

  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [quizOptions, setQuizOptions] = useState<QuizOption[]>([])
  const [wordOptions, setWordOptions] = useState<WordOption[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newOptionText, setNewOptionText] = useState('')
  const [newWordText, setNewWordText] = useState('')
  const [validationError, setValidationError] = useState('')

  useEffect(() => {
    if (challengeId) {
      fetchChallenge()
      fetchQuizOptions()
      fetchWordOptions()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challengeId])

  const fetchChallenge = async () => {
    try {
      const res = await fetch(`/api/lms/challenges?challengeId=${challengeId}`)
      const data = await res.json()
      if (data.success && data.data) {
        setChallenge(data.data)
      } else {
        alert('Challenge not found')
        router.push('/lms')
      }
    } catch (error) {
      console.error('Error fetching challenge:', error)
      alert('Failed to load challenge')
    } finally {
      setLoading(false)
    }
  }

  const fetchQuizOptions = async () => {
    try {
      const res = await fetch(`/api/lms/quiz-options?challengeId=${challengeId}`)
      const data = await res.json()
      if (data.success) {
        setQuizOptions(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching quiz options:', error)
    }
  }

  const fetchWordOptions = async () => {
    try {
      const res = await fetch(`/api/lms/word-options?challengeId=${challengeId}`)
      const data = await res.json()
      if (data.success) {
        setWordOptions(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching word options:', error)
    }
  }

  const handleUpdateField = async (field: string, value: string | number) => {
    if (!challenge) return

    try {
      setSaving(true)
      const res = await fetch(`/api/lms/challenges`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: challenge.id,
          [field]: value,
        }),
      })

      const data = await res.json()
      if (data.success) {
        setChallenge(data.data)
      } else {
        alert(data.error || 'Failed to update challenge')
      }
    } catch (error) {
      console.error('Error updating challenge:', error)
      alert('Failed to update challenge')
    } finally {
      setSaving(false)
    }
  }

  // Quiz Options (SELECT/ASSIST)
  const handleAddQuizOption = async () => {
    if (!newOptionText.trim()) {
      alert('Please enter option text')
      return
    }

    try {
      const res = await fetch('/api/lms/quiz-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId: Number(challengeId),
          text: newOptionText,
          correct: false,
        }),
      })

      const data = await res.json()
      if (data.success) {
        setQuizOptions([...quizOptions, data.data])
        setNewOptionText('')
        setValidationError('')
      } else {
        alert(data.error || 'Failed to add option')
      }
    } catch (error) {
      console.error('Error adding option:', error)
      alert('Failed to add option')
    }
  }

  const handleToggleQuizCorrect = async (optionId: number, currentCorrect: boolean) => {
    try {
      const res = await fetch(`/api/lms/quiz-options?id=${optionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correct: !currentCorrect }),
      })

      const data = await res.json()
      if (data.success) {
        setQuizOptions(quizOptions.map((opt) => (opt.id === optionId ? data.data : opt)))
        setValidationError('')
      } else {
        alert(data.error || 'Failed to update option')
      }
    } catch (error) {
      console.error('Error updating option:', error)
      alert('Failed to update option')
    }
  }

  const handleDeleteQuizOption = async (optionId: number) => {
    if (!confirm('Are you sure you want to delete this option?')) return

    try {
      const res = await fetch(`/api/lms/quiz-options?id=${optionId}`, {
        method: 'DELETE',
      })

      const data = await res.json()
      if (data.success) {
        setQuizOptions(quizOptions.filter((opt) => opt.id !== optionId))
        setValidationError('')
      } else {
        alert(data.error || 'Failed to delete option')
      }
    } catch (error) {
      console.error('Error deleting option:', error)
      alert('Failed to delete option')
    }
  }

  // Word Options (COMPLETE/WRITE)
  const handleAddWordOption = async () => {
    if (!newWordText.trim()) {
      alert('Please enter a word')
      return
    }

    try {
      const res = await fetch('/api/lms/word-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId: Number(challengeId),
          word: newWordText,
          correct: false,
        }),
      })

      const data = await res.json()
      if (data.success) {
        setWordOptions([...wordOptions, data.data])
        setNewWordText('')
        setValidationError('')
      } else {
        alert(data.error || 'Failed to add word')
      }
    } catch (error) {
      console.error('Error adding word:', error)
      alert('Failed to add word')
    }
  }

  const handleToggleWordCorrect = async (optionId: number, currentCorrect: boolean) => {
    try {
      const res = await fetch(`/api/lms/word-options?id=${optionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correct: !currentCorrect }),
      })

      const data = await res.json()
      if (data.success) {
        setWordOptions(wordOptions.map((opt) => (opt.id === optionId ? data.data : opt)))
        setValidationError('')
      } else {
        alert(data.error || 'Failed to update word')
      }
    } catch (error) {
      console.error('Error updating word:', error)
      alert('Failed to update word')
    }
  }

  const handleDeleteWordOption = async (optionId: number) => {
    if (!confirm('Are you sure you want to delete this word?')) return

    try {
      const res = await fetch(`/api/lms/word-options?id=${optionId}`, {
        method: 'DELETE',
      })

      const data = await res.json()
      if (data.success) {
        setWordOptions(wordOptions.filter((opt) => opt.id !== optionId))
        setValidationError('')
      } else {
        alert(data.error || 'Failed to delete word')
      }
    } catch (error) {
      console.error('Error deleting word:', error)
      alert('Failed to delete word')
    }
  }

  const validateChallenge = (): boolean => {
    if (!challenge) return false

    setValidationError('')

    switch (challenge.type) {
      case 'SELECT':
      case 'ASSIST':
        if (quizOptions.length < 2) {
          setValidationError('Multiple choice questions must have at least 2 options')
          return false
        }
        if (quizOptions.filter((opt) => opt.correct).length === 0) {
          setValidationError('At least one option must be marked as correct')
          return false
        }
        break

      case 'COMPLETE':
      case 'WRITE':
        if (wordOptions.length < 1) {
          setValidationError('Word completion requires at least 1 word option')
          return false
        }
        if (wordOptions.filter((opt) => opt.correct).length === 0) {
          setValidationError('At least one word must be marked as correct')
          return false
        }
        break

      case 'TEXT':
        if (!challenge.text_content && !challenge.web_view_content) {
          setValidationError('TEXT challenges require text_content or web_view_content')
          return false
        }
        break

      case 'IMAGE':
        if (!challenge.image_content) {
          setValidationError('IMAGE challenges require image_content (URL)')
          return false
        }
        break

      case 'VIDEO':
        if (!challenge.video_url) {
          setValidationError('VIDEO challenges require video_url')
          return false
        }
        break

      case 'PDF':
        if (!challenge.pdf_url) {
          setValidationError('PDF challenges require pdf_url')
          return false
        }
        break

      case 'CODE':
        if (!challenge.language) {
          setValidationError('CODE challenges require language')
          return false
        }
        if (!challenge.instructions) {
          setValidationError('CODE challenges require instructions')
          return false
        }
        if (challenge.test_cases) {
          try {
            JSON.parse(challenge.test_cases as string)
          } catch {
            setValidationError('test_cases must be valid JSON')
            return false
          }
        }
        break

      case 'PROJECT':
        if (!challenge.project_structure) {
          setValidationError('PROJECT challenges require project_structure (JSON)')
          return false
        }
        if (!challenge.project_files) {
          setValidationError('PROJECT challenges require project_files (JSON)')
          return false
        }
        try {
          JSON.parse(challenge.project_structure as string)
          JSON.parse(challenge.project_files as string)
          if (challenge.project_test_cases) {
            JSON.parse(challenge.project_test_cases as string)
          }
        } catch {
          setValidationError('PROJECT JSON fields must be valid JSON')
          return false
        }
        break
    }

    return true
  }

  const handleSaveAndReturn = () => {
    if (!validateChallenge()) {
      return
    }

    if (challenge?.lesson_id) {
      router.push(`/lms/lessons/${challenge.lesson_id}`)
    } else {
      router.push('/lms')
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <p>Loading challenge...</p>
      </div>
    )
  }

  if (!challenge) {
    return (
      <div className="container mx-auto py-8">
        <p>Challenge not found</p>
      </div>
    )
  }

  const renderTypeSpecificFields = () => {
    switch (challenge.type) {
      case 'SELECT':
      case 'ASSIST':
        return (
          <div className="space-y-4 border-t pt-6">
            <div>
              <h3 className="text-lg font-semibold">Answer Options</h3>
              <p className="text-sm text-muted-foreground">
                Add multiple choice options. Mark at least one as correct.
              </p>
            </div>

            <div className="space-y-2">
              {quizOptions.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">
                  No options yet. Add at least 2 options below.
                </p>
              ) : (
                quizOptions.map((option) => (
                  <div key={option.id} className="flex items-center gap-3 p-3 border rounded-lg bg-card">
                    <Button
                      variant={option.correct ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleToggleQuizCorrect(option.id, option.correct)}
                      className="shrink-0"
                    >
                      {option.correct ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                    </Button>
                    <p className="flex-1 text-sm">{option.text}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteQuizOption(option.id)}
                      className="shrink-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>

            <div className="flex gap-2">
              <Input
                value={newOptionText}
                onChange={(e) => setNewOptionText(e.target.value)}
                placeholder="Enter new option text..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddQuizOption()
                  }
                }}
              />
              <Button onClick={handleAddQuizOption}>
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </div>
        )

      case 'COMPLETE':
      case 'WRITE':
        return (
          <div className="space-y-4 border-t pt-6">
            <div>
              <h3 className="text-lg font-semibold">Word Options</h3>
              <p className="text-sm text-muted-foreground">
                Add words for completion. Mark correct answers.
              </p>
            </div>

            {challenge.type === 'COMPLETE' && (
              <div className="space-y-2">
                <Label htmlFor="complete_question">Complete Question *</Label>
                <Textarea
                  id="complete_question"
                  value={challenge.complete_question || ''}
                  onChange={(e) => setChallenge({ ...challenge, complete_question: e.target.value })}
                  onBlur={(e) => handleUpdateField('completeQuestion', e.target.value)}
                  placeholder="Enter the sentence with blanks..."
                  rows={3}
                />
              </div>
            )}

            <div className="space-y-2">
              {wordOptions.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">
                  No words yet. Add at least 1 correct word.
                </p>
              ) : (
                wordOptions.map((option) => (
                  <div key={option.id} className="flex items-center gap-3 p-3 border rounded-lg bg-card">
                    <Button
                      variant={option.correct ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleToggleWordCorrect(option.id, option.correct)}
                      className="shrink-0"
                    >
                      {option.correct ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                    </Button>
                    <p className="flex-1 text-sm">{option.word}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteWordOption(option.id)}
                      className="shrink-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>

            <div className="flex gap-2">
              <Input
                value={newWordText}
                onChange={(e) => setNewWordText(e.target.value)}
                placeholder="Enter new word..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddWordOption()
                  }
                }}
              />
              <Button onClick={handleAddWordOption}>
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </div>
        )

      case 'TEXT':
        return (
          <div className="space-y-4 border-t pt-6">
            <div className="space-y-2">
              <Label htmlFor="text_content">Text Content *</Label>
              <Textarea
                id="text_content"
                value={challenge.text_content || ''}
                onChange={(e) => setChallenge({ ...challenge, text_content: e.target.value })}
                onBlur={(e) => handleUpdateField('textContent', e.target.value)}
                placeholder="Enter the text content..."
                rows={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="web_view_content">Web View Content (Optional HTML)</Label>
              <Textarea
                id="web_view_content"
                value={challenge.web_view_content || ''}
                onChange={(e) => setChallenge({ ...challenge, web_view_content: e.target.value })}
                onBlur={(e) => handleUpdateField('webViewContent', e.target.value)}
                placeholder="Enter HTML content..."
                rows={4}
              />
            </div>
          </div>
        )

      case 'IMAGE':
        return (
          <div className="space-y-4 border-t pt-6">
            <div className="space-y-2">
              <Label htmlFor="image_content">Image URL *</Label>
              <Input
                id="image_content"
                value={challenge.image_content || ''}
                onChange={(e) => setChallenge({ ...challenge, image_content: e.target.value })}
                onBlur={(e) => handleUpdateField('imageContent', e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>
        )

      case 'VIDEO':
        return (
          <div className="space-y-4 border-t pt-6">
            <div className="space-y-2">
              <Label htmlFor="video_url">Video URL *</Label>
              <Input
                id="video_url"
                value={challenge.video_url || ''}
                onChange={(e) => setChallenge({ ...challenge, video_url: e.target.value })}
                onBlur={(e) => handleUpdateField('videoUrl', e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>
          </div>
        )

      case 'PDF':
        return (
          <div className="space-y-4 border-t pt-6">
            <div className="space-y-2">
              <Label htmlFor="pdf_url">PDF URL *</Label>
              <Input
                id="pdf_url"
                value={challenge.pdf_url || ''}
                onChange={(e) => setChallenge({ ...challenge, pdf_url: e.target.value })}
                onBlur={(e) => handleUpdateField('pdfUrl', e.target.value)}
                placeholder="https://example.com/document.pdf"
              />
            </div>
          </div>
        )

      case 'CODE':
        return (
          <div className="space-y-4 border-t pt-6">
            <div className="space-y-2">
              <Label htmlFor="language">Programming Language *</Label>
              <Select
                value={challenge.language || ''}
                onValueChange={(value) => {
                  setChallenge({ ...challenge, language: value })
                  handleUpdateField('language', value)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="javascript">JavaScript</SelectItem>
                  <SelectItem value="python">Python</SelectItem>
                  <SelectItem value="java">Java</SelectItem>
                  <SelectItem value="cpp">C++</SelectItem>
                  <SelectItem value="csharp">C#</SelectItem>
                  <SelectItem value="go">Go</SelectItem>
                  <SelectItem value="rust">Rust</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="instructions">Instructions *</Label>
              <Textarea
                id="instructions"
                value={challenge.instructions || ''}
                onChange={(e) => setChallenge({ ...challenge, instructions: e.target.value })}
                onBlur={(e) => handleUpdateField('instructions', e.target.value)}
                placeholder="Describe what the code should do..."
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="initial_code">Initial Code (Optional)</Label>
              <Textarea
                id="initial_code"
                value={challenge.initial_code || ''}
                onChange={(e) => setChallenge({ ...challenge, initial_code: e.target.value })}
                onBlur={(e) => handleUpdateField('initialCode', e.target.value)}
                placeholder="function solution() { ... }"
                rows={6}
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="test_cases">Test Cases (JSON)</Label>
              <Textarea
                id="test_cases"
                value={typeof challenge.test_cases === 'string' ? challenge.test_cases : JSON.stringify(challenge.test_cases || [], null, 2)}
                onChange={(e) => setChallenge({ ...challenge, test_cases: e.target.value })}
                onBlur={(e) => handleUpdateField('testCases', e.target.value)}
                placeholder='[{"input": [1, 2], "output": 3}]'
                rows={6}
                className="font-mono text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="time_limit">Time Limit (ms)</Label>
                <Input
                  id="time_limit"
                  type="number"
                  value={challenge.time_limit || ''}
                  onChange={(e) => setChallenge({ ...challenge, time_limit: Number(e.target.value) })}
                  onBlur={(e) => handleUpdateField('timeLimit', Number(e.target.value))}
                  placeholder="1000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="memory_limit">Memory Limit (MB)</Label>
                <Input
                  id="memory_limit"
                  type="number"
                  value={challenge.memory_limit || ''}
                  onChange={(e) => setChallenge({ ...challenge, memory_limit: Number(e.target.value) })}
                  onBlur={(e) => handleUpdateField('memoryLimit', Number(e.target.value))}
                  placeholder="128"
                />
              </div>
            </div>
          </div>
        )

      case 'PROJECT':
        return (
          <div className="space-y-4 border-t pt-6">
            <div className="space-y-2">
              <Label htmlFor="project_structure">Project Structure (JSON) *</Label>
              <Textarea
                id="project_structure"
                value={typeof challenge.project_structure === 'string' ? challenge.project_structure : JSON.stringify(challenge.project_structure || {}, null, 2)}
                onChange={(e) => setChallenge({ ...challenge, project_structure: e.target.value })}
                onBlur={(e) => handleUpdateField('projectStructure', e.target.value)}
                placeholder='{"folders": ["src", "tests"], "files": ["index.js"]}'
                rows={6}
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project_files">Project Files (JSON) *</Label>
              <Textarea
                id="project_files"
                value={typeof challenge.project_files === 'string' ? challenge.project_files : JSON.stringify(challenge.project_files || {}, null, 2)}
                onChange={(e) => setChallenge({ ...challenge, project_files: e.target.value })}
                onBlur={(e) => handleUpdateField('projectFiles', e.target.value)}
                placeholder='{"index.js": "console.log(\"Hello\")"}'
                rows={6}
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project_test_cases">Project Test Cases (JSON)</Label>
              <Textarea
                id="project_test_cases"
                value={typeof challenge.project_test_cases === 'string' ? challenge.project_test_cases : JSON.stringify(challenge.project_test_cases || [], null, 2)}
                onChange={(e) => setChallenge({ ...challenge, project_test_cases: e.target.value })}
                onBlur={(e) => handleUpdateField('projectTestCases', e.target.value)}
                placeholder='[{"name": "Test 1", "command": "npm test"}]'
                rows={4}
                className="font-mono text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="test_setup">Test Setup (Optional)</Label>
                <Textarea
                  id="test_setup"
                  value={challenge.test_setup || ''}
                  onChange={(e) => setChallenge({ ...challenge, test_setup: e.target.value })}
                  onBlur={(e) => handleUpdateField('testSetup', e.target.value)}
                  placeholder="npm install"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="test_teardown">Test Teardown (Optional)</Label>
                <Textarea
                  id="test_teardown"
                  value={challenge.test_teardown || ''}
                  onChange={(e) => setChallenge({ ...challenge, test_teardown: e.target.value })}
                  onBlur={(e) => handleUpdateField('testTeardown', e.target.value)}
                  placeholder="npm run cleanup"
                  rows={3}
                />
              </div>
            </div>
          </div>
        )

      default:
        return (
          <div className="border-t pt-6">
            <p className="text-sm text-muted-foreground">
              This challenge type does not require additional fields.
            </p>
          </div>
        )
    }
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => challenge.lesson_id ? router.push(`/lms/lessons/${challenge.lesson_id}`) : router.push('/lms')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Lesson
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Edit Challenge</CardTitle>
              <CardDescription>
                Challenge ID: {challenge.id} | Type: {challenge.type}
              </CardDescription>
            </div>
            <Badge variant="outline">{challenge.type}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Label */}
          <div className="space-y-2">
            <Label htmlFor="label">Challenge Label *</Label>
            <Input
              id="label"
              value={challenge.label}
              onChange={(e) => setChallenge({ ...challenge, label: e.target.value })}
              onBlur={(e) => handleUpdateField('label', e.target.value)}
              placeholder="Enter challenge label..."
            />
          </div>

          {/* Explanation */}
          <div className="space-y-2">
            <Label htmlFor="explanation">Explanation (Optional)</Label>
            <Textarea
              id="explanation"
              value={challenge.explanation || ''}
              onChange={(e) => setChallenge({ ...challenge, explanation: e.target.value })}
              onBlur={(e) => handleUpdateField('explanation', e.target.value)}
              placeholder="Add an explanation..."
              rows={3}
            />
          </div>

          {/* Type-specific fields */}
          {renderTypeSpecificFields()}

          {/* Validation Error */}
          {validationError && (
            <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">
              {validationError}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={handleSaveAndReturn}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save & Return to Lesson'}
            </Button>
            <Button
              variant="outline"
              onClick={() => challenge.lesson_id ? router.push(`/lms/lessons/${challenge.lesson_id}`) : router.push('/lms')}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
