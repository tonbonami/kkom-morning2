import type { AirQualityData } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { getAirQualityInfo } from '@/lib/utils';

interface AirQualityCardProps {
  airQuality: AirQualityData;
}

export default function AirQualityCard({ airQuality }: AirQualityCardProps) {
  const { text, emoji, message, colors } = getAirQualityInfo(airQuality.grade);

  return (
    <Card className={`border-2 shadow-md ${colors}`}>
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
