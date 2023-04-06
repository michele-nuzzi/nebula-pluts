import { existsSync } from "fs";
import { mkdir } from "fs/promises";
import { cli } from "./app/utils/cli";
import { script } from "./marketplace/contract";


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
    cli.utils.writeScript( script, "./testnet/nebula.plutus.json")
}
main();