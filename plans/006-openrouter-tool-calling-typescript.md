# OpenRouter Responses Tool Calling (TypeScript)

## Plan

- Confirm runtime target: Node.js server vs browser (API key handling differs); default to Node.js.
- Define tool schemas using OpenAI function calling format (`type`, `name`, `description`, `parameters`, optional `strict`).
- Build a `fetch` wrapper for `POST https://openrouter.ai/api/v1/responses` with headers and JSON body.
- Implement non-streaming flow:
  - Send initial `input` messages with `tools` and `tool_choice`.
  - Parse `output` items and detect `type: "function_call"`.
  - Execute tool handler(s) and build `function_call_output` items.
  - Send follow-up request including `function_call` and `function_call_output` items to produce final assistant output.
- Optional streaming flow:
  - Set `stream: true`, parse `response.output_item.added` and `response.function_call_arguments.done` events.
  - Trigger tool execution when arguments complete and continue response handling.
- Add error handling:
  - Missing outputs, invalid JSON in arguments, unknown tool name, tool execution failures.
  - Return a structured error tool output when a tool fails.
- Deliver a compact end-to-end TypeScript example:
  - Tool definition (e.g., `calculate`).
  - Tool dispatcher map.
  - Request → tool execution → follow-up response.
