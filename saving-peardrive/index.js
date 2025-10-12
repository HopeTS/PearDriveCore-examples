import PearDrive, { EVENT } from "@peardrive/core";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// Helper functions are at the bottom of the file for easier reading :)

/*
 * In this first codeblock, all we are doing is creating a PearDrive instance.
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
fs.mkdirSync(PEER1_CORESTORE, { recursive: true });
fs.mkdirSync(PEER1_WATCH, { recursive: true });
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
peer1.on(EVENT.SAVE_DATA_UPDATE, (newSaveData) => {
  fs.writeFileSync(SAVE_2_PATH, JSON.stringify(newSaveData, null, 2));
  console.log("Peer 1 save data updated:", SAVE_2_PATH);
});

// Now there is no initial save event that fires when you add the listener, but
// whenever anything happens that changes the save data, the listener will fire.
// For example, if we change a setting, like activating relay mode, the save
// data will update and the listener will fire.
console.log("Activating relay mode on Peer 1...");
peer1.activateRelay();

// Wait a few seconds to ensure the save data has time to update
await new Promise((resolve) => setTimeout(resolve, 2000));

// Save the relavant initial save data for comparison later
const ORIGINAL_PUBLIC_KEY = peer1.publicKey;
const ORIGINAL_NETWORK_KEY = peer1.networkKey;
const ORIGINAL_RELAY = peer1.relay;

/*
 * Now we are going to close out peer1, and then reload it once with the static
 * save method, and once with the dynamic save method. As you will see, live
 * changes made to the peer after initialization (like activating relay) are
 * not saved with the static method, but they are saved with the dynamic method.
 */

// Close out peer1
await peer1.close();
console.log("Peer 1 closed.");

// Now let's grab the save data from the static method first
const staticSaveData = JSON.parse(fs.readFileSync(SAVE_1_PATH));

// To reload a PearDrive instance from save data, you just pass the saved
// data to the PearDrive constructor, and then ready() and joinNetwork() as
// normal. You should always joinNetwork without an argument when reloading,
// since the network key is already stored in the save data.
const staticSavePeer1 = new PearDrive(staticSaveData);
await staticSavePeer1.ready();
await staticSavePeer1.joinNetwork();
console.log("");
console.log("Peer 1 reloaded from static save data is ready.");
console.log("Original public key:", ORIGINAL_PUBLIC_KEY);
console.log("Static save peer1 public key:", staticSavePeer1.publicKey);
console.log("---");
console.log("Original network key:", ORIGINAL_NETWORK_KEY);
console.log("Static save peer1 network key:", staticSavePeer1.networkKey);
console.log(
  "^ (These two sets of keys match because this is the same peer instance \
reloaded.)"
);
// As you can see here though, because we used the static save method, the relay
// mode is not activated, even though we activated it before closing the peer.
// This is because by default, relay is deactivated.
console.log("---");
console.log("Original relay mode:", ORIGINAL_RELAY);
console.log("Static save peer1 relay mode:", staticSavePeer1.relay);

// It's that simple! So now we close the peer.
await staticSavePeer1.close();
console.log("Static save peer1 closed.");

// Now let's grab the save data from the dynamic method
const dynamicSaveData = JSON.parse(fs.readFileSync(SAVE_2_PATH));

// Now we reload the PearDrive instance from the dynamic save data
const dynamicSavePeer1 = new PearDrive(dynamicSaveData);
await dynamicSavePeer1.ready();
await dynamicSavePeer1.joinNetwork();
console.log("");
console.log("Peer 1 reloaded from dynamic save data is ready.");
console.log("Original public key:", ORIGINAL_PUBLIC_KEY);
console.log("Dynamic save peer1 public key:", dynamicSavePeer1.publicKey);
console.log("---");
console.log("Original network key:", ORIGINAL_NETWORK_KEY);
console.log("Dynamic save peer1 network key:", dynamicSavePeer1.networkKey);

// Close peers
await dynamicSavePeer1.close();
console.log("Dynamic save peer1 closed.");

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
