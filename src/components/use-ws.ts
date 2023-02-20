import {
	$,
	noSerialize,
	NoSerialize,
	QRL,
	useBrowserVisibleTask$,
	useSignal,
	useTask$,
} from "@builder.io/qwik";

export type UseWs = {
	close: QRL<() => void>;
	send: QRL<(data: string | ArrayBufferLike | Blob | ArrayBufferView) => void>;
	reconnect: QRL<() => void>;
};

export type CloseEventFunction = QRL<
	(ev: CloseEvent, ws: WebSocket, funcs: UseWs) => void
>;
export type ErrorEventFunction = QRL<
	(ev: Event, ws: WebSocket, funcs: UseWs) => void
>;
export type MessageEventFunction = QRL<
	(ev: MessageEvent<any>, ws: WebSocket, funcs: UseWs) => void
>;
export type OpenEventFunction = QRL<
	(ev: Event, ws: WebSocket, funcs: UseWs) => void
>;

export type UseWsOptions = {
	protocols?: string | string[];
	onClose$?: CloseEventFunction;
	onError$?: ErrorEventFunction;
	onMessage$?: MessageEventFunction;
	onOpen$?: OpenEventFunction;
};

export const useWs = (url: string | URL, options?: UseWsOptions) => {
	const ws = useSignal<NoSerialize<WebSocket>>();

	const reconnect = $(async () => {
		if (ws.value) ws.value.close();

		await createWebSocket();
	});

	const exportFunctions: UseWs = {
		close: $(() => ws.value?.close()),
		send: $((data: string | ArrayBufferLike | Blob | ArrayBufferView) =>
			ws.value?.send(data)
		),
		reconnect: reconnect,
	};

	const setEvents = $(() => {
		if (!ws.value) return;
		if (!options) return;

		ws.value.onclose = (ev) => {
			if (!ws.value) return;
			options.onClose$?.(ev, ws.value, exportFunctions);
		};
		ws.value.onerror = (ev) => {
			if (!ws.value) return;
			options.onError$?.(ev, ws.value, exportFunctions);
		};
		ws.value.onmessage = (ev) => {
			if (!ws.value) return;
			options.onMessage$?.(ev, ws.value, exportFunctions);
		};
		ws.value.onopen = (ev) => {
			if (!ws.value) return;
			options.onOpen$?.(ev, ws.value, exportFunctions);
		};
	});

	const createWebSocket = $(async () => {
		ws.value = noSerialize(new WebSocket(url, options?.protocols));

		await setEvents();
	});

	useBrowserVisibleTask$(async (ctx) => {
		ctx.track(() => url);
		ctx.track(() => options?.protocols);
		ctx.track(() => Promise.resolve(options));

		await createWebSocket();

		return () => ws.value?.close();
	});

	useTask$(async (ctx) => {
		ctx.track(() => options);
		ctx.track(() => options?.onClose$);
		ctx.track(() => options?.onError$);
		ctx.track(() => options?.onMessage$);
		ctx.track(() => options?.onOpen$);

		await setEvents();
	});

	return exportFunctions;
};
