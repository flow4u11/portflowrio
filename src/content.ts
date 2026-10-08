import type { Project } from './components/ProjectGallery';
import type { Language } from './components/LocalizedCopy';

export const copy = {
  en: {
    lead: 'A **Games and Interactive Media** student at Bangkok University, exploring the space between **design and play**.',
    design: 'I love **UX/UI design**, in-game graphics, and the way **light and shadow** build atmosphere. Small visual details can change how an entire experience feels.',
    learning: 'Coding isn’t my favorite part, but I keep learning. I want to work in this field, and I believe **designers should understand code** to communicate clearly with developers.',
    leisure: 'Gaming montages first taught me rhythm and visual storytelling. I play **basketball, FPS and story-driven games**. I also love beautiful game worlds and architecture, especially in **Assassin’s Creed**.',
    themeBefore: 'I enjoy experimenting with visual styles. Even a different ', themeAfter: ' can give the same idea a new personality. Try one of mine.',
    country: 'Based in', countryValue: 'Bangkok, Thailand', school: 'High school · Graduated', schoolValue: 'Matthayom Taksin Rayong School (MTRS)', present: 'Present',
    projectIntro: 'Games, useful tools, and what comes next. Scroll through the collection.',
    projectNote: 'A growing collection. Three open layouts are waiting for their next project.',
    contact: 'Have an idea, a project, or a shared love for design? **I’d love to hear about it.**',
    contactDialog: 'A project idea, a design conversation, or just a hello — find me here.',
    footer: 'Every design is **my own, created in Figma**. Built with **AI-assisted coding**.',
    video: 'Watch gameplay', visit: 'Visit website', close: 'Close preview', hello: 'Say hello', copy: 'Copy', copied: 'Discord username copied.', copyHint: 'Copy my Discord username or open my profile.',
    cover: 'Original illustrated cover. Watch the gameplay to see the actual game.', webCover: 'Original illustrated cover. Open the website to explore the actual app.',
  },
  th: {
    lead: 'นักศึกษาสาขา **เกมและสื่ออินเทอร์แอคทีฟ** มหาวิทยาลัยกรุงเทพ สนใจพื้นที่ระหว่าง **การออกแบบและการเล่น**',
    design: 'ผมชอบ **ออกแบบ UX/UI** ภาพกราฟิกในเกม และการใช้ **แสงเงา** สร้างบรรยากาศ รายละเอียดเล็ก ๆ สามารถเปลี่ยนความรู้สึกของทั้งประสบการณ์ได้',
    learning: 'การเขียนโค้ดอาจไม่ใช่ส่วนที่ผมชอบที่สุด แต่ผมยังเรียนรู้ต่อ เพราะอยากทำงานในสายนี้ และเชื่อว่า **ดีไซเนอร์ควรเข้าใจโค้ด** เพื่อคุยกับนักพัฒนาได้รู้เรื่อง',
    leisure: 'การตัดต่อมอนทาจเกมทำให้ผมเริ่มสนใจจังหวะและการเล่าเรื่องด้วยภาพ ผมชอบ **เล่นบาสเกตบอล เกม FPS และเกมเนื้อเรื่อง** รวมถึงโลกในเกมที่มีภาพและสถาปัตยกรรมสวย ๆ โดยเฉพาะ **Assassin’s Creed**',
    themeBefore: 'ผมชอบทดลองรูปแบบการออกแบบ แค่เปลี่ยน ', themeAfter: ' ก็ทำให้ไอเดียเดิมมีบุคลิกใหม่ได้ ลองธีมที่ผมออกแบบดูได้ครับ',
    country: 'ที่อยู่ปัจจุบัน', countryValue: 'กรุงเทพฯ ประเทศไทย', school: 'มัธยมศึกษา · สำเร็จการศึกษา', schoolValue: 'โรงเรียนมัธยมตากสินระยอง (MTRS)', present: 'ปัจจุบัน',
    projectIntro: 'เกม เครื่องมือที่ใช้งานได้จริง และไอเดียใหม่ ๆ เลื่อนดูผลงานในคอลเลกชันได้เลย',
    projectNote: 'คอลเลกชันที่กำลังเติบโต พร้อมอีกสามเลย์เอาต์สำหรับโปรเจกต์ถัดไป',
    contact: 'มีไอเดีย โปรเจกต์ หรือสนใจการออกแบบเหมือนกันไหม? **ผมยินดีพูดคุยด้วยครับ**',
    contactDialog: 'คุยเรื่องโปรเจกต์ งานออกแบบ หรือแค่ทักทาย ติดต่อผมได้จากช่องทางเหล่านี้',
    footer: '**ผมออกแบบทุกดีไซน์ด้วย Figma** และใช้ **AI ช่วยในการเขียนโค้ด**',
    video: 'ชมวิดีโอเกมเพลย์', visit: 'เปิดเว็บไซต์', close: 'ปิดหน้าต่าง', hello: 'ทักทายกัน', copy: 'คัดลอก', copied: 'คัดลอกชื่อ Discord แล้ว', copyHint: 'คัดลอกชื่อ Discord หรือเปิดโปรไฟล์ของผม',
    cover: 'ภาพปกที่ออกแบบขึ้นสำหรับโปรเจกต์ ดูเกมจริงได้จากวิดีโอเกมเพลย์', webCover: 'ภาพปกที่ออกแบบขึ้น เปิดเว็บไซต์เพื่อทดลองใช้แอปจริง',
  },
} as const;

export const toolkitItems = [
  // Design, game engines, video, code editors, then AI assistants.
  'Figma', 'Blender', 'Substance Painter', 'Unreal Engine 5', 'Unity', 'Roblox Studio',
  'Premiere Pro', 'After Effects', 'CapCut', 'DaVinci Resolve', 'VS Code', 'Cursor',
  'Claude', 'Codex', 'ChatGPT', 'Gemini',
];
export const technologyItems = [
  // Frontend, motion, backend, then shipping and testing.
  'React', 'Next.js', 'TypeScript', 'JavaScript', 'HTML', 'CSS', 'Tailwind CSS', 'Vite',
  'Motion', 'GSAP', 'Radix UI', 'Three.js', 'Node.js',
  'Supabase', 'PostgreSQL', 'Supabase Auth', 'Zod', 'ExcelJS', 'Git', 'GitHub',
  'Vercel', 'Vitest', 'Playwright',
];
// Keep whole categories together: design/engines, then video/editors/AI.
export const toolkitRows = [
  toolkitItems.slice(0, 6),
  toolkitItems.slice(6),
];
// Frontend/motion, then backend/shipping; categories remain together.
export const technologyRows = [
  technologyItems.slice(0, 12),
  technologyItems.slice(12),
];

export function getProjects(language: Language): Project[] {
  const thai = language === 'th';
  return [
    {
      id: 'laststand', title: 'LastStand', category: 'Unreal Engine 5 · FPS game', image: '/assets/project-laststand.svg', status: 'FIRST UE5 PROJECT',
      videoUrl: 'https://www.youtube.com/watch?v=DzqB6cp7Z2g', videoId: 'DzqB6cp7Z2g',
      alt: 'Original LastStand illustrated cover with an industrial FPS arena',
      description: thai ? 'เกม FPS โปรเจกต์แรกที่ผมสร้างด้วย Unreal Engine 5 ในเทอม Summer ปี 1 จุดเริ่มต้นของการเรียนรู้การสร้างเกมและโลกอินเทอร์แอคทีฟ' : 'My first Unreal Engine 5 game, made during the summer term of year one. An FPS project and a first step into building an interactive world.',
      tags: ['Unreal Engine 5', 'FPS', 'Year 01 · Summer'],
      details: thai ? [
        { label: 'จุดเริ่มต้น', text: 'LastStand เป็นโปรเจกต์แรกในการเรียนรู้และสร้างเกมด้วย Unreal Engine 5 ทำในเทอม Summer ปี 1' },
        { label: 'ผลงาน', text: 'ดูเกมจริงได้จากวิดีโอเกมเพลย์ที่แนบไว้ โปรเจกต์มีชุดเกมสำหรับ Windows' },
        { label: 'สิ่งที่สนใจ', text: 'การออกแบบภาพภายในเกม แสงเงา และบรรยากาศของโลกที่ผู้เล่นเข้าไปสำรวจได้' },
      ] : [
        { label: 'The first step', text: 'LastStand was my first experience learning and making a game in Unreal Engine 5, during the summer term of year one.' },
        { label: 'The project', text: 'The gameplay video shows the actual game. A packaged Windows build is part of the project.' },
        { label: 'Visual interests', text: 'In-game graphics, light and shadow, and the atmosphere of an interactive world.' },
      ],
    },
    {
      id: 'grades', title: 'School Ledger', category: 'Full stack web app · Student grade system', image: '/assets/project-school-ledger.svg', status: 'LIVE BETA',
      liveUrl: 'https://school-ledger-beta.vercel.app', sourceUrl: 'https://github.com/flow4u11/student-grade-system',
      alt: 'Original School Ledger illustrated dashboard with grade entry and a student overview',
      description: thai ? 'แอปจัดการเกรดสองภาษา รวมชั้นเรียน คะแนน และ GPA ไว้ในพื้นที่เดียว พร้อมพอร์ทัลสำหรับนักเรียน' : 'A bilingual grade management app that brings classes, scores, and GPA into one clear workspace, with a dedicated student portal.',
      tags: ['Next.js', 'TypeScript', 'Supabase', 'Tailwind CSS', 'Vercel'],
      details: thai ? [
        { label: 'สำหรับครู', text: 'จัดการเทอม ชั้นเรียน และวิชา กรอกคะแนน ตั้งเกณฑ์ตัดเกรด คำนวณ GPA และเผยแพร่ผลการเรียน' },
        { label: 'สำหรับนักเรียน', text: 'ดูเกรดที่เผยแพร่ผ่านพอร์ทัลด้วย PIN รองรับภาษาไทยและอังกฤษ รวมถึงธีมส่วนตัว' },
        { label: 'รายละเอียด', text: 'นำเข้าและส่งออก Excel มีประวัติการแก้ไข และเดโมสาธารณะที่ใช้ข้อมูลสมมติ สร้างด้วย Next.js, React, TypeScript, Tailwind CSS, Supabase, Radix UI, GSAP, Zod และ ExcelJS' },
      ] : [
        { label: 'For teachers', text: 'Manage terms, classes, and subjects. Enter scores, configure grading rules, calculate GPA, and publish results.' },
        { label: 'For students', text: 'View published grades through a PIN-based portal. Thai and English interfaces and personal themes keep the experience approachable.' },
        { label: 'The details', text: 'Excel import and export, audit history, and a public demo using fictional data. Built with Next.js, React, TypeScript, Tailwind CSS, Supabase, Radix UI, GSAP, Zod, and ExcelJS.' },
      ],
    },
  ];
}
