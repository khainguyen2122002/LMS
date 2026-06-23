import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// ========================================================
// MOCK DATA FOR LOCAL VIRTUAL STUDENT
// ========================================================

const mockCategories = [
  { id: 'cat-1', name: 'Đào tạo chung', slug: 'dao-tao-chung' },
  { id: 'cat-2', name: 'Kỹ năng mềm', slug: 'ky-nang-mem' }
];

const mockCourses = [
  {
    id: 'course-1',
    title: 'Hội nhập Nhân viên mới Inspiring HR',
    slug: 'hoi-nhap-nhan-vien-moi',
    description: 'Chào mừng bạn đến với Inspiring HR! Khóa học này thiết kế nhằm giúp bạn hiểu rõ về lịch sử, sứ mệnh, văn hóa doanh nghiệp và quy chế hoạt động của công ty.',
    short_description: 'Quy trình hội nhập và văn hóa doanh nghiệp cho nhân sự mới.',
    category_id: 'cat-1',
    categories: { name: 'Đào tạo chung' },
    level: 'Cơ bản',
    thumbnail_url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=600&auto=format&fit=crop',
    price: 0,
    status: 'published',
    total_duration: 60,
    created_at: new Date().toISOString()
  },
  {
    id: 'course-2',
    title: 'Kỹ năng Thiết lập Mục tiêu OKRs/KPIs',
    slug: 'thiet-lap-muc-tieu-okr-kpi',
    description: 'Học cách thiết lập, quản lý và đánh giá hiệu suất công việc theo phương pháp OKRs và KPIs hiệu quả, bám sát chiến lược doanh nghiệp.',
    short_description: 'Phương pháp thiết lập mục tiêu và đánh giá hiệu suất cốt lõi.',
    category_id: 'cat-2',
    categories: { name: 'Kỹ năng mềm' },
    level: 'Trung cấp',
    thumbnail_url: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=600&auto=format&fit=crop',
    price: 350000,
    status: 'published',
    total_duration: 90,
    created_at: new Date().toISOString()
  }
];

const mockModules = [
  {
    id: 'mod-1',
    course_id: 'course-1',
    title: 'Chương 1: Lịch sử & Sứ mệnh',
    order_index: 1
  },
  {
    id: 'mod-2',
    course_id: 'course-1',
    title: 'Chương 2: Đánh giá & Bài tập',
    order_index: 2
  }
];

const mockLessons = [
  {
    id: 'lesson-1',
    module_id: 'mod-1',
    title: 'Bài 1: Giới thiệu chung và Sứ mệnh doanh nghiệp',
    description: 'Hãy xem video giới thiệu chi tiết về chặng đường phát triển và sứ mệnh phụng sự khách hàng của Inspiring HR.',
    type: 'video',
    content_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    duration_minutes: 15,
    order_index: 1,
    is_published: true
  },
  {
    id: 'lesson-2',
    module_id: 'mod-1',
    title: 'Bài 2: Tài liệu Văn hóa doanh nghiệp',
    description: 'Đọc kỹ tài liệu PDF dưới đây để nắm vững 5 giá trị cốt lõi của công ty và chuẩn mực giao tiếp nội bộ.',
    type: 'pdf',
    content_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    duration_minutes: 15,
    order_index: 2,
    is_published: true
  },
  {
    id: 'lesson-3',
    module_id: 'mod-2',
    title: 'Bài 3: Kiểm tra kiến thức hội nhập',
    description: 'Làm bài kiểm tra ngắn gồm 2 câu hỏi để đánh giá mức độ hiểu biết của bạn về văn hóa công ty.',
    type: 'quiz',
    duration_minutes: 15,
    order_index: 1,
    is_published: true
  },
  {
    id: 'lesson-4',
    module_id: 'mod-2',
    title: 'Bài 4: Thu hoạch Văn hóa Doanh nghiệp',
    description: 'Nộp bài tự luận khoảng 200 từ nêu cảm nghĩ hoặc liên hệ bản thân với một trong những giá trị cốt lõi của công ty.',
    type: 'assignment',
    duration_minutes: 15,
    order_index: 2,
    is_published: true
  }
];

const mockQuizzes = [
  {
    id: 'quiz-1',
    lesson_id: 'lesson-3',
    question: 'Giá trị cốt lõi hàng đầu tại Inspiring HR là gì?',
    options: ['Chính trực', 'Tốc độ', 'Đột phá', 'Đồng hành cùng phát triển'],
    correct_option_index: 3
  },
  {
    id: 'quiz-2',
    lesson_id: 'lesson-3',
    question: 'Kênh thông tin liên lạc chính thức cho các thông báo công ty là gì?',
    options: ['Email & Slack/Teams', 'Zalo cá nhân', 'Facebook Group', 'Truyền miệng'],
    correct_option_index: 0
  }
];

const mockAssignments = [
  {
    id: 'assign-1',
    lesson_id: 'lesson-4',
    title: 'Thu hoạch Văn hóa Doanh nghiệp',
    description: 'Hãy viết một đoạn văn ngắn chia sẻ giá trị cốt lõi nào của Inspiring HR làm bạn ấn tượng nhất và vì sao.',
    attachment_url: null,
    due_date: new Date(Date.now() + 3600 * 24 * 7 * 1000).toISOString(),
    max_score: 100
  }
];

// Helper to get mock DB state
async function getMockDb() {
  const cookieStore = await cookies()
  const mockDbStr = cookieStore.get('dev_mock_db')?.value
  try {
    return mockDbStr ? JSON.parse(mockDbStr) : {
      enrollments: ['course-1'],
      completed_lessons: ['lesson-1'],
      watch_time: {},
      submissions: {}
    }
  } catch {
    return {
      enrollments: ['course-1'],
      completed_lessons: ['lesson-1'],
      watch_time: {},
      submissions: {}
    }
  }
}

// Helper to save mock DB state
async function saveMockDb(db: any) {
  const cookieStore = await cookies()
  cookieStore.set('dev_mock_db', JSON.stringify(db), { path: '/', maxAge: 3600 * 24 })
}

class MockSupabaseClient {
  auth = {
    getUser: async () => {
      return {
        data: {
          user: {
            id: 'mock-student-id',
            email: 'student@local.test',
            user_metadata: {
              role: 'student',
              full_name: 'Học Viên (Virtual)'
            }
          }
        },
        error: null
      };
    },
    signOut: async () => {
      return { error: null };
    }
  };

  from(tableName: string) {
    return new MockSupabaseQueryBuilder(tableName);
  }
}

class MockSupabaseQueryBuilder {
  private tableName: string;
  private filters: Record<string, any> = {};
  private orderCol: string = '';
  private orderOpts: any = null;
  private limitVal: number = 0;
  private insertedData: any = null;
  private updatedData: any = null;
  private upsertedData: any = null;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  select(fields?: string) {
    return this;
  }

  eq(column: string, value: any) {
    this.filters[column] = value;
    return this;
  }

  neq(column: string, value: any) {
    return this;
  }

  order(column: string, options?: any) {
    this.orderCol = column;
    this.orderOpts = options;
    return this;
  }

  limit(value: number) {
    this.limitVal = value;
    return this;
  }

  insert(data: any) {
    this.insertedData = data;
    return this;
  }

  update(data: any) {
    this.updatedData = data;
    return this;
  }

  upsert(data: any, options?: any) {
    this.upsertedData = data;
    return this;
  }

  // Support direct thenable behavior on query builder
  async then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
    try {
      const res = await this.execute();
      return onfulfilled ? onfulfilled(res) : res;
    } catch (err) {
      if (onrejected) return onrejected(err);
      throw err;
    }
  }

  async single() {
    return this.executeSingle();
  }

  private async executeSingle() {
    const db = await getMockDb();

    if (this.tableName === 'profiles') {
      return {
        data: {
          id: 'mock-student-id',
          email: 'student@local.test',
          full_name: 'Học Viên (Virtual)',
          role: 'student',
          company: 'Inspiring HR Local',
          position: 'Học Viên',
          industry: 'L&D',
          experience_years: 2,
        },
        error: null
      };
    }

    if (this.tableName === 'enrollments') {
      const courseId = this.filters['course_id'];
      const isEnrolled = db.enrollments.includes(courseId);
      if (isEnrolled) {
        return {
          data: {
            id: `enroll-${courseId}`,
            user_id: 'mock-student-id',
            course_id: courseId,
            progress_percentage: this.calculateProgress(db, courseId),
          },
          error: null
        };
      }
      return { data: null, error: { message: 'Not enrolled' } };
    }

    if (this.tableName === 'lesson_progress') {
      const lessonId = this.filters['lesson_id'];
      const isCompleted = db.completed_lessons.includes(lessonId);
      const watchTime = db.watch_time[lessonId] || 0;
      if (isCompleted || watchTime > 0) {
        return {
          data: {
            id: `progress-${lessonId}`,
            is_completed: isCompleted,
            watch_time_seconds: watchTime,
            completed_at: isCompleted ? new Date().toISOString() : null
          },
          error: null
        };
      }
      return { data: null, error: { message: 'No progress' } };
    }

    if (this.tableName === 'lessons') {
      const lessonId = this.filters['id'];
      const lesson = mockLessons.find(l => l.id === lessonId);
      if (lesson) {
        const quizzesForLesson = mockQuizzes.filter(q => q.lesson_id === lessonId);
        const assignmentsForLesson = mockAssignments.filter(a => a.lesson_id === lessonId);
        const parentModule = mockModules.find(m => m.id === lesson.module_id);
        const parentCourse = mockCourses.find(c => c.id === parentModule?.course_id);

        return {
          data: {
            ...lesson,
            quizzes: quizzesForLesson,
            assignments: assignmentsForLesson,
            module: parentModule ? {
              id: parentModule.id,
              title: parentModule.title,
              course: parentCourse ? {
                id: parentCourse.id,
                title: parentCourse.title
              } : null
            } : null
          },
          error: null
        };
      }
      return { data: null, error: { message: 'Lesson not found' } };
    }

    if (this.tableName === 'courses') {
      const idOrSlug = this.filters['id'] || this.filters['slug'];
      const course = mockCourses.find(c => c.id === idOrSlug || c.slug === idOrSlug);
      if (course) {
        return { data: course, error: null };
      }
      return { data: null, error: { message: 'Course not found' } };
    }

    if (this.tableName === 'submissions') {
      if (this.insertedData) {
        const assignmentId = this.insertedData.assignment_id;
        const sub = {
          id: `sub-${Date.now()}`,
          ...this.insertedData
        };
        db.submissions[assignmentId] = sub;
        // Mark the lesson completed when assignment is submitted
        const lesson = mockLessons.find(l => l.type === 'assignment');
        if (lesson && !db.completed_lessons.includes(lesson.id)) {
          db.completed_lessons.push(lesson.id);
        }
        await saveMockDb(db);
        return { data: sub, error: null };
      }

      const assignmentId = this.filters['assignment_id'];
      const sub = db.submissions[assignmentId];
      if (sub) {
        return { data: sub, error: null };
      }
      return { data: null, error: { message: 'No submission found' } };
    }

    return { data: null, error: null };
  }

  private async execute() {
    const db = await getMockDb();

    if (this.insertedData) {
      if (this.tableName === 'submissions') {
        const assignmentId = this.insertedData.assignment_id;
        const sub = {
          id: `sub-${Date.now()}`,
          ...this.insertedData
        };
        db.submissions[assignmentId] = sub;
        // Mark lesson completed
        const lesson = mockLessons.find(l => l.type === 'assignment');
        if (lesson && !db.completed_lessons.includes(lesson.id)) {
          db.completed_lessons.push(lesson.id);
        }
        await saveMockDb(db);
        return { data: [sub], error: null };
      }

      if (this.tableName === 'lesson_progress') {
        const lessonId = this.insertedData.lesson_id;
        const isCompleted = this.insertedData.is_completed || false;
        const watchTime = this.insertedData.watch_time_seconds || 0;
        
        if (isCompleted && !db.completed_lessons.includes(lessonId)) {
          db.completed_lessons.push(lessonId);
        }
        if (watchTime > 0) {
          db.watch_time[lessonId] = watchTime;
        }
        await saveMockDb(db);
        return { data: [{ id: `progress-${lessonId}`, is_completed: isCompleted, watch_time_seconds: watchTime }], error: null };
      }

      if (this.tableName === 'enrollments') {
        const courseId = this.insertedData.course_id;
        if (!db.enrollments.includes(courseId)) {
          db.enrollments.push(courseId);
          await saveMockDb(db);
        }
        return { data: [{ id: `enroll-${courseId}`, course_id: courseId, user_id: 'mock-student-id' }], error: null };
      }

      return { data: [this.insertedData], error: null };
    }

    if (this.updatedData) {
      if (this.tableName === 'lesson_progress') {
        const lessonId = this.filters['lesson_id'] || this.insertedData?.lesson_id;
        const isCompleted = this.updatedData.is_completed;
        const watchTime = this.updatedData.watch_time_seconds;

        let resolvedLessonId = lessonId;
        if (!resolvedLessonId) {
          const progressId = this.filters['id'];
          if (progressId && progressId.startsWith('progress-')) {
            resolvedLessonId = progressId.replace('progress-', '');
          }
        }

        if (resolvedLessonId) {
          if (isCompleted && !db.completed_lessons.includes(resolvedLessonId)) {
            db.completed_lessons.push(resolvedLessonId);
          }
          if (watchTime !== undefined) {
            db.watch_time[resolvedLessonId] = watchTime;
          }
          await saveMockDb(db);
        }
      }
      return { data: [this.updatedData], error: null };
    }

    if (this.tableName === 'courses') {
      return { data: mockCourses, error: null };
    }

    if (this.tableName === 'categories') {
      return { data: mockCategories, error: null };
    }

    if (this.tableName === 'modules') {
      const courseId = this.filters['course_id'];
      const courseModules = mockModules.filter(m => m.course_id === courseId);
      
      const formattedModules = courseModules.map(m => ({
        id: m.id,
        title: m.title,
        lessons: mockLessons.filter(l => l.module_id === m.id).map(l => {
          const isCompleted = db.completed_lessons.includes(l.id);
          return {
            id: l.id,
            title: l.title,
            type: l.type,
            duration_minutes: l.duration_minutes,
            lesson_progress: isCompleted ? [{ is_completed: true }] : []
          };
        })
      }));
      return { data: formattedModules, error: null };
    }

    if (this.tableName === 'lessons') {
      const moduleId = this.filters['module_id'];
      const lessonsInModule = mockLessons.filter(l => l.module_id === moduleId);
      return { data: lessonsInModule, error: null };
    }

    if (this.tableName === 'lesson_quizzes') {
      const lessonId = this.filters['lesson_id'];
      const quizzes = mockQuizzes.filter(q => q.lesson_id === lessonId);
      return { data: quizzes, error: null };
    }

    if (this.tableName === 'notifications') {
      return { data: [], error: null };
    }

    return { data: [], error: null };
  }

  private calculateProgress(db: any, courseId: string) {
    const courseModules = mockModules.filter(m => m.course_id === courseId);
    const lessonIds = mockLessons.filter(l => courseModules.some(m => m.id === l.module_id)).map(l => l.id);
    if (lessonIds.length === 0) return 0;
    const completedCount = lessonIds.filter(id => db.completed_lessons.includes(id)).length;
    return Math.round((completedCount / lessonIds.length) * 100);
  }
}

export async function enrollMockStudent(courseId: string) {
  const db = await getMockDb();
  if (!db.enrollments.includes(courseId)) {
    db.enrollments.push(courseId);
    await saveMockDb(db);
  }
}

export async function createClient() {
  if (process.env.NODE_ENV === 'development') {
    const cookieStore = await cookies()
    const previewRole = cookieStore.get('dev_preview_role')?.value
    if (previewRole === 'student') {
      return new MockSupabaseClient() as any;
    }
  }

  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

