// utils/courseTransformers.ts

// Transform API response to your component format
export function transformApiToFormData(apiData: any) {
  return {
    title: apiData.course_title,
    shortDescription: apiData.course_short_description,
    description: apiData.course_description,
    level: apiData.course_level,
    thumbnail: apiData.course_image,
    
    modules: apiData.module?.map((m: any) => ({
      id: m.id,
      title: m.module_title,
      description: m.module_description,
      duration: m.module_duration,
      lessons: m.lesson?.map((l: any) => ({
        id: l.id,
        title: l.lesson_title,
        video: l.lesson_video,
      })) || [],
      expanded: false,
    })) || [],
    
    materials: apiData.material?.map((m: any) => ({
      id: m.id,
      title: m.material_title,
      description: m.material_description,
      pages: m.material_pages?.toString(),
      document: m.material_document,
      expanded: false,
    })) || [],
    
    quizzes: apiData.quiz?.map((q: any) => ({
      id: q.id,
      title: q.quiz_title,
      description: q.quiz_description,
      duration: q.quiz_duration?.toString(),
      passingScore: q.quiz_score?.toString(),
      questions: q.questions?.map((question: any) => ({
        id: question.id,
        text: question.question_name,
        options: question.options?.map((opt: string, idx: number) => ({
          id: (idx + 1).toString(),
          text: opt,
          isCorrect: opt === question.correctAnswer,
        })) || [],
      })) || [],
      expanded: false,
    })) || [],
    
    objectives: [
      apiData.objectives?.[0]?.objective_title1 || '',
      apiData.objectives?.[0]?.objective_title2 || '',
      apiData.objectives?.[0]?.objective_title3 || '',
      apiData.objectives?.[0]?.objective_title4 || '',
      apiData.objectives?.[0]?.objective_title5 || '',
    ],
    objectivesId: apiData.objectives?.[0]?.id, // Store the objectives ID
  };
}

// Transform your component format to API format
export function transformFormToApiData(formData: any) {
  return {
    course_title: formData.title,
    course_short_description: formData.shortDescription,
    course_description: formData.description,
    course_level: formData.level,
    course_image: formData.thumbnail,
    
    modules: formData.modules?.map((m: any, idx: number) => ({
      id: m.id,
      module_title: m.title,
      module_description: m.description,
      module_duration: m.duration,
      order: idx,
      lessons: m.lessons?.map((l: any, lIdx: number) => ({
        id: l.id,
        lesson_title: l.title,
        lesson_video: l.video || '',
        duration: 0,
        order: lIdx,
      })) || [],
    })) || [],
    
    materials: formData.materials?.map((m: any) => ({
      id: m.id,
      material_title: m.title,
      material_description: m.description,
      material_pages: parseInt(m.pages) || 0,
      material_document: m.document || '',
    })) || [],
    
    quiz: formData.quizzes?.map((q: any) => ({
      id: q.id,
      quiz_title: q.title,
      quiz_description: q.description,
      quiz_duration: parseInt(q.duration) || 0,
      quiz_score: parseInt(q.passingScore) || 0,
      questions: q.questions?.map((question: any) => ({
        id: question.id,
        question_name: question.text,
        options: question.options?.map((opt: any) => opt.text) || [],
        correctAnswer: question.options?.find((opt: any) => opt.isCorrect)?.text || '',
      })) || [],
    })) || [],
    
    objectives: [{
      id: formData.objectivesId,
      objective_title1: formData.objectives[0] || '',
      objective_title2: formData.objectives[1] || '',
      objective_title3: formData.objectives[2] || '',
      objective_title4: formData.objectives[3] || '',
      objective_title5: formData.objectives[4] || '',
    }],
  };
}