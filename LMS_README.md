# LMS Admin Module

A comprehensive Learning Management System (LMS) admin module for managing courses, units, lessons, challenges, and user progress.

## Overview

This module provides full administrative control over the LMS database, including:
- Course management (CRUD, duplication, assignment)
- Course builder with hierarchical tree editor
- Type-aware challenge editor
- User progress tracking and management
- Leaderboard and analytics

## Database Structure

The LMS uses 9 PostgreSQL tables:

1. **courses** - Global or customized courses
2. **units** - Course units (ordered)
3. **lessons** - Unit lessons (ordered)
4. **challenges** - Learning challenges (10 types)
5. **quiz_options** - Options for SELECT/ASSIST challenges
6. **word_options** - Options for COMPLETE/WRITE challenges
7. **lesson_challenges** - Many-to-many join table (lessons ↔ challenges)
8. **challenge_progress** - Per-user completion tracking
9. **user_progress** - Per-user state (hearts, points, coins)

### Hierarchy
```
Course → Units → Lessons → Challenges → Options + Progress
```

## Environment Setup

### Required Environment Variables

Add to your `.env.local`:

```env
DATABASE_URL=postgresql://neondb_owner:npg_tDWg5Lu2CGIz@ep-super-mouse-ahpixibl-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

### Dependencies

The module uses:
- `pg` - PostgreSQL client
- `zod` - Schema validation
- Next.js App Router
- shadcn/ui components

Install dependencies:
```bash
npm install pg @types/pg zod
```

## Features

### 1. Courses Management (`/lms`)

**List View:**
- Filter by type (GLOBAL/CUSTOMIZE)
- Filter by category
- Filter by pricing (free/paid)
- Search by title/description
- View stats (units, lessons, challenges count)

**Actions:**
- Create new course
- Edit course details
- Duplicate course (deep copy with all content)
- Delete course (with cascade confirmation)
- Assign users to courses

### 2. Course Builder (`/lms/courses/[id]`)

**Visual Tree Editor:**
- Left side: Hierarchical tree view
- Expandable units and lessons
- Drag & drop reordering (coming soon)

**Unit Management:**
- Create/Edit/Delete units
- Reorder units within course
- View lesson count per unit

**Lesson Management:**
- Create/Edit/Delete lessons
- Reorder lessons within unit
- Attach/detach challenges
- View challenge count per lesson

### 3. Challenge Types

The system supports 10 challenge types:

1. **SELECT** - Multiple choice questions
   - Requires: question, quiz_options
   - At least one correct option required

2. **ASSIST** - Assisted selection
   - Requires: question, quiz_options
   - Similar to SELECT with hints

3. **COMPLETE** - Fill in the blanks
   - Requires: prompt, word_options
   - Correct placement logic

4. **WRITE** - Free text writing
   - Requires: prompt, word_options
   - Ordering and validation

5. **CODE** - Code challenges
   - Requires: language, starterCode, instructions, testCases
   - JSON test cases format

6. **VIDEO** - Video content
   - Requires: url
   - Embedded video player

7. **PDF** - PDF documents
   - Requires: url
   - PDF viewer integration

8. **IMAGE** - Image content
   - Requires: url
   - Image display

9. **TEXT** - Text content
   - Requires: content
   - Rich text support

10. **PROJECT** - Project-based learning
    - Requires: projectMetadata, filesStructure, tests, rubric
    - Complex JSON structures

### 4. User Progress Management

**User List:**
- View all users from user_progress table
- Filter and search users
- View user statistics

**User Profile:**
- Active course
- Hearts, points, coins
- Challenge completion list
- Progress percentage

**Admin Actions:**
- Reset hearts/points/coins
- Reset progress for specific course
- Force set active course
- View detailed progress

**Leaderboard:**
- Rank users by points
- Filter by course
- Export data

## API Routes

### Courses
- `GET /api/lms/courses` - List courses with filters
- `POST /api/lms/courses` - Create course
- `PUT /api/lms/courses` - Update course
- `DELETE /api/lms/courses?id={id}` - Delete course
- `POST /api/lms/courses/duplicate` - Duplicate course

### Units
- `GET /api/lms/units?courseId={id}` - List units
- `POST /api/lms/units` - Create unit
- `POST /api/lms/units` (action=reorder) - Reorder units
- `PUT /api/lms/units` - Update unit
- `DELETE /api/lms/units?id={id}` - Delete unit

### Lessons
- `GET /api/lms/lessons?unitId={id}` - List lessons
- `POST /api/lms/lessons` - Create lesson
- `POST /api/lms/lessons` (action=reorder) - Reorder lessons
- `PUT /api/lms/lessons` - Update lesson
- `DELETE /api/lms/lessons?id={id}` - Delete lesson

### Challenges
- `GET /api/lms/challenges?lessonId={id}` - List challenges
- `GET /api/lms/challenges?challengeId={id}` - Get single challenge
- `POST /api/lms/challenges` - Create challenge
- `PUT /api/lms/challenges` - Update challenge
- `DELETE /api/lms/challenges?id={id}` - Delete challenge

### Lesson Challenges (Join Table)
- `POST /api/lms/lesson-challenges` - Attach challenge to lesson
- `POST /api/lms/lesson-challenges` (action=reorder) - Reorder challenges
- `DELETE /api/lms/lesson-challenges?id={id}` - Detach challenge

## Data Integrity

### Cascading Deletes

The database handles cascading deletes automatically:
- Deleting a course removes all units, lessons, and lesson_challenges
- Deleting a unit removes all lessons and lesson_challenges
- Deleting a lesson removes all lesson_challenges
- Deleting a challenge removes all quiz_options, word_options, and lesson_challenges

### Transactions

All reordering operations use database transactions to ensure atomicity:
- Unit reordering
- Lesson reordering
- Challenge reordering within lessons
- Course duplication (deep copy)

### Validation

All API endpoints use Zod schemas for validation:
- Type checking
- Required field validation
- Format validation
- Business logic validation

## Usage Guide

### Creating a Course

1. Navigate to `/lms`
2. Click "New Course"
3. Fill in course details:
   - Title (required)
   - Description
   - Category
   - Type (GLOBAL/CUSTOMIZE)
   - Pricing (Free/Paid)
4. Save course

### Building Course Content

1. Open course in builder (`/lms/courses/[id]`)
2. Add units:
   - Click "Add Unit"
   - Enter unit title
3. Add lessons to units:
   - Expand unit
   - Click "Add Lesson"
   - Enter lesson title
4. Manage challenges:
   - Click "Manage Challenges" on lesson
   - Attach existing or create new challenges

### Duplicating a Course

1. From courses list, click duplicate icon
2. Confirm duplication
3. System creates deep copy:
   - New course (with " (Copy)" suffix)
   - All units
   - All lessons
   - All challenges
   - All options

### Assigning Users

1. Open course details
2. Click "Assign Users"
3. Enter user IDs (comma or newline separated)
4. Save assignments

## Important Notes

### Security
- **No authentication required** - This is a private admin tool
- Do not expose to public internet
- Use firewall/VPN for access control

### Performance
- Pagination implemented for large lists
- Lazy loading for course builder
- Indexed database queries

### Limitations
- Drag & drop reordering UI not yet implemented (use order fields)
- Challenge preview mode coming soon
- Bulk operations limited

## Troubleshooting

### Database Connection Issues
- Verify DATABASE_URL is correct
- Check SSL settings
- Ensure Neon database is accessible

### Missing Data
- Check cascade delete settings
- Verify foreign key constraints
- Review transaction logs

### Validation Errors
- Check Zod schema requirements
- Verify data types
- Review required fields

## Future Enhancements

- [ ] Drag & drop reordering UI
- [ ] Challenge preview mode
- [ ] Bulk import/export
- [ ] Analytics dashboard
- [ ] Course templates
- [ ] Version control for courses
- [ ] Collaboration features
- [ ] Advanced search and filters

## Support

For issues or questions:
1. Check console logs for errors
2. Review database query logs
3. Verify environment variables
4. Check API response errors

## License

Private internal tool - not for distribution.
