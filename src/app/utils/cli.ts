import { CardanoCliPluts } from "@harmoniclabs/cardanocli-pluts";
import { config } from "dotenv";

config()

export const cli = new CardanoCliPluts({
    network: "testnet 42",
    socketPath: (process.env.PRIVATE_TESTNET_PATH ?? ".") + "/node-spo1/node.sock"
});