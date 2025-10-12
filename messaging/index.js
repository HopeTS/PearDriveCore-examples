import PearDrive from "@peardrive/core";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// Helper functions are at the bottom of the file for easier reading :)

/*
 * In this first codeblock, all we are doing is creating a two-peer PearDrive
 * network. If you'd like a breakdown of this process, check the
 * two-peer-network example project located in (~/two-peer-network).
 */
const __filename = safeFileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TMP_DIR = path.join(__dirname, "tmp");
const PEER1_CORESTORE = path.join(TMP_DIR, "peer1", "corestore");
const PEER1_WATCH = path.join(TMP_DIR, "peer1", "watch");
const PEER2_CORESTORE = path.join(TMP_DIR, "peer2", "corestore");
const PEER2_WATCH = path.join(TMP_DIR, "peer2", "watch");
if (fs.existsSync(TMP_DIR)) {
  fs.rmSync(TMP_DIR, { recursive: true, force: true });
}
const peer1 = new PearDrive({
  corestorePath: PEER1_CORESTORE,
  watchPath: PEER1_WATCH,
  logOpts: {
    logToConsole: false,
  },
});
await peer1.ready();
const peer2 = new PearDrive({
  corestorePath: PEER2_CORESTORE,
  watchPath: PEER2_WATCH,
  logOpts: {
    logToConsole: false,
  },
});
await peer2.ready();
await peer1.joinNetwork();
await peer2.joinNetwork(peer1.networkKey);
console.log("Network created with peers:");
console.log("Peer 1 Network Key:", peer1.networkKey);
console.log("Peer 2 Network Key:", peer2.networkKey);

/*
 * Here we are creating a custom message type, "text". Then, we are going to
 * "listen" for messages of that type on peer2, and send a message of that type
 * from peer1 to peer2.
 */

const MSG_TYPES = ["CHAT", "TURN"];
peer2.listen(MSG_TYPES[0], (message) => {
  console.log("CHAT MESSAGE:", message);
});
peer2.listen(MSG_TYPES[1], (message) => {
  console.log("TURN MESSAGE:", message);
});

const MESSAGE_TYPE = "text";
peer2.listen(MESSAGE_TYPE, (message) => {
  console.log("Peer 2 received message:", message);
});

// Send a message from peer1 to peer2
const MESSAGE_CONTENT = "Hello from Peer 1!";
await peer1.sendMessage(peer2.publicKey, MESSAGE_TYPE, MESSAGE_CONTENT);
console.log("Peer 1 sent message:", MESSAGE_CONTENT);

/*
 * You can also return a value from the listener function, and the sender will
 * receive it as a response. We will create and listen for a new message type,
 * "question", and send a message of that type from peer1 to peer2, and log the
 * response.
 *
 * NOTE: The message types are arbitrary. You can create and listen for any
 * number of message types you want, and they can be named anything.
 */
const MESSAGE_TYPE_2 = "question";
peer2.listen(MESSAGE_TYPE_2, (message) => {
  console.log("Peer 2 received question:", message);
  return "Pay taxes and die!";
});

const response = await peer1.sendMessage(
  peer2.publicKey,
  MESSAGE_TYPE_2,
  "What is the answer to life, the universe, and everything?"
);
console.log("Peer 1 received this answer to the question:", response);

/**
 * For single-use listeners, you can use `listenOnce`. This will listen for a
 * message and handle it only once, then automatically remove the listener.
 */

// Set up listener
const ONCE_MESSAGE_TYPE = "once";
peer2.listenOnce(ONCE_MESSAGE_TYPE, (message) => {
  console.log("Peer 2 received once message:", message);
  return true;
});

// Send message
const firstOnceResponse = await peer1.sendMessage(
  peer2.publicKey,
  ONCE_MESSAGE_TYPE,
  "This is a once message!"
);
console.log("Peer 1 received response to once message:", firstOnceResponse);

// Send again to show that the listener has been removed
const secondOnceResponse = await peer1.sendMessage(
  peer2.publicKey,
  ONCE_MESSAGE_TYPE,
  "This is a once message, again!"
);
console.log(
  "Peer 1 received response to second once message:",
  secondOnceResponse
);

/**
 * You can also remove listeners and onceListeners
 */

console.log("");
console.log("Removing listeners example:");

// Set up listener
const REMOVE_MESSAGE_TYPE = "remove";
peer2.listen(REMOVE_MESSAGE_TYPE, (message) => {
  console.log("Peer 2 received remove message:", message);
  return "You won't see this response if the listener is removed.";
});

// Send message
const removeResponse1 = await peer1.sendMessage(
  peer2.publicKey,
  REMOVE_MESSAGE_TYPE,
  "This is a remove message!"
);
console.log("Peer 1 received response to remove message:", removeResponse1);

// Remove listener
console.log(`Removing listener for message type: ${REMOVE_MESSAGE_TYPE}`);
peer2.unlisten(REMOVE_MESSAGE_TYPE);

// Send again to show that the listener has been removed
const removeResponse2 = await peer1.sendMessage(
  peer2.publicKey,
  REMOVE_MESSAGE_TYPE,
  "This is a remove message, again!"
);
console.log(
  "Peer 1 received response to second remove message:",
  removeResponse2
);

// If you want to remove onceListeners, you can use `unlistenOnce`
console.log("");
console.log("Removing onceListeners example:");
const REMOVE_ONCE_MESSAGE_TYPE = "removeOnce";
peer2.listenOnce(REMOVE_ONCE_MESSAGE_TYPE, (message) => {
  console.log("Peer 2 received remove once message:", message);
  return "You won't see this response if the onceListener is removed.";
});

// We will remove the onceListener before sending the message
console.log(
  `Removing onceListener for message type: ${REMOVE_ONCE_MESSAGE_TYPE}`
);
peer2.unlistenOnce(REMOVE_ONCE_MESSAGE_TYPE);

// Send message
const removeOnceResponse1 = await peer1.sendMessage(
  peer2.publicKey,
  REMOVE_ONCE_MESSAGE_TYPE,
  "This is a remove once message!"
);
console.log(
  "Peer 1 received response to remove once message:",
  removeOnceResponse1
);

// Close drives at the end of the process
await peer1.close();
await peer2.close();
console.log("Peers closed");

////////////////////////////////////////////////////////////////////////////////
// Helper functions
////////////////////////////////////////////////////////////////////////////////

/** Compat fileURLToPath with Pear Runtime */
export function safeFileURLToPath(url) {
  if (url.startsWith("pear://")) {
    const path = url.replace(/^pear:\/\/[^/]+/, ".");
    return path;
  }
  return fileURLToPath(url);
}
