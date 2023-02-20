import { $, component$ } from "@builder.io/qwik";
// Optional, you can just use import instead of import type.
import type {
	CloseEventFunction,
	ErrorEventFunction,
	MessageEventFunction,
	OpenEventFunction,
} from "./use-ws";
import { useWs } from "./use-ws";

export default component$(() => {
	const onOpen$: OpenEventFunction = $((ev, ws) => {
		console.log("WebSocket Opened", ev.timeStamp);
		ws.send("Hello World!");
	});

	const onError$: ErrorEventFunction = $((ev, ws) => {
		console.log("Received error");

		ws.close();
	});

	const onMessage$: MessageEventFunction = $((ev, ws) => {
		console.log("Received Message", ev.data);

		ws.close();
	});

	const onClose$: CloseEventFunction = $((ev, ws, funcs) => {
		console.log("Websocket Closed", ev.timeStamp);
		console.log(ws.readyState);

		// Events can access the additional websocket functions provided in the 3rd argument.
		funcs.reconnect();
	});

	const websocket = useWs("ws://localhost:8080", {
		protocols: ["JSON"],
		onOpen$,
		onError$,
		onMessage$,
		onClose$,
	});

	return (
		<div>
			<button
				onClick$={() => {
					websocket?.send("Hello World!");
				}}
			>
				Send Message
			</button>
			<button
				onClick$={() => {
					websocket?.close();
				}}
			>
				Close Websocket
			</button>
			{/* This will manually reconnect to the url
			and protocols provided in the useWs hook. */}
			<button
				onClick$={() => {
					websocket?.reconnect();
				}}
			>
				Reconnect
			</button>
		</div>
	);
});
