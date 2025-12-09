import { openai } from "../lib/openrouter";
import type{  AIRequest, AIResponse } from "./index.d";



/**
     * Generic AI request handler with retry logic
     */
export async function executeAIRequest<TInput = any, TOutput = any>(
   request: AIRequest<TInput>
): Promise<AIResponse<TOutput>> {
   const { prompt, systemPrompt, config = {} } = request;
   const {
      model = "google/gemini-2.5-flash",
   } = config;

   try {
      // Execute AI request with retry logic
      const completion = await openai.chat.completions.create({
         model,
         messages: [
            ...(systemPrompt ? [{ role: "system" as const, content: systemPrompt }] : []),
            { role: "user" as const, content: prompt },
         ],
         temperature: 0.7,
         response_format: { type: "json_object" },
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
         throw new Error("No content received from AI service");
      }

      // Clean up the content - remove markdown code blocks and extra whitespace
      let cleanContent = content.trim();

      // Remove markdown code block markers if present
      if (cleanContent.startsWith('```')) {
         const lines = cleanContent.split('\n');
         // Remove first line (```json) and last line (```)
         if (lines.length > 2) {
            cleanContent = lines.slice(1, -1).join('\n').trim();
         }
      }

      // Remove any backticks that might be in the content
      cleanContent = cleanContent.replace(/`/g, '');

      // Try to extract JSON from the content if it's embedded in text
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
         cleanContent = jsonMatch[0];
      }

      try {
         const parsed = JSON.parse(cleanContent);
         return {
            success: true,
            data: parsed as TOutput,
         };
      } catch (parseError) {
         console.error('JSON Parse Error:', parseError);
         console.error('Original content:', content);
         console.error('Cleaned content:', cleanContent);

         // Try to fix common JSON issues
         try {
            // Remove trailing commas and fix other common issues
            const fixedContent = cleanContent
               .replace(/,\s*}/g, '}')
               .replace(/,\s*]/g, ']')
               .replace(/"\s*:\s*"/g, '":"');
            const fixedParsed = JSON.parse(fixedContent);
            return {
               success: true,
               data: fixedParsed as TOutput,
            };
         } catch (fixError) {
            throw new Error(`Failed to parse AI response as JSON: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
         }
      }
   } catch (error) {
      console.error('AI Request Error:', error);
      return {
         success: false,
         error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
   }
}
