import type { Article } from '../types';

const today = new Date();
const yesterday = new Date();
yesterday.setDate(today.getDate() - 1);

const todayISO = today.toISOString();
const yesterdayISO = yesterday.toISOString();

export const MOCK_ARTICLES: { [key: string]: Article[] } = {
  ar: [
    {
      id: 'mock-ar-1',
      headline: 'إطلاق قمر صناعي جديد لرصد تغير المناخ بدقة غير مسبوقة',
      byline: 'وكالة الفضاء الدولية',
      date: todayISO,
      dayLabel: 'اليوم',
      body: 'أعلنت وكالة الفضاء الدولية اليوم عن إطلاق القمر الصناعي "عين الأرض ٣"، الذي يهدف إلى مراقبة التغيرات المناخية وتأثيراتها على كوكبنا.\nالجهاز الجديد مزود بأجهزة استشعار متطورة قادرة على قياس مستويات ثاني أكسيد الكربون ودرجات حرارة المحيطات بدقة لم يسبق لها مثيل، مما سيوفر للعلماء بيانات حيوية لفهم أزمة المناخ بشكل أفضل.',
      imageUrl: 'https://picsum.photos/seed/space-ar/1280/720',
      // FIX: Added missing imagePrompt property.
      imagePrompt: 'صورة واقعية لقمر صناعي يدور حول الأرض، مع ظهور القارات بوضوح',
      category: 'Technology',
      viralityDescription: 'سريع الانتشار',
      comments: [{ author: 'نورة', text: 'خبر رائع! نأمل أن يساعد هذا في إيجاد حلول.' }],
      sources: [{ title: 'موقع وكالة الفضاء', uri: '#' }],
    },
    {
      id: 'mock-ar-2',
      headline: 'اكتشافات أثرية مذهلة تغير فهمنا للتاريخ القديم',
      byline: 'قسم الآثار الوطني',
      date: todayISO,
      dayLabel: 'اليوم',
      body: 'كشف فريق من علماء الآثار عن مدينة قديمة كانت مدفونة تحت الرمال لآلاف السنين. تحتوي المدينة على مبانٍ سليمة وأدوات فنية متقنة، مما يشير إلى وجود حضارة متقدمة لم تكن معروفة من قبل.\nهذا الاكتشاف قد يعيد كتابة فصول كاملة من تاريخ المنطقة، ويقدم رؤى جديدة حول كيفية عيش المجتمعات القديمة وتفاعلها.',
      imageUrl: 'https://picsum.photos/seed/ruins-ar/1280/720',
      // FIX: Added missing imagePrompt property.
      imagePrompt: 'صورة لعلماء آثار يكشفون عن جدارية قديمة في موقع حفر أثري تحت ضوء الشمس',
      category: 'World',
      viralityDescription: 'متوسط الانتشار',
      comments: [{ author: 'أحمد', text: 'مذهل! لا أستطيع الانتظار لمعرفة المزيد.' }],
      sources: [{ title: 'المجلة الأثرية', uri: '#' }],
    },
    {
      id: 'mock-ar-3',
      headline: 'فريق كرة السلة المحلي يفوز بالبطولة في اللحظات الأخيرة',
      byline: 'القسم الرياضي',
      date: yesterdayISO,
      dayLabel: 'الأمس',
      body: 'في مباراة مثيرة حبست الأنفاس، تمكن فريق "صقور المدينة" من تحقيق فوز دراماتيكي على منافسه التقليدي بنتيجة ٩٨-٩٧. جاء الفوز بفضل رمية ثلاثية في الثانية الأخيرة من عمر المباراة، مما أدى إلى تتويج الفريق بلقب البطولة للمرة الأولى منذ عشر سنوات.',
      imageUrl: 'https://picsum.photos/seed/basketball-ar/1280/720',
      // FIX: Added missing imagePrompt property.
      imagePrompt: 'لقطة حركة للاعب كرة سلة يسدد رمية حاسمة في اللحظات الأخيرة من المباراة',
      category: 'Sports',
      viralityDescription: 'قليل الانتشار',
      comments: [{ author: 'خالد', text: 'أفضل مباراة رأيتها في حياتي! أبطال!' }],
      sources: [],
    }
  ],
  en: [
    {
      id: 'mock-en-1',
      headline: 'New Satellite Launched to Monitor Climate Change with Unprecedented Accuracy',
      byline: 'International Space Agency',
      date: todayISO,
      dayLabel: 'Today',
      body: 'The International Space Agency announced today the launch of the "Earth Eye 3" satellite, aimed at monitoring climate change and its effects on our planet.\nThe new device is equipped with advanced sensors capable of measuring carbon dioxide levels and ocean temperatures with unparalleled precision, which will provide scientists with vital data to better understand the climate crisis.',
      imageUrl: 'https://picsum.photos/seed/space-en/1280/720',
      // FIX: Added missing imagePrompt property.
      imagePrompt: 'A realistic photo of a satellite orbiting Earth, with the continents clearly visible',
      category: 'Technology',
      viralityDescription: 'Fast Spreading',
      comments: [{ author: 'John', text: 'Great news! Hope this helps find solutions.' }],
      sources: [{ title: 'Space Agency Website', uri: '#' }],
    },
    {
      id: 'mock-en-2',
      headline: 'Stunning Archaeological Find Changes Understanding of Ancient History',
      byline: 'National Antiquities Dept.',
      date: todayISO,
      dayLabel: 'Today',
      body: 'A team of archaeologists has uncovered an ancient city that was buried under sand for thousands of years. The city contains intact buildings and elaborate artifacts, suggesting an advanced civilization previously unknown.\nThis discovery could rewrite entire chapters of the region\'s history, offering new insights into how ancient societies lived and interacted.',
      imageUrl: 'https://picsum.photos/seed/ruins-en/1280/720',
      // FIX: Added missing imagePrompt property.
      imagePrompt: 'A photo of archaeologists uncovering an ancient mural at a dig site in the sunlight',
      category: 'World',
      viralityDescription: 'Medium Spreading',
      comments: [{ author: 'Sarah', text: 'Amazing! Can\'t wait to learn more.' }],
      sources: [{ title: 'Journal of Archaeology', uri: '#' }],
    },
    {
      id: 'mock-en-3',
      headline: 'Local Basketball Team Wins Championship with Last-Second Shot',
      byline: 'Sports Desk',
      date: yesterdayISO,
      dayLabel: 'Yesterday',
      body: 'In a thrilling game that went down to the wire, the "City Falcons" secured a dramatic 98-97 victory over their rivals. The win came from a three-point shot in the final second of the game, crowning the team as champions for the first time in a decade.',
      imageUrl: 'https://picsum.photos/seed/basketball-en/1280/720',
      // FIX: Added missing imagePrompt property.
      imagePrompt: 'An action shot of a basketball player making a game-winning shot at the buzzer',
      category: 'Sports',
      viralityDescription: 'Low Spreading',
      comments: [{ author: 'Mike', text: 'Best game I\'ve ever seen! Champions!' }],
      sources: [],
    }
  ],
};