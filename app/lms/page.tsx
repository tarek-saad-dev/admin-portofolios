"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Search, Copy, Trash2, Edit, BookOpen, Users } from 'lucide-react'
import { CourseWithStats } from '@/types/lms'
import Link from 'next/link'

export default function LMSAdminPage() {
  const [courses, setCourses] = useState<CourseWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [freeFilter, setFreeFilter] = useState<string>('all')

  useEffect(() => {
    fetchCourses()
  }, [typeFilter, categoryFilter, freeFilter, searchQuery])

  const fetchCourses = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()

      if (typeFilter !== 'all') params.append('type', typeFilter)
      if (categoryFilter !== 'all') params.append('category', categoryFilter)
      if (freeFilter !== 'all') params.append('isFree', freeFilter)
      if (searchQuery) params.append('search', searchQuery)

      const response = await fetch(`/api/lms/courses?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        setCourses(data.data)
      }
    } catch (error) {
      console.error('Error fetching courses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDuplicate = async (courseId: number) => {
    if (!confirm('Are you sure you want to duplicate this course? This will create a deep copy of all units, lessons, and challenges.')) {
      return
    }

    try {
      const response = await fetch('/api/lms/courses/duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId })
      })

      const data = await response.json()

      if (data.success) {
        alert('Course duplicated successfully!')
        fetchCourses()
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Error duplicating course:', error)
      alert('Failed to duplicate course')
    }
  }

  const handleDelete = async (course: CourseWithStats) => {
    const message = `Are you sure you want to delete "${course.title}"?\n\nThis will permanently delete:\n- ${course.unitCount || 0} units\n- ${course.lessonCount || 0} lessons\n- ${course.challengeCount || 0} challenges\n\nThis action cannot be undone.`

    if (!confirm(message)) {
      return
    }

    try {
      const response = await fetch(`/api/lms/courses?id=${course.id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        alert('Course deleted successfully!')
        fetchCourses()
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Error deleting course:', error)
      alert('Failed to delete course')
    }
  }

  const categories = Array.from(new Set(courses.map(c => c.category).filter(Boolean)))

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">LMS Admin</h1>
          <p className="text-muted-foreground mt-1">Manage courses, units, lessons, and challenges</p>
        </div>
        <div className="flex gap-2">
          <Link href="/lms/users">
            <Button variant="outline">
              <Users className="h-4 w-4 mr-2" />
              Users & Progress
            </Button>
          </Link>
          <Link href="/lms/courses/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Course
            </Button>
          </Link>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="GLOBAL">Global</SelectItem>
                <SelectItem value="CUSTOMIZE">Customize</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat || ''}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={freeFilter} onValueChange={setFreeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Pricing" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Pricing</SelectItem>
                <SelectItem value="true">Free Only</SelectItem>
                <SelectItem value="false">Paid Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : courses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No courses found. Create your first course to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Card key={course.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <Badge variant={course.type === 'GLOBAL' ? 'default' : 'secondary'}>
                    {course.type}
                  </Badge>
                  <Badge variant={course.price === 0 ? 'outline' : 'default'}>
                    {course.price === 0 ? 'Free' : `$${course.price}`}
                  </Badge>
                </div>
                <CardTitle className="line-clamp-2">{course.title}</CardTitle>
                {course.category && (
                  <CardDescription>{course.category}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {course.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {course.description}
                    </p>
                  )}

                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="text-center p-2 bg-muted rounded">
                      <div className="font-semibold">{course.unitCount || 0}</div>
                      <div className="text-xs text-muted-foreground">Units</div>
                    </div>
                    <div className="text-center p-2 bg-muted rounded">
                      <div className="font-semibold">{course.lessonCount || 0}</div>
                      <div className="text-xs text-muted-foreground">Lessons</div>
                    </div>
                    <div className="text-center p-2 bg-muted rounded">
                      <div className="font-semibold">{course.challengeCount || 0}</div>
                      <div className="text-xs text-muted-foreground">Challenges</div>
                    </div>
                  </div>

                  {course.assigned_to && course.assigned_to.length > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {course.assigned_to.length} user{course.assigned_to.length !== 1 ? 's' : ''} assigned
                      </span>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Link href={`/lms/courses/${course.id}`} className="flex-1">
                      <Button variant="default" size="sm" className="w-full">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDuplicate(course.id)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(course)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
