import type { CSSProperties } from 'react';
import figmaIcon from '../assets/icons/figma.svg';
import unrealengineIcon from '../assets/icons/unrealengine.svg';
import unityIcon from '../assets/icons/unity.svg';
import robloxstudioIcon from '../assets/icons/robloxstudio.svg';
import davinciresolveIcon from '../assets/icons/davinciresolve.svg';
import cursorIcon from '../assets/icons/cursor.svg';
import blenderIcon from '../assets/icons/blender.svg';
import claudeIcon from '../assets/icons/claude.svg';
import googlegeminiIcon from '../assets/icons/googlegemini.svg';
import reactIcon from '../assets/icons/react.svg';
import nextdotjsIcon from '../assets/icons/nextdotjs.svg';
import typescriptIcon from '../assets/icons/typescript.svg';
import javascriptIcon from '../assets/icons/javascript.svg';
import html5Icon from '../assets/icons/html5.svg';
import cssIcon from '../assets/icons/css.svg';
import tailwindcssIcon from '../assets/icons/tailwindcss.svg';
import viteIcon from '../assets/icons/vite.svg';
import gsapIcon from '../assets/icons/gsap.svg';
import radixuiIcon from '../assets/icons/radixui.svg';
import nodedotjsIcon from '../assets/icons/nodedotjs.svg';
import supabaseIcon from '../assets/icons/supabase.svg';
import postgresqlIcon from '../assets/icons/postgresql.svg';
import zodIcon from '../assets/icons/zod.svg';
import gitIcon from '../assets/icons/git.svg';
import githubIcon from '../assets/icons/github.svg';
import vercelIcon from '../assets/icons/vercel.svg';
import vitestIcon from '../assets/icons/vitest.svg';
import gmailIcon from '../assets/icons/gmail.svg';
import discordIcon from '../assets/icons/discord.svg';
import instagramIcon from '../assets/icons/instagram.svg';
import youtubeIcon from '../assets/icons/youtube.svg';
import premiereProIcon from '../assets/icons/premiere-pro.svg';
import afterEffectsIcon from '../assets/icons/after-effects.svg';
import substancePainterIcon from '../assets/icons/substance-painter.svg';
import vsCodeIcon from '../assets/icons/vscode.svg';
import motionIcon from '../assets/icons/motion.svg';
import threeIcon from '../assets/icons/threejs.svg';
import playwrightIcon from '../assets/icons/playwright.svg';
import capCutIcon from '../assets/icons/capcut.ico';
import fastworkIcon from '../assets/icons/fastwork.ico';
import codexIcon from '../assets/icons/codex.png';
import chatGPTIcon from '../assets/icons/chatgpt.png';
import './tool-brand-icon.css';

type BrandAsset = { src: string; monochrome?: boolean };

// Original assets and source/licensing metadata live in src/assets/icons.
const brands: Record<string, BrandAsset> = {
  "figma": { src: figmaIcon, monochrome: true },
  "unreal engine 5": { src: unrealengineIcon, monochrome: true },
  "unity": { src: unityIcon, monochrome: true },
  "roblox studio": { src: robloxstudioIcon, monochrome: true },
  "davinci resolve": { src: davinciresolveIcon, monochrome: true },
  "cursor": { src: cursorIcon, monochrome: true },
  "blender": { src: blenderIcon, monochrome: true },
  "claude": { src: claudeIcon, monochrome: true },
  "gemini": { src: googlegeminiIcon, monochrome: true },
  "react": { src: reactIcon, monochrome: true },
  "next.js": { src: nextdotjsIcon, monochrome: true },
  "typescript": { src: typescriptIcon, monochrome: true },
  "javascript": { src: javascriptIcon, monochrome: true },
  "html": { src: html5Icon, monochrome: true },
  "css": { src: cssIcon, monochrome: true },
  "tailwind css": { src: tailwindcssIcon, monochrome: true },
  "vite": { src: viteIcon, monochrome: true },
  "gsap": { src: gsapIcon, monochrome: true },
  "radix ui": { src: radixuiIcon, monochrome: true },
  "node.js": { src: nodedotjsIcon, monochrome: true },
  "supabase": { src: supabaseIcon, monochrome: true },
  "postgresql": { src: postgresqlIcon, monochrome: true },
  "zod": { src: zodIcon, monochrome: true },
  "git": { src: gitIcon, monochrome: true },
  "github": { src: githubIcon, monochrome: true },
  "vercel": { src: vercelIcon, monochrome: true },
  "vitest": { src: vitestIcon, monochrome: true },
  "gmail": { src: gmailIcon, monochrome: true },
  "discord": { src: discordIcon, monochrome: true },
  "instagram": { src: instagramIcon, monochrome: true },
  "youtube": { src: youtubeIcon, monochrome: true },
  "premiere pro": { src: premiereProIcon },
  "after effects": { src: afterEffectsIcon },
  "substance painter": { src: substancePainterIcon },
  "vs code": { src: vsCodeIcon },
  "motion": { src: motionIcon },
  "three.js": { src: threeIcon, monochrome: true },
  "playwright": { src: playwrightIcon },
  "capcut": { src: capCutIcon },
  "fastwork": { src: fastworkIcon },
  "codex": { src: codexIcon },
  "chatgpt": { src: chatGPTIcon },
};
const aliases: Record<string, string> = {
  'ue5': 'unreal engine 5',
  'unreal engine': 'unreal engine 5',
  'adobe premiere pro': 'premiere pro',
  'adobe after effects': 'after effects',
  'substance 3d painter': 'substance painter',
  'adobe substance 3d painter': 'substance painter',
  'visual studio code': 'vs code',
  'google gemini': 'gemini',
  'html5': 'html',
  'framer motion': 'motion',
  'supabase auth': 'supabase',
};

/** Decorative brand mark; the adjacent tool name supplies its accessible label.
 * ExcelJS has no independent official logo and intentionally remains text-only. */
export function ToolBrandIcon({ name, className = '' }: { name: string; className?: string }) {
  const normalized = name.trim().toLowerCase();
  const key = Object.hasOwn(aliases, normalized) ? aliases[normalized] : normalized;
  const asset = Object.hasOwn(brands, key) ? brands[key] : undefined;
  if (!asset) return null;
  const classes = `tool-brand-icon ${className}`;
  if (asset.monochrome) {
    const style = { '--tool-brand-icon-source': `url("${asset.src}")` } as CSSProperties;
    return <span className={`${classes} tool-brand-icon-mono`} style={style} aria-hidden="true" />;
  }
  return <img className={classes} src={asset.src} width={18} height={18} alt="" aria-hidden="true" draggable={false} />;
}
