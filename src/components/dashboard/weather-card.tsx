import type { WeatherData } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { getWeatherIcon } from '@/lib/utils';
import { Thermometer, Wind, Sunrise, Sunset } from 'lucide-react';


interface WeatherCardProps {
  weather: WeatherData;
}

export default function WeatherCard({ weather }: WeatherCardProps) {
  const weatherIcon = getWeatherIcon(weather.condition);

  return (
    <Card className="shadow-md dark:shadow-lg dark:shadow-black/20">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
            <span className="text-6xl">{weatherIcon}</span>
            <p className="text-2xl font-bold text-gray-800 dark:text-gray-100 mt-2">{weather.condition}</p>
          </div>
          <div className="flex flex-col items-center sm:items-end">
            <p className="text-5xl font-bold text-gray-900 dark:text-white">{weather.temperature}°</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              체감 {weather.feelsLike}°
            </p>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              <span>최고: {weather.high}°</span> / <span>최저: {weather.low}°</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
