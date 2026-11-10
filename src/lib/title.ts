import { useEffect } from 'react';
import { TITLE_SUFFIX } from '../config';

export function setTitle(title: string) {
  document.title = `${title} · ${TITLE_SUFFIX}`;
}
/** Set the page <title> (with the prototype suffix) while a page is mounted. */
export function usePageTitle(title: string) {
  useEffect(() => { setTitle(title); return () => setTitle('Advanced search'); }, [title]);
}
