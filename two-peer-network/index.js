import PearDrive from "@peardrive/core";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// Helper functions are at the bottom of the file for easier reading :)

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

/*
 * You need two folder locations for each PearDrive instance: corestorePath and
 * watchPath. Here we create the folder paths and initialize peer1.
 */

// PEER1_CORESTORE is where all the 'core' data is stored. Just set this as an
// empty folder path, and don't touch it! It's where all the under-the-hood
// stuff PearDrive does is stored.
const PEER1_CORESTORE = path.join(TMP_DIR, "peer1", "corestore");
fs.mkdirSync(PEER1_CORESTORE, { recursive: true });

// PEER1_WATCH is the folder that PearDrive is 'watching' for changes, and
// where it will download files to. You can set this to any folder you want,
// but for this example, we are just going to make a new empty folder.
// **Keep in mind, all peers on the network will have access to all files in
// this folder, so don't put anything sensitive in here.**
const PEER1_WATCH = path.join(TMP_DIR, "peer1", "watch");
fs.mkdirSync(PEER1_WATCH, { recursive: true });

// Now we can create the PearDrive instance with those two folder paths.
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
 * Creating a network
 */

// In order to connect PearDrive instances, there needs to be a networkKey. We
// can create a new one with joinNetwork() [without any arguments], or join an
// existing one with joinNetwork(<network key>).
await peer1.joinNetwork();
console.log("Peer 1 joined network:", peer1.networkKey);

// Now we will go through the same process as peer1 to create peer2. This is a
// local peer, but if you share the network key via qr code, link, or other
// out-of-band method, it could be anywhere in the world.
const PEER2_CORESTORE = path.join(TMP_DIR, "peer2", "corestore");
const PEER2_WATCH = path.join(TMP_DIR, "peer2", "watch");
fs.mkdirSync(PEER2_CORESTORE, { recursive: true });
fs.mkdirSync(PEER2_WATCH, { recursive: true });
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

////////////////////////////////////////////////////////////////////////////////
// Helper functions
////////////////////////////////////////////////////////////////////////////////

/**
 * Compat fileURLToPath with Pear Runtime.
 *
 * DISCLAIMER: This workaround isn't generally  recommended, because if you are
 * deploying from pear in pear runtime,  'import.meta.url' won't refer to a file
 * on disk. But for the sake of this  example, it works because we have the
 * code running locally.
 */
export function safeFileURLToPath(url) {
  if (url.startsWith("pear://")) {
    // Strip the pear:// scheme
    // dev/index.js → ./index.js (relative path)
    const path = url.replace(/^pear:\/\/[^/]+/, ".");
    return path;
  }
  return fileURLToPath(url);
}
