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

/*
 * Here we are going to create a file in peer1's watch directory, and then
 * manually make a call to peer1 from peer2 to download the file.
 *
 * In this example, we are just using the file name since it was created locally
 * and peer2 already has access to the name.
 *
 * If you want to learn the dynamic
 * method of searching for files on the network, check out the 'view-data'
 * example project located in (~/view-data).
 */
const FILE_1_NAME = "example.txt";
const FILE_1_CONTENTS =
  "This is an example file created in peer1's watch folder.";
createFile({
  basePath: PEER1_WATCH,
  name: FILE_1_NAME,
  contents: FILE_1_CONTENTS,
});

// Wait for peer1 to notice the new file, then have peer2 download it.
await new Promise((resolve) => setTimeout(resolve, 2000));

await peer2.downloadFileFromPeer(peer1.publicKey, FILE_1_NAME);
console.log(`Peer 2 downloaded file: ${FILE_1_NAME}`);

const downloadedFilePath = path.join(PEER2_WATCH, FILE_1_NAME);
const downloadedFileContents = fs.readFileSync(downloadedFilePath, "utf-8");
console.log("Downloaded file contents:", downloadedFileContents);

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
