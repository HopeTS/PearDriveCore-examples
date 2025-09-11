import PearDrive from "@peardrive/core";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

/** Compat fileURLToPath with Pear Runtime */
export function safeFileURLToPath(url) {
  if (url.startsWith("pear://")) {
    // Strip the pear:// scheme
    // dev/index.js → ./index.js (relative path)
    const path = url.replace(/^pear:\/\/[^/]+/, ".");
    return path;
  }
  return fileURLToPath(url);
}

/*
 * Initializing a PearDrive instance.
 *
 * You will need a folder to store core data, such as keys and all the
 * under-the-hood stuff PearDrive does, the 'coreStorePath' option.
 *
 * You will also need a folder to serve as the PearDrive network's local file
 * system, the 'watchPath' option.
 */

// First we will make the corestore and watch folders for two peers.
const __filename = safeFileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TMP_DIR = path.join(__dirname, "tmp");

// Delete data from previous runs
if (fs.existsSync(TMP_DIR)) {
  fs.rmSync(TMP_DIR, { recursive: true, force: true });
}

// Now we create the instance
const PEER1_CORESTORE = path.join(TMP_DIR, "peer1", "corestore");
const PEER1_WATCH = path.join(TMP_DIR, "peer1", "watch");
const peer1 = new PearDrive({
  corestorePath: PEER1_CORESTORE,
  watchPath: PEER1_WATCH,
  logOpts: {
    logToConsole: false,
  },
});

// Don't forget to ready the drive. PearDrive inherits ReadyResource
// (https://github.com/holepunchto/ready-resource), so open with ready() and
// close with close().
await peer1.ready();
console.log("Peer 1 is ready");

/*
 *Creating a network
 *
 * In order to connect PearDrive instances, there needs to be a networkKey. We
 * can create a new one with createNetwork(), or join an existing one with
 * joinNetwork(<network key>).
 */
await peer1.joinNetwork();
console.log("Peer 1 joined network:", peer1.networkKey);

// Now we will make a second peer. This is a local peer, but if you share the
// network key via qr code, link, or other out-of-band method, it could be
// anywhere in the world.
const PEER2_CORESTORE = path.join(TMP_DIR, "peer2", "corestore");
const PEER2_WATCH = path.join(TMP_DIR, "peer2", "watch");
const peer2 = new PearDrive({
  corestorePath: PEER2_CORESTORE,
  watchPath: PEER2_WATCH,
  logOpts: {
    logToConsole: false,
  },
});

await peer2.ready();
console.log("Peer 2 is ready");

// Now we can join the same network as peer 1.
await peer2.joinNetwork(peer1.networkKey);
console.log("Peer 2 joined network:", peer2.networkKey);

// Now that we've run through all the steps, we can close the peers.
await peer1.close();
await peer2.close();
console.log("Peers closed");
