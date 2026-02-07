'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Plus, Trash2, Edit, GripVertical } from 'lucide-react'
import type { Lesson, Challenge } from '@/types/lms'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface SortableChallengeItemProps {
  challenge: Challenge
  onEdit: (id: number) => void
  onDelete: (id: number) => void
  getChallengeTypeBadge: (type: string) => string
}

function SortableChallengeItem({
  challenge,
  onEdit,
  onDelete,
  getChallengeTypeBadge,
}: SortableChallengeItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: challenge.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
    >
      <div {...attributes} {...listeners} className="cursor-move">
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Badge className={getChallengeTypeBadge(challenge.type)}>
            {challenge.type}
          </Badge>
          <span className="text-sm text-muted-foreground">
            Order: {challenge.order || 0}
          </span>
        </div>
        <p className="font-medium truncate">
          {challenge.label || `Challenge ${challenge.id}`}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(challenge.id)}
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(challenge.id)}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  )
}

export default function LessonManagementPage() {
  const router = useRouter()
  const params = useParams()
  const lessonId = parseInt(params.id as string)

  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(true)
  const [courseId, setCourseId] = useState<number | null>(null)

  useEffect(() => {
    if (isNaN(lessonId)) {
      router.push('/lms')
      return
    }
    fetchLessonData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId])

  const fetchLessonData = async () => {
    try {
      setLoading(true)

      // Fetch lesson details
      const lessonRes = await fetch(`/api/lms/lessons?id=${lessonId}`)
      if (!lessonRes.ok) throw new Error('Failed to fetch lesson')
      const lessonData = await lessonRes.json()

      if (lessonData.success && lessonData.data) {
        setLesson(lessonData.data)

        // Fetch unit to get course_id for breadcrumb
        if (lessonData.data.unit_id) {
          const unitRes = await fetch(`/api/lms/units?id=${lessonData.data.unit_id}`)
          if (unitRes.ok) {
            const unitData = await unitRes.json()
            if (unitData.success && unitData.data) {
              setCourseId(unitData.data.course_id)
            }
          }
        }
      }

      // Fetch challenges for this lesson
      const challengesRes = await fetch(`/api/lms/challenges?lessonId=${lessonId}`)
      if (!challengesRes.ok) throw new Error('Failed to fetch challenges')
      const challengesData = await challengesRes.json()

      if (challengesData.success && Array.isArray(challengesData.data)) {
        setChallenges(challengesData.data.sort((a: Challenge, b: Challenge) => (a.order || 0) - (b.order || 0)))
      }
    } catch (error) {
      console.error('Error fetching lesson data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteChallenge = async (challengeId: number) => {
    if (!confirm('Are you sure you want to delete this challenge?')) return

    try {
      const res = await fetch(`/api/lms/challenges?id=${challengeId}`, {
        method: 'DELETE',
      })

      const data = await res.json()
      if (!data.success) {
        throw new Error(data.error || 'Failed to delete challenge')
      }

      await fetchLessonData()
    } catch (error) {
      console.error('Error deleting challenge:', error)
      alert(error instanceof Error ? error.message : 'Failed to delete challenge')
    }
  }

  const handleAddChallenge = () => {
    router.push(`/lms/challenges/new?lessonId=${lessonId}`)
  }

  const handleEditChallenge = (challengeId: number) => {
    router.push(`/lms/challenges/${challengeId}`)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = challenges.findIndex((c) => c.id === active.id)
    const newIndex = challenges.findIndex((c) => c.id === over.id)

    if (oldIndex === -1 || newIndex === -1) {
      return
    }

    // Optimistic update
    const reorderedChallenges = arrayMove(challenges, oldIndex, newIndex)
    setChallenges(reorderedChallenges)

    // Persist to backend
    try {
      const orderedIds = reorderedChallenges.map((c: Challenge) => c.id)
      const res = await fetch('/api/lms/challenges/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId,
          orderedChallengeIds: orderedIds,
        }),
      })

      const data = await res.json()
      if (!data.success) {
        throw new Error(data.error || 'Failed to reorder challenges')
      }

      // Refresh to get updated order values from server
      await fetchLessonData()
    } catch (error) {
      console.error('Error reordering challenges:', error)
      alert(error instanceof Error ? error.message : 'Failed to reorder challenges')
      // Revert on error
      await fetchLessonData()
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleBackToCourse = () => {
    if (courseId) {
      router.push(`/lms/courses/${courseId}`)
    } else {
      router.push('/lms')
    }
  }

  const getChallengeTypeBadge = (type: string) => {
    const typeColors: Record<string, string> = {
      SELECT: 'bg-blue-500',
      ASSIST: 'bg-purple-500',
      COMPLETE: 'bg-green-500',
      WRITE: 'bg-orange-500',
      PROJECT: 'bg-red-500',
    }
    return typeColors[type] || 'bg-gray-500'
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading lesson...</p>
        </div>
      </div>
    )
  }

  if (!lesson) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Lesson not found</p>
            <div className="flex justify-center mt-4">
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
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleBackToCourse}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold">Lesson Management</h1>
          </div>
          <p className="text-muted-foreground">
            Manage challenges for: <span className="font-semibold">{lesson.title}</span>
          </p>
        </div>
        <Button onClick={handleAddChallenge}>
          <Plus className="h-4 w-4 mr-2" />
          Add Challenge
        </Button>
      </div>

      {/* Lesson Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>{lesson.title}</CardTitle>
          <CardDescription>
            Lesson ID: {lesson.id} | Order: {lesson.order}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Challenges List */}
      <Card>
        <CardHeader>
          <CardTitle>Challenges ({challenges.length})</CardTitle>
          <CardDescription>
            Manage the challenges for this lesson
          </CardDescription>
        </CardHeader>
        <CardContent>
          {challenges.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No challenges yet</p>
              <Button onClick={handleAddChallenge} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Create First Challenge
              </Button>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={challenges.map((c) => c.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {challenges.map((challenge) => (
                    <SortableChallengeItem
                      key={challenge.id}
                      challenge={challenge}
                      onEdit={handleEditChallenge}
                      onDelete={handleDeleteChallenge}
                      getChallengeTypeBadge={getChallengeTypeBadge}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={handleBackToCourse}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Course Builder
        </Button>
      </div>
    </div>
  )
}
