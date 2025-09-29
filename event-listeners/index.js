import PearDrive, { EVENT } from "@peardrive/core";
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
if (fs.existsSync(TMP_DIR)) {
  fs.rmSync(TMP_DIR, { recursive: true, force: true });
}
const PEER1_CORESTORE = path.join(TMP_DIR, "peer1", "corestore");
const PEER1_WATCH = path.join(TMP_DIR, "peer1", "watch");
if (!fs.existsSync(PEER1_WATCH)) fs.mkdirSync(PEER1_WATCH, { recursive: true });
const PEER2_CORESTORE = path.join(TMP_DIR, "peer2", "corestore");
const PEER2_WATCH = path.join(TMP_DIR, "peer2", "watch");
if (!fs.existsSync(PEER2_WATCH)) fs.mkdirSync(PEER2_WATCH, { recursive: true });
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
console.log("");

/*
 * Now let's add a listener for peer connection and disconnection events.
 * We will log the peer info when a peer connects or disconnects.
 *
 * Then we will create a third peer to see the events in action.
 */

// Wire up event listeners
peer1.on(EVENT.PEER_CONNECTED, (data) => {
  console.log("[peer1] Peer connected:", data);
});
peer1.on(EVENT.PEER_DISCONNECTED, (data) => {
  console.log("[peer1] Peer disconnected:", data);
});
peer2.on(EVENT.PEER_CONNECTED, (data) => {
  console.log("[peer2] Peer connected:", data);
});
peer2.on(EVENT.PEER_DISCONNECTED, (data) => {
  console.log("[peer2] Peer disconnected:", data);
});

// Create a third peer to join the network
const PEER3_CORESTORE = path.join(TMP_DIR, "peer3", "corestore");
const PEER3_WATCH = path.join(TMP_DIR, "peer3", "watch");
if (!fs.existsSync(PEER3_WATCH)) fs.mkdirSync(PEER3_WATCH, { recursive: true });
const peer3 = new PearDrive({
  corestorePath: PEER3_CORESTORE,
  watchPath: PEER3_WATCH,
  logOpts: {
    logToConsole: false,
  },
});
await peer3.ready();
await peer3.joinNetwork(peer1.networkKey);
console.log("Peer 3 joined network:", peer3.networkKey);
console.log("");

// Wait for changes to propagate
await new Promise((resolve) => setTimeout(resolve, 2000));

// Now let's disconnect the third peer from the network
await peer3.close();
console.log("Peer 3 closed");

// Now we wait a few seconds to let the disconnection propagate, and the
// disconnected events should be logged.
await new Promise((resolve) => setTimeout(resolve, 2000));
console.log("");

/*
 * Now let's look at the file system and see how you can react to dynamic
 * changes to the network file system using event listeners.
 */

// First we will listen for new local files on peer1
peer1.on(EVENT.LOCAL_FILE_ADDED, (data) => {
  console.log("[peer1] Local file added:", data);
});

// Now we will listen for new network files on peer2
peer2.on(EVENT.PEER_FILE_ADDED, (data) => {
  console.log("[peer2] Network file added:", data);
});

// Now we will add a file to peer1's watchPath, which should trigger the
// LOCAL_FILE_ADDED event on peer1, and the PEER_FILE_ADDED event on peer2.
const FILE_1_NAME = "example.txt";
const FILE_1_CONTENTS =
  "This is an example file created in peer1's watch folder.";
createFile({
  basePath: PEER1_WATCH,
  name: FILE_1_NAME,
  contents: FILE_1_CONTENTS,
});
console.log(`Created file "${FILE_1_NAME}" in peer1's watch folder`);
console.log("");

// Wait for changes to propagate
await new Promise((resolve) => setTimeout(resolve, 1000));
console.log("");

// File added events are separate from file change events. Let's edit the
// contents of the file we just created after adding listeners for file changes
peer1.on(EVENT.LOCAL_FILE_CHANGED, (data) => {
  console.log("[peer1] Local file changed:", data);
});
peer2.on(EVENT.PEER_FILE_CHANGED, (data) => {
  console.log("[peer2] Network file changed:", data);
});

// Now we will change the contents of the file we just created, which should
// trigger the LOCAL_FILE_CHANGED event on peer1, and the PEER_FILE_CHANGED
// event on peer2.
createFile({
  basePath: PEER1_WATCH,
  name: FILE_1_NAME,
  contents: "The contents of this file have been changed.",
});
console.log(
  `Changed contents of file "${FILE_1_NAME}" in peer1's watch folder`
);
console.log("");

// Wait for changes to propagate
await new Promise((resolve) => setTimeout(resolve, 1000));
console.log("");

// We can also listen for file deletions. Let's add listeners for file deletions
// and then delete the file we just created.
peer1.on(EVENT.LOCAL_FILE_REMOVED, (data) => {
  console.log("[peer1] Local file removed:", data);
});
peer2.on(EVENT.PEER_FILE_REMOVED, (data) => {
  console.log("[peer2] Network file removed:", data);
});

// Now let's delete the file and wait for changes to propagate.
fs.unlinkSync(path.join(PEER1_WATCH, FILE_1_NAME));
console.log(`Deleted file "${FILE_1_NAME}" from peer1's watch folder`);
console.log("");
await new Promise((resolve) => setTimeout(resolve, 1000));
console.log("");

/*
 * We can also view updates for file transfer events, including a download
 * starting, completing or failing.
 */

// Let's add listeners for download events on peer2
peer2.on(EVENT.IN_PROGRESS_DOWNLOAD_STARTED, (data) => {
  console.log("[peer2] File download started:", data);
});
peer2.on(EVENT.IN_PROGRESS_DOWNLOAD_COMPLETED, (data) => {
  console.log("[peer2] File download completed:", data);
});
peer2.on(EVENT.IN_PROGRESS_DOWNLOAD_FAILED, (data) => {
  console.log("[peer2] File download failed:", data);
});

// Now let's create a new file in peer1's watchPath, and then have peer2
// download it.
const FILE_2_NAME = "example2.txt";
const FILE_2_CONTENTS =
  "This is another example file created in peer1's watch folder.";
createFile({
  basePath: PEER1_WATCH,
  name: FILE_2_NAME,
  contents: FILE_2_CONTENTS,
});
console.log(`Created file "${FILE_2_NAME}" in peer1's watch folder`);
console.log("");

// Wait for peer1 to notice the new file, then have peer2 download it.
await new Promise((resolve) => setTimeout(resolve, 2000));
console.log("");

// Now have peer2 download the file
await peer2.downloadFileFromPeer(peer1.publicKey, FILE_2_NAME);
console.log(`Peer 2 downloaded file: ${FILE_2_NAME}`);
console.log("");

// Wait for download events to finish logging
await new Promise((resolve) => setTimeout(resolve, 2000));
console.log("");

// Close drives at the end of the process
await peer1.close();
await peer2.close();
console.log("Peers closed");
console.log("");

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

/** Generate a random string */
export function generateString(length = 8) {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters[randomIndex];
  }

  return result;
}

/** Create a file */
export function createFile({ basePath, name, contents, length = 64 }) {
  name = name || `${generateString(length)}.txt`;
  const path = `${basePath}/${name}`;
  contents = contents || generateString(length);

  fs.writeFileSync(path, contents);
  return {
    name,
    path,
    contents,
  };
}
