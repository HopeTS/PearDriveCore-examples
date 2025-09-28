import PearDrive, { EVENT } from "@peardrive/core";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// Helper functions are at the bottom of the file for easier reading :)

/*
 * In this first codebloack, all we are doing is creating a PearDrive instance.
 * If you'd like a breakdown of this process, check the two-peer-network
 * example project located in (~/two-peer-network).
 */

// First we will make the corestore and watch folders for two peers.
const __filename = safeFileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TMP_DIR = path.join(__dirname, "tmp");

// Delete data from previous runs
if (fs.existsSync(TMP_DIR)) {
  fs.rmSync(TMP_DIR, { recursive: true, force: true });
}

// Initialize the PearDrive instance
const PEER1_CORESTORE = path.join(TMP_DIR, "peer1", "corestore");
const PEER1_WATCH = path.join(TMP_DIR, "peer1", "watch");
const peer1 = new PearDrive({
  corestorePath: PEER1_CORESTORE,
  watchPath: PEER1_WATCH,
  logOpts: {
    logToConsole: false,
  },
});
await peer1.ready();
await peer1.joinNetwork();
console.log("Peer 1 is ready");

// Save the network key for later
const ORIGINAL_NETWORK_KEY = peer1.networkKey;

/*
 * Here are the two methods of saving a PearDrive instance.
 */

// First we need to create a save file path for each method.
const SAVE_1_PATH = path.join(TMP_DIR, "peer1", "saved-peardrive-static.json");
const SAVE_2_PATH = path.join(TMP_DIR, "peer1", "saved-peardrive-dynamic.json");

// Method 1: Static save
//
// This method is the most straightforward. You just take the pd.saveData
// attribute and save it to a file. Then, when you want to reload the
// instance, you read the file and pass the data to the PearDrive constructor.
fs.writeFileSync(SAVE_1_PATH, JSON.stringify(peer1.saveData, null, 2));
console.log("Peer 1 saved to:", SAVE_1_PATH);

// Method 2: Dynamic save
//
// The problem with doing it this way is that if you plan on making downloads,
// you will want to store memory of all in progress downloads, so that if the
// instance is closed and reopened, the downloads can resume.
//
// To do this, we will tap into the SAVE_DATA_UPDATE event, which will pass the
// updated save data whenever it changes. We will then write that data to a file
// each time it changes.
//
// Keep in mind that in this use case, there won't be any save data saved
// because this event only runs whenever the save data changes, and we aren't
// doing anything that would change it in this example. But if you were to do
// downloads, the save data would change and be saved to the file.
peer1.on(EVENT.SAVE_DATA_UPDATE, (newSaveData) => {
  fs.writeFileSync(SAVE_2_PATH, JSON.stringify(newSaveData, null, 2));
  console.log("Peer 1 save data updated:", SAVE_2_PATH);
});

/*
 * Now we are going to close out peer1, and then reload it. This process is the
 * same for both methods, since they both create a save file that can be read
 * back in. There also won't be any difference between the two save files in this
 * example, since we aren't doing any downloads that would change the save data.
 */

// Close out peer1
await peer1.close();
console.log("Peer 1 closed.");

// Now let's grab the save data from the first method
const savedData1 = JSON.parse(fs.readFileSync(SAVE_1_PATH));
const reloadedPeer1Static = new PearDrive(savedData1);
await reloadedPeer1Static.ready();
await reloadedPeer1Static.joinNetwork();
console.log("");
console.log("Peer 1 reloaded from static save data is ready.");
console.log("Original network key:", ORIGINAL_NETWORK_KEY);
console.log("Reloaded network key:", reloadedPeer1Static.networkKey);
console.log(
  "^ These two keys match because this is the same peer instance reloaded."
);
console.log("");

// It's that simple! So now we close the peer.
await reloadedPeer1Static.close();
console.log("Peer 1 reloaded from static save data closed.");

////////////////////////////////////////////////////////////////////////////////
// Helper functions
////////////////////////////////////////////////////////////////////////////////

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
