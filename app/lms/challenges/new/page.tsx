'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft } from 'lucide-react'
import type { ChallengeType, Challenge } from '@/types/lms'

export default function NewChallengePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const lessonIdParam = searchParams.get('lessonId')

  const [lessonId, setLessonId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    type: 'SELECT' as ChallengeType,
    label: '',
    explanation: '',
  })

  useEffect(() => {
    if (lessonIdParam) {
      const parsed = parseInt(lessonIdParam)
      if (!isNaN(parsed) && parsed > 0) {
        setLessonId(parsed)
      }
    }
  }, [lessonIdParam])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!lessonId) {
      alert('Invalid lesson ID')
      return
    }

    try {
      setLoading(true)

      // Fetch current challenges to calculate next order
      const challengesRes = await fetch(`/api/lms/challenges?lessonId=${lessonId}`)
      let nextOrder = 0

      if (challengesRes.ok) {
        const challengesData = await challengesRes.json()
        if (challengesData.success && Array.isArray(challengesData.data)) {
          const maxOrder = challengesData.data.reduce((max: number, c: Challenge) => Math.max(max, c.order || 0), 0)
          nextOrder = maxOrder + 1
        }
      }

      const payload = {
        lessonId,
        type: formData.type,
        label: formData.label,
        explanation: formData.explanation || undefined,
        order: nextOrder,
      }

      const res = await fetch('/api/lms/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        const data = await res.json()
        if (data.success && data.data) {
          // Redirect to challenge editor to add options (for SELECT/ASSIST) or other details
          router.push(`/lms/challenges/${data.data.id}`)
        } else {
          alert(data.error || 'Failed to create challenge')
        }
      } else {
        alert('Failed to create challenge')
      }
    } catch (error) {
      console.error('Error creating challenge:', error)
      alert(error instanceof Error ? error.message : 'Failed to create challenge')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    if (lessonId) {
      router.push(`/lms/lessons/${lessonId}`)
    } else {
      router.push('/lms')
    }
  }

  if (!lessonId) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-destructive mb-4">
              Invalid or missing lesson ID
            </p>
            <div className="flex justify-center">
              <Button onClick={() => router.push('/lms')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to LMS
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Button variant="ghost" size="sm" onClick={handleCancel}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Create New Challenge</h1>
        </div>
        <p className="text-muted-foreground">
          Add a new challenge to lesson #{lessonId}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Challenge Details</CardTitle>
            <CardDescription>
              Fill in the basic information for this challenge
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Challenge Type */}
            <div className="space-y-2">
              <Label htmlFor="type">Challenge Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value: ChallengeType) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SELECT">SELECT - Multiple Choice</SelectItem>
                  <SelectItem value="ASSIST">ASSIST - Assisted Coding</SelectItem>
                  <SelectItem value="CODE">CODE - Code Challenge</SelectItem>
                  <SelectItem value="VIDEO">VIDEO - Video Content</SelectItem>
                  <SelectItem value="AUDIO">AUDIO - Podcast Audio</SelectItem>
                  <SelectItem value="TEXT">TEXT - Text Content</SelectItem>
                  <SelectItem value="IMAGE">IMAGE - Image Content</SelectItem>
                  <SelectItem value="PDF">PDF (Google Drive)</SelectItem>
                  <SelectItem value="COMPLETE">COMPLETE - Code Completion</SelectItem>
                  <SelectItem value="WRITE">WRITE - Writing Exercise</SelectItem>
                  <SelectItem value="PROJECT">PROJECT - Full Project</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Select the type of challenge you want to create
              </p>
            </div>

            {/* Label (required for all types) */}
            <div className="space-y-2">
              <Label htmlFor="label">Challenge Label *</Label>
              <Input
                id="label"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                placeholder="Enter a short label for this challenge..."
                required
              />
              <p className="text-xs text-muted-foreground">
                A short descriptive label for this challenge (e.g., &quot;Introduction to Variables&quot;)
              </p>
            </div>

            {/* Explanation (optional for all types) */}
            <div className="space-y-2">
              <Label htmlFor="explanation">Explanation (Optional)</Label>
              <Textarea
                id="explanation"
                value={formData.explanation}
                onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                placeholder="Add an explanation or additional notes..."
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Optional explanation or hints for the learner
              </p>
            </div>

            {/* Type-specific note */}
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> After creating this challenge, you can edit it to add type-specific fields like:
              </p>
              <ul className="text-sm text-muted-foreground mt-2 ml-4 list-disc">
                {formData.type === 'SELECT' && <li>Multiple choice options</li>}
                {formData.type === 'CODE' && <li>Starter code, test cases, language</li>}
                {formData.type === 'ASSIST' && <li>Starter code, instructions</li>}
                {formData.type === 'VIDEO' && <li>Video URL</li>}
                {formData.type === 'TEXT' && <li>Text content</li>}
                {formData.type === 'IMAGE' && <li>Image URL</li>}
                {formData.type === 'PDF' && <li>PDF URL</li>}
                {formData.type === 'PROJECT' && <li>Project metadata, file structure, tests</li>}
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4 mt-6">
          <Button type="button" variant="outline" onClick={handleCancel} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Challenge'}
          </Button>
        </div>
      </form>
    </div>
  )
}
