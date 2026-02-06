'use client';

import { useState, useEffect } from 'react';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';

interface DashboardHeaderProps {
  name: string;
}

export default function DashboardHeader({ name }: DashboardHeaderProps) {
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    setCurrentDate(formatDate(new Date()));
  }, []);

  return (
    <header className="flex justify-between items-start">
      <div>
        <h1 className="text-xl md:text-2xl font-headline font-bold text-gray-800 dark:text-gray-100">
          안녕, {name}! 👋
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {currentDate}
        </p>
      </div>
      <Button variant="ghost" size="icon" aria-label="Settings">
        <Settings className="h-5 w-5 text-gray-500 dark:text-gray-400" />
      </Button>
    </header>
  );
}
