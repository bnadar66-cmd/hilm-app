// بيانات وهمية لتصميم مسارات "الخدمات السريعة" — لسا غير مربوطة بقاعدة البيانات.

export const SUBJECTS = [
  { id: 'anatomy', name: 'Anatomy', icon: 'body-outline' },
  { id: 'physiology', name: 'Physiology', icon: 'pulse-outline' },
  { id: 'biochemistry', name: 'Biochemistry', icon: 'flask-outline' },
];

export const LECTURES_BY_SUBJECT = {
  anatomy: [
    { id: 'a1', title: 'مقدمة في التشريح العام', duration: 22, completed: true },
    { id: 'a2', title: 'الجهاز الهيكلي', duration: 28, completed: true },
    { id: 'a3', title: 'الجهاز العضلي', duration: 25, completed: false },
    { id: 'a4', title: 'الجهاز العصبي المركزي', duration: 31, completed: false },
  ],
  physiology: [
    { id: 'p1', title: 'أساسيات وظائف الأعضاء', duration: 20, completed: true },
    { id: 'p2', title: 'فسيولوجيا الجهاز الدوري', duration: 27, completed: false },
    { id: 'p3', title: 'فسيولوجيا الجهاز التنفسي', duration: 24, completed: false },
  ],
  biochemistry: [
    { id: 'b1', title: 'الكربوهيدرات والأيض', duration: 19, completed: false },
    { id: 'b2', title: 'البروتينات والإنزيمات', duration: 26, completed: false },
  ],
};

export const FILES_BY_SUBJECT = {
  anatomy: [
    { id: 'af1', title: 'ملخص الجهاز الهيكلي', type: 'PDF', size: '2.4 MB' },
    { id: 'af2', title: 'شرائح المحاضرة الأولى', type: 'Slides', size: '5.1 MB' },
    { id: 'af3', title: 'أطلس صور تشريحية', type: 'إضافي', size: '8.7 MB' },
  ],
  physiology: [
    { id: 'pf1', title: 'ملخص الجهاز الدوري', type: 'PDF', size: '1.9 MB' },
    { id: 'pf2', title: 'شرائح فسيولوجيا التنفس', type: 'Slides', size: '4.3 MB' },
  ],
  biochemistry: [
    { id: 'bf1', title: 'جدول الإنزيمات', type: 'PDF', size: '900 KB' },
  ],
};

export const FLASHCARDS_BY_SUBJECT = {
  anatomy: [
    { id: 'ac1', front: 'كم عدد عظام الجسم البشري؟', back: '206 عظمة' },
    { id: 'ac2', front: 'وش وظيفة العمود الفقري؟', back: 'حماية النخاع الشوكي ودعم الجسم' },
    { id: 'ac3', front: 'أكبر عظمة بجسم الإنسان؟', back: 'عظمة الفخذ (Femur)' },
  ],
  physiology: [
    { id: 'pc1', front: 'المعدل الطبيعي لضربات القلب بالراحة؟', back: '60–100 نبضة/دقيقة' },
    { id: 'pc2', front: 'وش وظيفة الهيموغلوبين؟', back: 'نقل الأكسجين بالدم' },
  ],
  biochemistry: [
    { id: 'bc1', front: 'وش وحدة بناء البروتين؟', back: 'الأحماض الأمينية' },
  ],
};

export const QUIZ_BY_SUBJECT = {
  anatomy: [
    {
      id: 'aq1',
      question: 'كم عدد فقرات العمود الفقري؟',
      options: ['26', '33', '24', '30'],
      correctIndex: 1,
      explanation: 'العمود الفقري يتكون من 33 فقرة موزعة على 5 مناطق.',
    },
    {
      id: 'aq2',
      question: 'أي عظمة تعتبر أطول عظمة بجسم الإنسان؟',
      options: ['عظمة العضد', 'عظمة الفخذ', 'عظمة الظنبوب', 'عظمة الترقوة'],
      correctIndex: 1,
      explanation: 'عظمة الفخذ (Femur) هي أطول وأقوى عظمة بجسم الإنسان.',
    },
  ],
  physiology: [
    {
      id: 'pq1',
      question: 'أي جزء من القلب يضخ الدم للجسم كامل؟',
      options: ['الأذين الأيمن', 'البطين الأيسر', 'الأذين الأيسر', 'البطين الأيمن'],
      correctIndex: 1,
      explanation: 'البطين الأيسر يضخ الدم المؤكسج لكل أجزاء الجسم عبر الشريان الأبهر.',
    },
  ],
  biochemistry: [
    {
      id: 'bq1',
      question: 'وش المنتج النهائي لتحلل الجلوكوز (Glycolysis)؟',
      options: ['حمض البيروفيك', 'الجلوكاجون', 'الأنسولين', 'الجلسرين'],
      correctIndex: 0,
      explanation: 'تحلل الجلوكوز ينتج جزيئين من حمض البيروفيك (Pyruvate).',
    },
  ],
};
