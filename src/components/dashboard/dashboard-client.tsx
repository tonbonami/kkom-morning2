'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { User, WeatherData, AirQualityData, OutfitGuide } from '@/types';
import { getInitialData } from '@/lib/api';
import SkeletonLoader from './skeleton-loader';
import DashboardHeader from './dashboard-header';
import WeatherCard from './weather-card';
import AirQualityCard from './air-quality-card';
import OutfitGuideCard from './outfit-guide-card';
import OutfitGenerationCard from './outfit-generation-card';

export default function DashboardClient() {
  const [user, setUser] = useState<User | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [airQuality, setAirQuality] = useState<AirQualityData | null>(null);
  const [outfitGuide, setOutfitGuide] = useState<OutfitGuide | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('kkom-user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
    } else {
      router.replace('/login');
    }
  }, [router]);

  useEffect(() => {
    if (user) {
      const loadDashboardData = async () => {
        try {
          setLoading(true);
          const { weather: weatherData, air: airQualityData, outfit } = await getInitialData('home');
          setWeather(weatherData);
          setAirQuality(airQualityData);
          setOutfitGuide(outfit);
        } catch (error) {
          console.error("Failed to load dashboard data:", error);
        } finally {
          setLoading(false);
        }
      };
      loadDashboardData();
    }
  }, [user]);

  if (loading || !user || !weather || !airQuality || !outfitGuide) {
    return <SkeletonLoader />;
  }

  return (
    <div className="space-y-6">
      <DashboardHeader name={user.name ?? user.이름} />
      <WeatherCard weather={weather} />
      <AirQualityCard airQuality={airQuality} />
      <OutfitGuideCard outfitGuide={outfitGuide} airQualityGrade={airQuality.grade} />
      <OutfitGenerationCard weather={weather} airQuality={airQuality} />
    </div>
  );
}
