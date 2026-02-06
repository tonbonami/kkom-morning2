'use server';

/**
 * @fileOverview An outfit generation AI agent.
 *
 * - generateOutfit - A function that handles the outfit generation process.
 * - GenerateOutfitInput - The input type for the generateOutfit function.
 * - GenerateOutfitOutput - The return type for the generateOutfit function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateOutfitInputSchema = z.object({
  weatherCondition: z
    .string()
    .describe('The current weather condition (e.g., sunny, rainy, cloudy).'),
  temperature: z.number().describe('The current temperature in Celsius.'),
  airQualityGrade: z
    .number()
    .describe('The air quality grade (1-4, 1 being the best, 4 being the worst).'),
});
export type GenerateOutfitInput = z.infer<typeof GenerateOutfitInputSchema>;

const GenerateOutfitOutputSchema = z.object({
  outfitDescription: z
    .string()
    .describe('A description of the recommended outfit based on the weather and air quality.'),
  imageUri: z.string().optional().describe('An image of a trending outfit.')
});
export type GenerateOutfitOutput = z.infer<typeof GenerateOutfitOutputSchema>;

export async function generateOutfit(input: GenerateOutfitInput): Promise<GenerateOutfitOutput> {
  return generateOutfitFlow(input);
}

const outfitPrompt = ai.definePrompt({
  name: 'outfitPrompt',
  input: {schema: GenerateOutfitInputSchema},
  output: {schema: GenerateOutfitOutputSchema},
  prompt: `You are a personal stylist helping users choose outfits based on the weather and air quality.

  Based on the current weather condition: {{{weatherCondition}}}, temperature: {{{temperature}}}°C, and air quality grade: {{{airQualityGrade}}}, recommend an appropriate outfit.

  Prioritize comfort and safety. If the air quality grade is 3 or 4, recommend including a mask.
`,
});

const outfitImagePrompt = ai.definePrompt({
  name: 'outfitImagePrompt',
  input: {schema: GenerateOutfitOutputSchema},
  output: {schema: GenerateOutfitOutputSchema},
  prompt: `Given this outfit description: {{{outfitDescription}}}, generate an image of a trending outfit with those characteristics`,
});

const generateOutfitFlow = ai.defineFlow(
  {
    name: 'generateOutfitFlow',
    inputSchema: GenerateOutfitInputSchema,
    outputSchema: GenerateOutfitOutputSchema,
  },
  async input => {
    const {output} = await outfitPrompt(input);

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
