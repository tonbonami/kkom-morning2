import type { AirQualityData } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { getAirQualityInfo } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface AirQualityCardProps {
  airQuality: AirQualityData;
}

export default function AirQualityCard({ airQuality }: AirQualityCardProps) {
  const { text, emoji, message } = getAirQualityInfo(airQuality.grade);

  const getColors = () => {
    switch (airQuality.grade) {
      case 1:
        return "bg-green-50 border-green-500 text-green-800 dark:bg-green-900/50 dark:border-green-700 dark:text-green-300";
      case 2:
        return "bg-yellow-50 border-yellow-500 text-yellow-800 dark:bg-yellow-900/50 dark:border-yellow-700 dark:text-yellow-300";
      case 3:
        return "bg-orange-50 border-orange-500 text-orange-800 dark:bg-orange-900/50 dark:border-orange-700 dark:text-orange-300";
      case 4:
        return "bg-red-50 border-red-500 text-red-800 dark:bg-red-900/50 dark:border-red-700 dark:text-red-300";
    }
  }

  return (
    <Card className={cn("border-2 shadow-md", getColors())}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-5xl">{emoji}</span>
            <div>
              <p className="text-2xl font-bold">{text}</p>
              <p className="text-sm opacity-80">{message}</p>
            </div>
          </div>
          <div className="text-right text-xs opacity-90">
            <p>미세먼지: {airQuality.pm10}㎍/㎥</p>
            <p>초미세먼지: {airQuality.pm25}㎍/㎥</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
