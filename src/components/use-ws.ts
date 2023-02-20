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
	ws?: WebSocket;
	reconnect: QRL<() => Promise<void>>;
};

export type CloseEventFunction = QRL<
	(ev: CloseEvent, ws: WebSocket, funcs: Omit<UseWs, "ws">) => void
>;
export type ErrorEventFunction = QRL<
	(ev: Event, ws: WebSocket, funcs: Omit<UseWs, "ws">) => void
>;
export type MessageEventFunction = QRL<
	(ev: MessageEvent<any>, ws: WebSocket, funcs: Omit<UseWs, "ws">) => void
>;
export type OpenEventFunction = QRL<
	(ev: Event, ws: WebSocket, funcs: Omit<UseWs, "ws">) => void
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

	const exportFunctions = useSignal<NoSerialize<UseWs>>();

	const setEvents = $(() => {
		if (!ws.value) return;
		if (!options) return;

		ws.value.onclose = (ev) => {
			if (!ws.value) return;
			options.onClose$?.(ev, ws.value, exportFunctions.value!);
		};
		ws.value.onerror = (ev) => {
			if (!ws.value) return;
			options.onError$?.(ev, ws.value, exportFunctions.value!);
		};
		ws.value.onmessage = (ev) => {
			if (!ws.value) return;
			options.onMessage$?.(ev, ws.value, exportFunctions.value!);
		};
		ws.value.onopen = (ev) => {
			if (!ws.value) return;
			options.onOpen$?.(ev, ws.value, exportFunctions.value!);
		};
	});

	const createWebSocket = $(async () => {
		ws.value = noSerialize(new WebSocket(url, options?.protocols));

		await setEvents();
	});

	const reconnect = $(async () => {
		if (ws.value) ws.value.close();

		await createWebSocket();
	});

	useBrowserVisibleTask$(async (ctx) => {
		ctx.track(() => url);
		ctx.track(() => options?.protocols);
		ctx.track(() => Promise.resolve(options));

		await createWebSocket();

		exportFunctions.value = noSerialize({
			ws: ws.value,
			reconnect,
		});

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

	return exportFunctions.value;
};
