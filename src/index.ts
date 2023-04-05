import { existsSync } from "fs";
import { mkdir } from "fs/promises";
import { cli } from "./app/utils/cli";
import { script as mkScript } from "./marketplace/contract";
import { PCurrencySymbol, PTokenName } from "@harmoniclabs/plu-ts";

const script = mkScript({
    royalityTokenName: PTokenName.from("ff".repeat(28)),
    royalityTokenPolicy: PCurrencySymbol.from("ff".repeat(28)),
});

console.log("validator compiled succesfully! 🎉\n");
console.log(
    JSON.stringify(
        script.toJson(),
        undefined,
        2
    )
);

async function main() 
{
    if( !existsSync("./testnet") )
    {
        await mkdir("./testnet");
    }
    cli.utils.writeScript( script, "./testnet/vesting.plutus.json")
}
main();