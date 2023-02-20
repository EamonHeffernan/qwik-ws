import {
	$,
	noSerialize,
	NoSerialize,
	QRL,
	useBrowserVisibleTask$,
	useSignal,
	useTask$,
} from "@builder.io/qwik";

export type CloseEventFunction = QRL<(ev: CloseEvent, ws: WebSocket) => void>;
export type ErrorEventFunction = QRL<(ev: Event, ws: WebSocket) => void>;
export type MessageEventFunction = QRL<
	(ev: MessageEvent<any>, ws: WebSocket) => void
>;
export type OpenEventFunction = QRL<(ev: Event, ws: WebSocket) => void>;

export type useWsOptions = {
	protocols?: string | string[];
	onClose$?: CloseEventFunction;
	onError$?: ErrorEventFunction;
	onMessage$?: MessageEventFunction;
	onOpen$?: OpenEventFunction;
};

export const useWs = (url: string | URL, options?: useWsOptions) => {
	const ws = useSignal<NoSerialize<WebSocket>>();

	const setEvents = $(() => {
		if (!ws.value) return;
		if (!options) return;

		ws.value.onclose = (ev) => {
			if (!ws.value) return;
			options.onClose$?.(ev, ws.value);
		};
		ws.value.onerror = (ev) => {
			if (!ws.value) return;
			options.onError$?.(ev, ws.value);
		};
		ws.value.onmessage = (ev) => {
			if (!ws.value) return;
			options.onMessage$?.(ev, ws.value);
		};
		ws.value.onopen = (ev) => {
			if (!ws.value) return;
			options.onOpen$?.(ev, ws.value);
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

	return {
		close: $(() => ws.value?.close()),
		send: $((data: string | ArrayBufferLike | Blob | ArrayBufferView) =>
			ws.value?.send(data)
		),
		reconnect: reconnect,
	};
};
