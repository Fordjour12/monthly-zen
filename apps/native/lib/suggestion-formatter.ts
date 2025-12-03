// Define the type locally since we can't import from db package directly
export interface AISuggestion {
	id: string;
	userId: string;
	type: "plan" | "briefing" | "reschedule";
	content: unknown;
	isApplied: boolean;
	isArchived: boolean;
	status: "draft" | "active" | "archived" | "applied";
	metadata?: unknown;
	effectivenessScore?: number;
	createdAt: string;
	updatedAt: string;
}

export interface FormattedSuggestion {
	id: string;
	type: "plan" | "briefing" | "reschedule";
	title: string;
	content: string;
	status: "applied" | "active" | "archived" | "draft";
	isApplied: boolean;
	createdAt: string;
	updatedAt: string;
	metadata?: {
		goals?: string;
		context?: any;
		effectiveness?: number;
		[key: string]: any;
	};
	displayInfo: {
		icon: string;
		color: string;
		typeLabel: string;
		statusBadge: {
			text: string;
			color: string;
		};
		relativeTime: string;
		formattedDate: string;
		contentPreview: string;
	};
}

/**
 * Format AI suggestion data for consistent display
 */
export function formatSuggestion(suggestion: AISuggestion): FormattedSuggestion {
	console.log("🔧 Formatting suggestion:", suggestion);

	const typeInfo = getSuggestionTypeInfo(suggestion.type);
	const statusInfo = getSuggestionStatusInfo(suggestion.status, suggestion.isApplied);
	const contentInfo = extractContent(suggestion.content, suggestion.type);
	const timeInfo = formatTimeInfo(suggestion.createdAt, suggestion.updatedAt);

	const formatted: FormattedSuggestion = {
		id: suggestion.id,
		type: suggestion.type,
		title: contentInfo.title,
		content: contentInfo.content,
		status: suggestion.status,
		isApplied: suggestion.isApplied,
		createdAt: suggestion.createdAt,
		updatedAt: suggestion.updatedAt,
		metadata: suggestion.metadata || {},
		displayInfo: {
			icon: typeInfo.icon,
			color: typeInfo.color,
			typeLabel: typeInfo.label,
			statusBadge: statusInfo,
			relativeTime: timeInfo.relative,
			formattedDate: timeInfo.formatted,
			contentPreview: contentInfo.preview,
		},
	};

	console.log("✅ Formatted suggestion:", formatted);
	return formatted;
}

/**
 * Format multiple suggestions
 */
export function formatSuggestions(suggestions: AISuggestion[]): FormattedSuggestion[] {
	console.log(`🔧 Formatting ${suggestions.length} suggestions`);
	
	const formatted = suggestions.map(formatSuggestion);
	
	console.log(`✅ Formatted ${formatted.length} suggestions`);
	return formatted;
}

/**
 * Get type-specific information
 */
function getSuggestionTypeInfo(type: string) {
	switch (type) {
		case "plan":
			return {
				icon: "📋",
				color: "#3B82F6", // blue-500
				label: "Monthly Plan",
			};
		case "briefing":
			return {
				icon: "📝",
				color: "#10B981", // green-500
				label: "Daily Briefing",
			};
		case "reschedule":
			return {
				icon: "🔄",
				color: "#F59E0B", // amber-500
				label: "Reschedule Suggestion",
			};
		default:
			return {
				icon: "🤖",
				color: "#6B7280", // gray-500
				label: "AI Suggestion",
			};
	}
}

/**
 * Get status badge information
 */
function getSuggestionStatusInfo(
	status: string,
	isApplied: boolean
): { text: string; color: string } {
	if (isApplied) {
		return {
			text: "Applied",
			color: "#D1FAE5", // green-100
		};
	}

	switch (status) {
		case "active":
			return {
				text: "Active",
				color: "#DBEAFE", // blue-100
			};
		case "archived":
			return {
				text: "Archived",
				color: "#F3F4F6", // gray-100
			};
		case "draft":
			return {
				text: "Draft",
				color: "#FEF3C7", // yellow-100
			};
		default:
			return {
				text: status,
				color: "#F3F4F6", // gray-100
			};
	}
}

/**
 * Extract and format content from various structures
 */
function extractContent(content: any, type: string): {
	title: string;
	content: string;
	preview: string;
} {
	console.log("📝 Extracting content:", { type, contentType: typeof content, content });

	let title = "";
	let formattedContent = "";

	if (typeof content === "string") {
		formattedContent = content;
		title = generateTitleFromContent(content, type);
	} else if (typeof content === "object" && content !== null) {
		// Handle different content structures
		if (content.content) {
			formattedContent = content.content;
		} else if (content.message) {
			formattedContent = content.message;
		} else if (content.plan) {
			formattedContent = content.plan;
		} else if (content.suggestion) {
			formattedContent = content.suggestion;
		} else if (content.goals && Array.isArray(content.goals)) {
			// Handle structured plan content with goals array
			const goalTitles = content.goals.map((goal: any) => goal.title || "Untitled Goal");
			title = `Monthly Plan: ${goalTitles.slice(0, 2).join(", ")}${goalTitles.length > 2 ? ` +${goalTitles.length - 2} more` : ""}`;
			
			// Create a readable summary of the plan
			const summary = content.goals.map((goal: any, index: number) => {
				const goalTitle = goal.title || `Goal ${index + 1}`;
				const taskCount = goal.tasks ? goal.tasks.length : 0;
				return `• ${goalTitle} (${taskCount} tasks)`;
			}).join('\n');
			
			formattedContent = `📋 Monthly Plan\n\n${summary}`;
		} else {
			// Fallback to stringified object
			formattedContent = JSON.stringify(content, null, 2);
		}

		// Extract title from metadata or content if not already set
		if (!title) {
			if (content.title) {
				title = content.title;
			} else if (content.goals && Array.isArray(content.goals)) {
				const goalTitles = content.goals.map((goal: any) => goal.title || "Untitled Goal");
				title = `Monthly Plan: ${goalTitles.slice(0, 2).join(", ")}${goalTitles.length > 2 ? ` +${goalTitles.length - 2} more` : ""}`;
			} else {
				title = generateTitleFromContent(formattedContent, type);
			}
		}
	} else {
		formattedContent = String(content);
		title = generateTitleFromContent(formattedContent, type);
	}

	const preview = generatePreview(formattedContent);

	console.log("✅ Extracted content:", { title, contentLength: formattedContent.length, preview });

	return {
		title,
		content: formattedContent,
		preview,
	};
}

/**
 * Generate title from content
 */
function generateTitleFromContent(content: string, type: string): string {
	const lines = content.split('\n').filter(line => line.trim());
	const firstLine = lines[0]?.trim();

	if (!firstLine) {
		return `${type.charAt(0).toUpperCase() + type.slice(1)} Suggestion`;
	}

	// Remove common prefixes and clean up
	let title = firstLine
		.replace(/^#+\s*/, '') // Remove markdown headers
		.replace(/^\*\s*/, '') // Remove bullet points
		.replace(/^\d+\.\s*/, '') // Remove numbered lists
		.substring(0, 60); // Limit length

	if (title.length < firstLine.length) {
		title += "...";
	}

	return title || `${type.charAt(0).toUpperCase() + type.slice(1)} Suggestion`;
}

/**
 * Generate preview text
 */
function generatePreview(content: string): string {
	// If content starts with structured plan summary, extract meaningful preview
	if (content.startsWith('📋 Monthly Plan')) {
		const lines = content.split('\n').filter(line => line.trim() && line.startsWith('•'));
		if (lines.length > 0) {
			const preview = lines.slice(0, 2).join(' ');
			return preview.length > 100 ? preview.substring(0, 97) + "..." : preview;
		}
	}

	const lines = content.split('\n').filter(line => line.trim());
	const firstLine = lines[0]?.trim() || "";

	// Skip emoji-only lines
	if (firstLine.match(/^[\p{Emoji}\s]+$/u)) {
		const secondLine = lines[1]?.trim() || "";
		if (secondLine.length <= 100) {
			return secondLine;
		}
		return secondLine.substring(0, 97) + "...";
	}

	if (firstLine.length <= 100) {
		return firstLine;
	}

	return firstLine.substring(0, 97) + "...";
}

/**
 * Format time information
 */
function formatTimeInfo(createdAt: string, updatedAt: string): {
	relative: string;
	formatted: string;
} {
	const created = new Date(createdAt);
	const updated = new Date(updatedAt);
	const now = new Date();

	// Relative time
	const diffMs = now.getTime() - created.getTime();
	const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
	const diffDays = Math.floor(diffHours / 24);

	let relative: string;
	if (diffHours < 1) {
		relative = "Just now";
	} else if (diffHours < 24) {
		relative = `${diffHours}h ago`;
	} else if (diffDays < 7) {
		relative = `${diffDays}d ago`;
	} else {
		relative = created.toLocaleDateString();
	}

	// Formatted date
	const formatted = created.toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});

	return { relative, formatted };
}

/**
 * Group suggestions by type
 */
export function groupSuggestionsByType(suggestions: FormattedSuggestion[]) {
	console.log("📊 Grouping suggestions by type");

	const grouped = suggestions.reduce(
		(acc, suggestion) => {
			if (!acc[suggestion.type]) {
				acc[suggestion.type] = [];
			}
			acc[suggestion.type].push(suggestion);
			return acc;
		},
		{} as Record<string, FormattedSuggestion[]>
	);

	console.log("📊 Grouped suggestions:", Object.keys(grouped).map(key => ({ type: key, count: grouped[key].length })));

	return grouped;
}

/**
 * Get suggestion statistics
 */
export function getSuggestionStats(suggestions: FormattedSuggestion[]) {
	console.log("📈 Calculating suggestion statistics");

	const stats = {
		total: suggestions.length,
		applied: suggestions.filter(s => s.isApplied).length,
		active: suggestions.filter(s => s.status === "active").length,
		archived: suggestions.filter(s => s.status === "archived").length,
		draft: suggestions.filter(s => s.status === "draft").length,
		byType: {
			plan: suggestions.filter(s => s.type === "plan").length,
			briefing: suggestions.filter(s => s.type === "briefing").length,
			reschedule: suggestions.filter(s => s.type === "reschedule").length,
		},
		recent: suggestions.filter(s => {
			const created = new Date(s.createdAt);
			const weekAgo = new Date();
			weekAgo.setDate(weekAgo.getDate() - 7);
			return created > weekAgo;
		}).length,
	};

	console.log("📈 Calculated stats:", stats);
	return stats;
}

/**
 * Search suggestions
 */
export function searchSuggestions(
	suggestions: FormattedSuggestion[],
	query: string
): FormattedSuggestion[] {
	if (!query.trim()) {
		return suggestions;
	}

	const searchTerm = query.toLowerCase();

	console.log(`🔍 Searching ${suggestions.length} suggestions for: "${query}"`);

	const results = suggestions.filter(suggestion => {
		return (
			suggestion.title.toLowerCase().includes(searchTerm) ||
			suggestion.content.toLowerCase().includes(searchTerm) ||
			suggestion.type.toLowerCase().includes(searchTerm) ||
			(suggestion.metadata?.goals && suggestion.metadata.goals.toLowerCase().includes(searchTerm))
		);
	});

	console.log(`🔍 Found ${results.length} matching suggestions`);
	return results;
}