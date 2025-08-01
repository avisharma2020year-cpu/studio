import Link from 'next/link';
import { FileText } from 'lucide-react';

const AppLogo = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const textSizeClass = size === 'sm' ? 'text-xl' : size === 'md' ? 'text-2xl' : 'text-3xl';
  const iconSize = size === 'sm' ? 18 : size === 'md' ? 24 : 30;

  return (
    <Link href="/" className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
      <FileText size={iconSize} className="text-accent" />
      <h1 className={`font-headline font-bold ${textSizeClass}`}>AttendEase</h1>
    </Link>
  );
};

export default AppLogo;
