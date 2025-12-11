import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { localKV,STORAGE_TTL } from '@/lib/local-kv';
import { orpc } from '@/utils/orpc';

// Custom hook for generating plans with progress
export function useGeneratePlan() {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: async ({
         userGoals,
         preferences,
         onProgress,
         options,
      }: {
         userGoals: string;
         preferences?: {
            workHours?: {
               start?: string;
               end?: string;
               workdays?: string[];
            };
            energyPatterns?: {
               highEnergyTimes?: string[];
               lowEnergyTimes?: string[];
               weekendPreference?: "work" | "rest" | "mixed";
            };
            taskComplexity?: "simple" | "balanced" | "ambitious";
            priorityFocus?: string[];
         };
         onProgress?: (stage: string, message: string) => void;
         options?: {
            userId?: string;
            model?: string;
         };
      }) => {
         const { userId = 'anonymous', model } = options || {};

         // Simulate progress
         const stages = [
            { type: 'validation', message: 'Validating your goals...', duration: 3000 },
            { type: 'context', message: 'Analyzing your current commitments...', duration: 3000 },
            { type: 'generating', message: 'Creating your personalized plan...', duration: 6000 },
            { type: 'finalizing', message: 'Optimizing your monthly plan...', duration: 6000 }
         ];

         // Execute progress simulation
         for (const stage of stages) {
            onProgress?.(stage.type, stage.message);
            await new Promise(resolve => setTimeout(resolve, stage.duration));
         }

         try {
            // Always call server API - NO CACHING
            const result = await orpc.AI.generatePlan.call({
               userGoals,
               preferences,
               model,
            });

            // Invalidate related queries
            queryClient.invalidateQueries({ queryKey: ['ai-suggestions'] });

            return {
               success: true,
               suggestionId: result.suggestionId,
               content: result.content,
               insights: result.insights,
               message: result.message,
               cached: false,
            };
         } catch (error) {
            console.error('❌ Failed to generate plan:', error);

            return {
               success: false,
               error: error instanceof Error ? error.message : 'Unknown error',
            };
         }
      },
   });
}
