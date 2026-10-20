// lib/themeScript.ts — runs in <head> before the page paints, so the saved theme
// (or the system setting, if the user never picked one) is applied with no flash.
export const THEME_STORAGE_KEY = 'theme';

export const themeInitScript = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}var r=document.documentElement;r.classList.toggle('dark',t==='dark');r.style.colorScheme=t}catch(e){}})()`;
