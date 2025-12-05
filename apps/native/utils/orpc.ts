import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { QueryCache, QueryClient } from "@tanstack/react-query";
import type { AppRouterClient } from "@my-better-t-app/api/routers/index";
import { authClient } from "@/lib/auth-client";
import { configureReactQueryWithPersistence } from "@/lib/react-query-persister";

export const queryClient = new QueryClient({
	queryCache: new QueryCache({
		onError: (error) => {
			console.log(error);
		},
	}),
	defaultOptions: {
		queries: {
			staleTime: 5 * 60 * 1000, // 5 minutes
			gcTime: 30 * 60 * 1000, // 30 minutes
			retry: 2,
			refetchOnWindowFocus: false,
		},
	},
});

// Configure React Query with persistence
const { persister, restoreQueries } = configureReactQueryWithPersistence(queryClient);

export const link = new RPCLink({
	url: `${process.env.EXPO_PUBLIC_SERVER_URL}/rpc`,
	headers() {
		const headers = new Map<string, string>();
		const cookies = authClient.getCookie();
		if (cookies) {
			headers.set("Cookie", cookies);
		}
		return Object.fromEntries(headers);
	},
});

export const client: AppRouterClient = createORPCClient(link);

export const orpc = createTanstackQueryUtils(client);
