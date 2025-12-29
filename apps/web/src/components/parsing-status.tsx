import { CheckCircle, AlertCircle, Clock, Brain, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { type AIResponseWithMetadata } from "@monthly-zen/response-parser";

interface ParsingStatusProps {
  isLoading: boolean;
  aiResponse: AIResponseWithMetadata | null;
  error?: string;
}

export function ParsingStatus({ isLoading, aiResponse, error }: ParsingStatusProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Parsing AI Response
          </CardTitle>
          <CardDescription>Processing and structuring your personalized plan...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Brain className="h-4 w-4 text-primary" />
              <span className="text-sm">Extracting structured data from AI response</span>
            </div>
            <Progress value={60} className="w-full" />
            <div className="grid grid-cols-3 gap-4 text-xs text-foreground">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                JSON Extraction
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                Pattern Matching
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-300 rounded-full" />
                Validation
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Parsing Failed
          </CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-foreground">
            You can try regenerating the plan or proceed with available data.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!aiResponse) {
    return null;
  }

  const { metadata } = aiResponse;
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80)
      return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
    if (confidence >= 60)
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
    return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
  };

  const getFormatColor = (format: string) => {
    switch (format) {
      case "json":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "text":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
      case "mixed":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
          Parsing Complete
        </CardTitle>
        <CardDescription>
          AI response has been successfully processed and structured
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Confidence Score */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-4 w-4 text-foreground" />
            <span className="text-sm font-medium">Confidence Score</span>
          </div>
          <Badge className={getConfidenceColor(metadata.confidence)}>{metadata.confidence}%</Badge>
        </div>

        {/* Format Detection */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="h-4 w-4 text-foreground" />
            <span className="text-sm font-medium">Detected Format</span>
          </div>
          <Badge className={getFormatColor(metadata.detectedFormat)}>
            {metadata.detectedFormat.toUpperCase()}
          </Badge>
        </div>

        {/* Extraction Notes */}
        {metadata.extractionNotes && (
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-foreground" />
              <span className="text-sm font-medium">Extraction Notes</span>
            </div>
            <p className="text-xs text-foreground">{metadata.extractionNotes}</p>
          </div>
        )}

        {/* Parsing Errors */}
        {metadata.parsingErrors.length > 0 && (
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Parsing Warnings ({metadata.parsingErrors.length})
              </span>
            </div>
            <ul className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1">
              {metadata.parsingErrors.slice(0, 3).map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
              {metadata.parsingErrors.length > 3 && (
                <li>• +{metadata.parsingErrors.length - 3} more warnings</li>
              )}
            </ul>
          </div>
        )}

        {/* Missing Fields */}
        {metadata.missingFields.length > 0 && (
          <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Missing Fields ({metadata.missingFields.length})
              </span>
            </div>
            <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
              {metadata.missingFields.map((field, index) => (
                <li key={index}>• {field}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
