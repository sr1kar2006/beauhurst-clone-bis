import { Link } from 'react-router-dom';
import { usePageTitle } from '../../lib/title';

export default function NotFoundPage() {
  usePageTitle('Page not found');
  return (
    <div className="max-w-content mx-auto px-5 py-[60px] text-center" data-not-found>
      <h1 className="text-[24px] text-ink font-light">Page not found</h1>
      <p className="text-text mt-2">This page does not exist in the prototype. <Link to="/" className="text-primary underline">Back to Advanced search</Link></p>
    </div>
  );
}
