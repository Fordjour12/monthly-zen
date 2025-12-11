import { openai } from "../../lib/openrouter";
import type { AIRequest, AIResponse } from "../../lib/index.d";

// Re-export types for service index compatibility
export interface AIServiceConfig {
  userId?: string;
  model?: string;
}

// Re-export AIRequest and AIResponse types
export type { AIRequest, AIResponse } from "../../lib/index.d";

/**
 * Generic AI request handler with comprehensive error handling and JSON parsing
 */
export async function executeAIRequest<TInput = any, TOutput = any>(
  request: AIRequest<TInput>
): Promise<AIResponse<TOutput>> {
  const { prompt, systemPrompt, config = {} } = request;
  const {
    model = "google/gemini-2.5-flash",
  } = config;

  try {
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
        return {
          success: false,
          error: `Failed to parse AI response as JSON: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`,
        };
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error during AI request",
    };
  }
}

/**
 * Fetch plan data from database using planId
 */
export async function fetchPlanData(planId: string): Promise<any> {
  try {
    // Import database queries dynamically to avoid circular dependencies
    const { aiQueries } = await import("@my-better-t-app/db");
    const suggestion = await aiQueries.getSuggestionById(planId);

    if (suggestion && suggestion.type === "plan") {
      return suggestion.content;
    }
    return null;
  } catch (error) {
    console.error('Error fetching plan data:', error);
    return null;
  }
}

// Types are imported from lib/index.d.ts for consistency
