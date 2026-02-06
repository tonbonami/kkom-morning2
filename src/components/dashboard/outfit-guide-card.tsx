import type { OutfitGuide } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface OutfitGuideCardProps {
  outfitGuide: OutfitGuide;
  airQualityGrade: number;
}

export default function OutfitGuideCard({ outfitGuide, airQualityGrade }: OutfitGuideCardProps) {
  return (
    <Card className="text-white shadow-md bg-gradient-to-br from-accent/90 to-primary/90 dark:from-accent/70 dark:to-primary/70">
      <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="text-5xl">{outfitGuide.emoji}</span>
          <div>
            <p className="text-lg font-bold text-gray-800 dark:text-white">오늘의 옷차림</p>
            <p className="font-semibold text-gray-700 dark:text-gray-200">{outfitGuide.recommendation}</p>
          </div>
        </div>
        {airQualityGrade >= 3 && (
          <Badge variant="destructive" className="py-2 px-4 mt-4 sm:mt-0">
            😷 마스크 필수!
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
