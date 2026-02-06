'use client';

import { useState, useTransition } from 'react';
import type { WeatherData, AirQualityData } from '@/types';
import { generateTrendingOutfits, type GenerateTrendingOutfitsOutput as GenerateOutfitOutput } from '@/ai/flows/generate-trending-outfits';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoaderCircle, Wand2 } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '../ui/skeleton';

interface OutfitGenerationCardProps {
  weather: WeatherData;
  airQuality: AirQualityData;
}

export default function OutfitGenerationCard({ weather, airQuality }: OutfitGenerationCardProps) {
  const [isPending, startTransition] = useTransition();
  const [outfit, setOutfit] = useState<GenerateOutfitOutput | null>(null);
  const { toast } = useToast();

  const handleGenerateOutfit = () => {
    startTransition(async () => {
      try {
        const result = await generateTrendingOutfits({
          weatherCondition: weather.condition,
          temperature: weather.temperature,
          airQualityGrade: airQuality.grade,
        });
        setOutfit(result);
      } catch (error) {
        console.error('Outfit generation failed:', error);
        toast({
          variant: "destructive",
          title: "AI 추천 실패",
          description: "의상 추천을 생성하는 데 문제가 발생했습니다.",
        });
      }
    });
  };

  return (
    <Card className="shadow-md dark:shadow-lg dark:shadow-black/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline">
          <Wand2 className="text-primary" />
          <span>AI 트렌드 추천</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="aspect-square w-full rounded-xl mt-4" />
          </div>
        ) : outfit ? (
          <div className="space-y-4">
            {outfit.imageUri && (
                <div className="aspect-square w-full relative overflow-hidden rounded-xl">
                    <Image
                    src={outfit.imageUri}
                    alt="Generated outfit"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
              </div>
            )}
            <p className="text-sm text-gray-700 dark:text-gray-300">{outfit.outfitDescription}</p>
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            오늘 날씨에 맞는 트렌디한 의상을 AI에게 추천받아보세요!
          </p>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleGenerateOutfit} disabled={isPending} className="w-full bg-gray-800 hover:bg-gray-700 text-white dark:bg-gray-200 dark:text-gray-800 dark:hover:bg-white">
          {isPending ? (
            <>
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              <span>추천받는 중...</span>
            </>
          ) : (
             <>
                <Wand2 className="mr-2 h-4 w-4" />
                <span>AI로 추천받기</span>
             </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
