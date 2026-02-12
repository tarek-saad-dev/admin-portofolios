'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Plus, Trash2, Check, X, ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { Challenge, QuizOption } from '@/types/lms'

// Validate Google Drive URL (frontend - pattern only, no extension check)
function isValidGoogleDriveUrl(url: string): boolean {
  if (!url) return false

  // Check if it's a Google Drive URL
  const isGoogleDrive = url.includes('drive.google.com')
  if (!isGoogleDrive) return false

  // Check if URL matches valid patterns and has extractable file ID
  // Pattern 1: https://drive.google.com/file/d/{FILE_ID}/view
  const pattern1 = /\/file\/d\/([a-zA-Z0-9_-]+)/
  const match1 = url.match(pattern1)
  if (match1) return true

  // Pattern 2: https://drive.google.com/open?id={FILE_ID}
  const pattern2 = /[?&]id=([a-zA-Z0-9_-]+)/
  const match2 = url.match(pattern2)
  if (match2) return true

  return false
}

// Alias for backward compatibility
const isValidGoogleDriveAudioUrl = isValidGoogleDriveUrl
const isValidGoogleDrivePdfUrl = isValidGoogleDriveUrl

// Extract file ID from Google Drive URL for preview
function extractGoogleDriveFileId(url: string): string | null {
  if (!url) return null

  // Pattern 1: https://drive.google.com/file/d/{FILE_ID}/view
  const pattern1 = /\/file\/d\/([a-zA-Z0-9_-]+)/
  const match1 = url.match(pattern1)
  if (match1) return match1[1]

  // Pattern 2: https://drive.google.com/open?id={FILE_ID}
  const pattern2 = /[?&]id=([a-zA-Z0-9_-]+)/
  const match2 = url.match(pattern2)
  if (match2) return match2[1]

  return null
}

export default function ChallengeEditorPage() {
  const router = useRouter()
  const params = useParams()
  const challengeId = params.id as string

  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [options, setOptions] = useState<QuizOption[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newOptionText, setNewOptionText] = useState('')
  const [validationError, setValidationError] = useState('')
  const [audioLoading, setAudioLoading] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)

  useEffect(() => {
    if (challengeId) {
      fetchChallenge()
      fetchOptions()
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

  const fetchOptions = async () => {
    try {
      const res = await fetch(`/api/lms/quiz-options?challengeId=${challengeId}`)
      const data = await res.json()
      if (data.success) {
        setOptions(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching options:', error)
    }
  }

  const handleAddOption = async () => {
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
        setOptions([...options, data.data])
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

  const handleToggleCorrect = async (optionId: number, currentCorrect: boolean) => {
    try {
      const res = await fetch(`/api/lms/quiz-options?id=${optionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correct: !currentCorrect }),
      })

      const data = await res.json()
      if (data.success) {
        setOptions(options.map((opt) => (opt.id === optionId ? data.data : opt)))
        setValidationError('')
      } else {
        alert(data.error || 'Failed to update option')
      }
    } catch (error) {
      console.error('Error updating option:', error)
      alert('Failed to update option')
    }
  }

  const handleDeleteOption = async (optionId: number) => {
    if (!confirm('Are you sure you want to delete this option?')) {
      return
    }

    try {
      const res = await fetch(`/api/lms/quiz-options?id=${optionId}`, {
        method: 'DELETE',
      })

      const data = await res.json()
      if (data.success) {
        setOptions(options.filter((opt) => opt.id !== optionId))
        setValidationError('')
      } else {
        alert(data.error || 'Failed to delete option')
      }
    } catch (error) {
      console.error('Error deleting option:', error)
      alert('Failed to delete option')
    }
  }

  const handleUpdateChallengeField = async (field: string, value: string) => {
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

  const validateOptions = (): boolean => {
    if (!challenge) return false

    setValidationError('')

    // SELECT/ASSIST validation
    if (challenge.type === 'SELECT' || challenge.type === 'ASSIST') {
      if (options.length < 2) {
        setValidationError('Multiple choice questions must have at least 2 options')
        return false
      }
      const correctCount = options.filter((opt) => opt.correct).length
      if (correctCount === 0) {
        setValidationError('At least one option must be marked as correct')
        return false
      }
    }

    // VIDEO validation
    if (challenge.type === 'VIDEO' && !challenge.video_url) {
      setValidationError('VIDEO challenges require a video URL')
      return false
    }

    // IMAGE validation
    if (challenge.type === 'IMAGE' && !challenge.image_content) {
      setValidationError('IMAGE challenges require an image URL')
      return false
    }

    // PDF validation
    if (challenge.type === 'PDF') {
      if (!challenge.pdf_url) {
        setValidationError('PDF challenges require a PDF URL')
        return false
      }
      if (!isValidGoogleDrivePdfUrl(challenge.pdf_url)) {
        setValidationError('Invalid Google Drive PDF link. Make sure the file is shared as "Anyone with the link".')
        return false
      }
    }

    // TEXT validation
    if (challenge.type === 'TEXT' && !challenge.text_content && !challenge.web_view_content) {
      setValidationError('TEXT challenges require text content or web view content')
      return false
    }

    // AUDIO validation
    if (challenge.type === 'AUDIO') {
      if (!challenge.audio_url) {
        setValidationError('AUDIO challenges require an audio URL')
        return false
      }
      if (!isValidGoogleDriveAudioUrl(challenge.audio_url)) {
        setValidationError('Invalid Google Drive file link.')
        return false
      }
    }

    setValidationError('')
    return true
  }

  const handleSaveAndReturn = () => {
    if (!validateOptions()) {
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

  const needsOptions = challenge.type === 'SELECT' || challenge.type === 'ASSIST'

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
              onBlur={(e) => handleUpdateChallengeField('label', e.target.value)}
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
              onBlur={(e) => handleUpdateChallengeField('explanation', e.target.value)}
              placeholder="Add an explanation..."
              rows={3}
            />
          </div>

          {/* Options Editor for SELECT/ASSIST */}
          {needsOptions && (
            <div className="space-y-4 border-t pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Answer Options</h3>
                  <p className="text-sm text-muted-foreground">
                    Add multiple choice options. Mark at least one as correct.
                  </p>
                </div>
              </div>

              {/* Existing Options */}
              <div className="space-y-2">
                {options.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">
                    No options yet. Add at least 2 options below.
                  </p>
                ) : (
                  options.map((option) => (
                    <div
                      key={option.id}
                      className="flex items-center gap-3 p-3 border rounded-lg bg-card"
                    >
                      <Button
                        variant={option.correct ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleToggleCorrect(option.id, option.correct)}
                        className="shrink-0"
                      >
                        {option.correct ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                      </Button>
                      <p className="flex-1 text-sm">{option.text}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteOption(option.id)}
                        className="shrink-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>

              {/* Add New Option */}
              <div className="flex gap-2">
                <Input
                  value={newOptionText}
                  onChange={(e) => setNewOptionText(e.target.value)}
                  placeholder="Enter new option text..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddOption()
                    }
                  }}
                />
                <Button onClick={handleAddOption}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>

              <div className="text-xs text-muted-foreground">
                <p>• Click the checkmark to mark an option as correct</p>
                <p>• You can have multiple correct answers</p>
                <p>• Minimum 2 options required</p>
              </div>
            </div>
          )}

          {/* Validation Error */}
          {validationError && (
            <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">
              {validationError}
            </div>
          )}

          {/* Type-specific fields */}
          {challenge.type === 'VIDEO' && (
            <div className="space-y-4 border-t pt-6">
              <div className="space-y-2">
                <Label htmlFor="video_url">Video URL *</Label>
                <Input
                  id="video_url"
                  value={challenge.video_url || ''}
                  onChange={(e) => setChallenge({ ...challenge, video_url: e.target.value })}
                  onBlur={(e) => handleUpdateChallengeField('videoUrl', e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>
            </div>
          )}

          {challenge.type === 'AUDIO' && (
            <div className="space-y-4 border-t pt-6">
              <div className="space-y-2">
                <Label htmlFor="audio_url">Audio URL (Google Drive) *</Label>
                <Input
                  id="audio_url"
                  value={challenge.audio_url || ''}
                  onChange={(e) => setChallenge({ ...challenge, audio_url: e.target.value })}
                  onBlur={(e) => {
                    const url = e.target.value
                    // Validate Google Drive URL pattern only (no extension check)
                    if (url && !isValidGoogleDriveAudioUrl(url)) {
                      setValidationError('Invalid Google Drive file link.')
                      return
                    }
                    setValidationError('')
                    handleUpdateChallengeField('audioUrl', url)
                  }}
                  placeholder="https://drive.google.com/file/d/..."
                />
                <p className="text-xs text-muted-foreground">
                  Must be a Google Drive link to an mp3, wav, or m4a file
                </p>
              </div>

              {/* Audio Preview */}
              {challenge.audio_url && isValidGoogleDriveAudioUrl(challenge.audio_url) && (
                <div className="space-y-2">
                  <Label>Audio Preview</Label>

                  {audioLoading && (
                    <div className="flex items-center gap-2 p-4 border rounded-lg bg-muted/50">
                      <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                      <p className="text-sm text-muted-foreground">
                        Loading your audio from Google Drive... This may take a moment.
                      </p>
                    </div>
                  )}

                  <audio
                    controls
                    src={`/api/media/gdrive?url=${encodeURIComponent(challenge.audio_url)}`}
                    className="w-full"
                    onLoadStart={() => setAudioLoading(true)}
                    onCanPlay={() => setAudioLoading(false)}
                    onLoadedData={() => setAudioLoading(false)}
                    onError={() => {
                      setAudioLoading(false)
                      setValidationError('Failed to load audio preview. Ensure the file is shared as "Anyone with the link".')
                    }}
                  />

                  {!audioLoading && (
                    <p className="text-xs text-muted-foreground">
                      If preview fails, ensure the file is shared as &quot;Anyone with the link&quot;
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {challenge.type === 'IMAGE' && (
            <div className="space-y-4 border-t pt-6">
              <div className="space-y-2">
                <Label htmlFor="image_content">Image URL *</Label>
                <Input
                  id="image_content"
                  value={challenge.image_content || ''}
                  onChange={(e) => setChallenge({ ...challenge, image_content: e.target.value })}
                  onBlur={(e) => handleUpdateChallengeField('imageContent', e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>
          )}

          {challenge.type === 'PDF' && (
            <div className="space-y-4 border-t pt-6">
              <div className="space-y-2">
                <Label htmlFor="pdf_url">PDF URL (Google Drive) *</Label>
                <div className="flex gap-2">
                  <Input
                    id="pdf_url"
                    value={challenge.pdf_url || ''}
                    onChange={(e) => setChallenge({ ...challenge, pdf_url: e.target.value })}
                    onBlur={(e) => {
                      const url = e.target.value
                      // Validate Google Drive URL pattern only (no extension check)
                      if (url && !isValidGoogleDrivePdfUrl(url)) {
                        setValidationError('Invalid Google Drive PDF link. Make sure the file is shared as "Anyone with the link".')
                        return
                      }
                      setValidationError('')
                      handleUpdateChallengeField('pdfUrl', url)
                    }}
                    placeholder="https://drive.google.com/file/d/..."
                    className="flex-1"
                  />
                  {challenge.pdf_url && isValidGoogleDrivePdfUrl(challenge.pdf_url) && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        const fileId = extractGoogleDriveFileId(challenge.pdf_url || '')
                        if (fileId) {
                          window.open(`https://drive.google.com/file/d/${fileId}/preview`, '_blank')
                        }
                      }}
                      title="Open in Google Drive Preview"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Must be a Google Drive link (no .pdf extension required)
                </p>
              </div>

              {/* PDF Preview */}
              {challenge.pdf_url && isValidGoogleDrivePdfUrl(challenge.pdf_url) && (
                <div className="space-y-2">
                  <Label>PDF Preview</Label>

                  {pdfLoading && (
                    <div className="flex items-center gap-2 p-4 border rounded-lg bg-muted/50">
                      <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                      <p className="text-sm text-muted-foreground">
                        Loading your PDF from Google Drive... This may take a moment.
                      </p>
                    </div>
                  )}

                  <iframe
                    src={`/api/media/gdrive/pdf?url=${encodeURIComponent(challenge.pdf_url)}`}
                    className="w-full h-[600px] rounded border"
                    onLoad={() => setPdfLoading(false)}
                    onLoadStart={() => setPdfLoading(true)}
                    onError={() => {
                      setPdfLoading(false)
                      setValidationError('Failed to load PDF preview. Ensure the file is shared as "Anyone with the link".')
                    }}
                  />

                  {!pdfLoading && (
                    <p className="text-xs text-muted-foreground">
                      If preview fails, ensure the file is shared as &quot;Anyone with the link&quot;
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {challenge.type === 'TEXT' && (
            <div className="space-y-4 border-t pt-6">
              <div className="space-y-2">
                <Label htmlFor="text_content">Text Content *</Label>
                <Textarea
                  id="text_content"
                  value={challenge.text_content || ''}
                  onChange={(e) => setChallenge({ ...challenge, text_content: e.target.value })}
                  onBlur={(e) => handleUpdateChallengeField('textContent', e.target.value)}
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
                  onBlur={(e) => handleUpdateChallengeField('webViewContent', e.target.value)}
                  placeholder="Enter HTML content..."
                  rows={4}
                />
              </div>
            </div>
          )}

          {!needsOptions && !['VIDEO', 'IMAGE', 'PDF', 'TEXT'].includes(challenge.type) && (
            <div className="border-t pt-6">
              <p className="text-sm text-muted-foreground">
                Additional type-specific fields for {challenge.type} challenges (like code, project files, etc.) can be added via API or enhanced in future updates.
              </p>
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
