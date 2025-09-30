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
 * There are two ways you can retrieve information about the network from a
 * peer:
 *  1. Listen for events
 *  2. Query the network state
 *
 * In this example, we will do both.
 */

// Show basic peer information from both peers. Peer1 will show peer2, and vice
// versa.
const peer1Info1 = peer1.listPeers();
const peer2Info1 = peer2.listPeers();
console.log("Peer 1 peers list info:", peer1Info1);
console.log("Peer 2 peers list info:", peer2Info1);
console.log("");

// Show how the peers peerList data correspond to each other's local data.
console.log(
  "Peer1's public key:",
  peer1.publicKey,
  "\nAnd the peer listed on peer2's public key:",
  peer2Info1[0].publicKey
);
console.log("");
console.log(
  "Peer2's public key:",
  peer2.publicKey,
  "\nAnd the peer listed on peer1's public key:",
  peer1Info1[0].publicKey
);
console.log("");

/*
 * Now let's look at data pertaining to the network file system
 */

// Create a file in peer1's watchPath
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

// Now we can view both the local files on peer1, and the network files on
// peer2.
const peer1Files = await peer1.listLocalFiles();
const peer2Files = await peer2.listNetworkFiles();
console.log("Peer 1 local files:", peer1Files);
console.log("Peer 2 network files:", peer2Files);
console.log("");

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
