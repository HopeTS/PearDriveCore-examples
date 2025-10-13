# PearDriveCore development basic examples

> Tutorials showcasing the features of PearDrive Core

[![AGPL v3 License](https://img.shields.io/badge/license-AGPL%20v3-blue.svg)](./LICENSE)

> 🏗️ Up to date as of core 2.0.3

PearDriveCore is compatible with node.js and Pear Runtime environments. You can look in the package.json of an example project to see how mapping the node.js and Bare shims, which is necessary for running in Pear Runtime.

## Getting Started

You can run these projects by navigating to their folders, installing dependencies, and running "npm run start:node" for a Node.js environment or running "npm run start:pear" for a Pear Runtime environment.

I recommend having the code on the left and the terminal on the right, so you can follow along the comments and code and see how they correlate to the output. This repo is very hand holdy, you should have a strong grasp on PearDriveCore's features by the end.

## Contents

> If you are just starting to learn how to use PearDriveCore, these examples are listed in the recommended order they should be reviewed.

- **[~/two-peer-network](two-peer-network/index.js)** - Breaks down how to create a network of PearDrive instances

- **[~/messaging](messaging/index.js)** - Breaks down the messaging system, for arbitrary communication between PearDrive instances on the same network.

- **[~/file-transfers](file-transfers/index.js)** - Breaks down how transferring files between peers on the network works.

- **[~/saving-peardrive](saving-peardrive/index.js)** - How to save and reload a PearDrive instance.

- **[~/view-data](view-data/index.js)** - View information about peers and files on the network.

- **[~/event-listeners](event-listeners/index.js)** - Learn how to use event listeners to create a responsive app that will react to dynamic changes on the PearDrive network.
