"use client"

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Plus, GripVertical, Edit, Trash2, ChevronRight, ChevronDown } from 'lucide-react'
import { Course, Unit, Lesson, Challenge } from '@/types/lms'
import Link from 'next/link'

interface UnitWithLessons extends Unit {
  lessons: (Lesson & { challenges: Challenge[] })[]
}

export default function CourseBuilderPage() {
  const params = useParams()
  const courseId = params.id as string

  const [course, setCourse] = useState<Course | null>(null)
  const [units, setUnits] = useState<UnitWithLessons[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedUnits, setExpandedUnits] = useState<Set<number>>(new Set())
  const [expandedLessons, setExpandedLessons] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (courseId && courseId !== 'new') {
      fetchCourseData()
    } else {
      setLoading(false)
    }
  }, [courseId])

  const fetchCourseData = async () => {
    try {
      setLoading(true)

      const courseRes = await fetch(`/api/lms/courses?id=${courseId}`)
      const courseData = await courseRes.json()

      if (courseData.success && courseData.data.length > 0) {
        setCourse(courseData.data[0])
      }

      const unitsRes = await fetch(`/api/lms/units?courseId=${courseId}`)
      const unitsData = await unitsRes.json()

      if (unitsData.success) {
        const unitsWithLessons = await Promise.all(
          unitsData.data.map(async (unit: Unit) => {
            const lessonsRes = await fetch(`/api/lms/lessons?unitId=${unit.id}`)
            const lessonsData = await lessonsRes.json()

            const lessonsWithChallenges = await Promise.all(
              (lessonsData.data || []).map(async (lesson: Lesson) => {
                const challengesRes = await fetch(`/api/lms/challenges?lessonId=${lesson.id}`)
                const challengesData = await challengesRes.json()

                return {
                  ...lesson,
                  challenges: challengesData.data || []
                }
              })
            )

            return {
              ...unit,
              lessons: lessonsWithChallenges
            }
          })
        )

        setUnits(unitsWithLessons)
      }
    } catch (error) {
      console.error('Error fetching course data:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleUnit = (unitId: number) => {
    const newExpanded = new Set(expandedUnits)
    if (newExpanded.has(unitId)) {
      newExpanded.delete(unitId)
    } else {
      newExpanded.add(unitId)
    }
    setExpandedUnits(newExpanded)
  }

  const toggleLesson = (lessonId: number) => {
    const newExpanded = new Set(expandedLessons)
    if (newExpanded.has(lessonId)) {
      newExpanded.delete(lessonId)
    } else {
      newExpanded.add(lessonId)
    }
    setExpandedLessons(newExpanded)
  }

  const handleCreateUnit = async () => {
    const title = prompt('Enter unit title:')
    if (!title) return

    try {
      const response = await fetch('/api/lms/units', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: parseInt(courseId),
          title,
          order: units.length
        })
      })

      const data = await response.json()
      if (data.success) {
        fetchCourseData()
      }
    } catch (error) {
      console.error('Error creating unit:', error)
    }
  }

  const handleCreateLesson = async (unitId: number) => {
    const title = prompt('Enter lesson title:')
    if (!title) return

    try {
      const unit = units.find(u => u.id === unitId)
      const response = await fetch('/api/lms/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unitId,
          title,
          order: unit?.lessons.length || 0
        })
      })

      const data = await response.json()
      if (data.success) {
        fetchCourseData()
      }
    } catch (error) {
      console.error('Error creating lesson:', error)
    }
  }

  const handleDeleteUnit = async (unitId: number) => {
    if (!confirm('Delete this unit and all its lessons?')) return

    try {
      const response = await fetch(`/api/lms/units?id=${unitId}`, {
        method: 'DELETE'
      })

      const data = await response.json()
      if (data.success) {
        fetchCourseData()
      }
    } catch (error) {
      console.error('Error deleting unit:', error)
    }
  }

  const handleDeleteLesson = async (lessonId: number) => {
    if (!confirm('Delete this lesson?')) return

    try {
      const response = await fetch(`/api/lms/lessons?id=${lessonId}`, {
        method: 'DELETE'
      })

      const data = await response.json()
      if (data.success) {
        fetchCourseData()
      }
    } catch (error) {
      console.error('Error deleting lesson:', error)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Course not found</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/lms">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </Button>
        </Link>
      </div>

      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold">{course.title}</h1>
          <div className="flex gap-2 mt-2">
            <Badge variant={course.type === 'GLOBAL' ? 'default' : 'secondary'}>
              {course.type}
            </Badge>
            <Badge variant={course.price === 0 ? 'outline' : 'default'}>
              {course.price === 0 ? 'Free' : `$${course.price}`}
            </Badge>
          </div>
        </div>
        <Button onClick={handleCreateUnit}>
          <Plus className="h-4 w-4 mr-2" />
          Add Unit
        </Button>
      </div>

      <div className="space-y-4">
        {units.map((unit) => (
          <Card key={unit.id}>
            <CardHeader className="cursor-pointer hover:bg-muted/50" onClick={() => toggleUnit(unit.id)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <GripVertical className="h-5 w-5 text-muted-foreground" />
                  {expandedUnits.has(unit.id) ? (
                    <ChevronDown className="h-5 w-5" />
                  ) : (
                    <ChevronRight className="h-5 w-5" />
                  )}
                  <div>
                    <CardTitle className="text-lg">{unit.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {unit.lessons.length} lesson{unit.lessons.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCreateLesson(unit.id)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Lesson
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteUnit(unit.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            {expandedUnits.has(unit.id) && (
              <CardContent className="pt-0">
                <div className="space-y-2 ml-8">
                  {unit.lessons.map((lesson) => (
                    <Card key={lesson.id} className="border-l-4 border-l-primary">
                      <CardHeader className="py-3 cursor-pointer hover:bg-muted/50" onClick={() => toggleLesson(lesson.id)}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                            {expandedLessons.has(lesson.id) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                            <div>
                              <h4 className="font-medium">{lesson.title}</h4>
                              <p className="text-xs text-muted-foreground">
                                {lesson.challenges.length} challenge{lesson.challenges.length !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                            <Link href={`/lms/lessons/${lesson.id}`}>
                              <Button variant="outline" size="sm">
                                <Edit className="h-4 w-4 mr-2" />
                                Manage Challenges
                              </Button>
                            </Link>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteLesson(lesson.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>

                      {expandedLessons.has(lesson.id) && lesson.challenges.length > 0 && (
                        <CardContent className="py-3">
                          <div className="space-y-1 ml-8">
                            {lesson.challenges.map((challenge) => (
                              <div key={challenge.id} className="flex items-center gap-2 text-sm p-2 bg-muted rounded">
                                <Badge variant="outline">{challenge.type}</Badge>
                                <span className="flex-1 truncate">
                                  {challenge.question || challenge.prompt || 'Untitled Challenge'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        ))}

        {units.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No units yet. Add your first unit to get started.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
