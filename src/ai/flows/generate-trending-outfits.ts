'use server';

/**
 * @fileOverview A trending outfit generation AI agent.
 *
 * - generateTrendingOutfits - A function that handles the outfit generation process.
 * - GenerateTrendingOutfitsInput - The input type for the generateTrendingOutfits function.
 * - GenerateTrendingOutfitsOutput - The return type for the generateTrendingOutfits function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateTrendingOutfitsInputSchema = z.object({
  weatherCondition: z
    .string()
    .describe('The current weather condition (e.g., sunny, rainy, cloudy).'),
  temperature: z.number().describe('The current temperature in Celsius.'),
  airQualityGrade: z
    .number()
    .describe('The air quality grade (1-4, 1 being the best, 4 being the worst).'),
});
export type GenerateTrendingOutfitsInput = z.infer<typeof GenerateTrendingOutfitsInputSchema>;

const GenerateTrendingOutfitsOutputSchema = z.object({
  outfitDescription: z
    .string()
    .describe('A description of the recommended trending outfit based on the weather and air quality.'),
  imageUri: z.string().optional().describe('An image of a trending outfit.')
});
export type GenerateTrendingOutfitsOutput = z.infer<typeof GenerateTrendingOutfitsOutputSchema>;

export async function generateTrendingOutfits(input: GenerateTrendingOutfitsInput): Promise<GenerateTrendingOutfitsOutput> {
  return generateTrendingOutfitsFlow(input);
}

const trendingOutfitPrompt = ai.definePrompt({
  name: 'trendingOutfitPrompt',
  input: {schema: GenerateTrendingOutfitsInputSchema},
  output: {schema: GenerateTrendingOutfitsOutputSchema},
  prompt: `You are a personal stylist helping users choose trending outfits based on the weather and air quality.\n\n  Based on the current weather condition: {{{weatherCondition}}}, temperature: {{{temperature}}}°C, and air quality grade: {{{airQualityGrade}}}, recommend an appropriate and trending outfit.\n\n  Prioritize comfort and safety. If the air quality grade is 3 or 4, recommend including a mask.\n`,
});

const generateTrendingOutfitsFlow = ai.defineFlow(
  {
    name: 'generateTrendingOutfitsFlow',
    inputSchema: GenerateTrendingOutfitsInputSchema,
    outputSchema: GenerateTrendingOutfitsOutputSchema,
  },
  async input => {
    const {output} = await trendingOutfitPrompt(input);

    let imageUri: string | undefined;
    try {
      const image = await ai.generate({
        model: 'googleai/imagen-4.0-fast-generate-001',
        prompt: output!.outfitDescription,
      });
      imageUri = image.media?.url
    } catch (e) {
      console.error('Failed to generate image', e);
      imageUri = undefined
    }

    return {
      outfitDescription: output!.outfitDescription,
      imageUri: imageUri,
    };
  }
);
