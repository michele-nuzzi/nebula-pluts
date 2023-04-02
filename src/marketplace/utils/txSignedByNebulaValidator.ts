import { pByteString, pfn, bool, plet, PValue } from "@harmoniclabs/plu-ts";
import { pvalueOf } from "./pvalueOf";
import { fromUtf8 as getUtf8Bytes } from "@harmoniclabs/uint8array-utils";

const scriptOwner = pByteString( getUtf8Bytes( "ScriptOwner" ) );

export const txSignedByNebulaValidator = pfn([
    PValue.type,
    PValue.type,
],  bool)
(( mint, spendingValue ) =>

    spendingValue.some( entry =>
        entry.snd.some( assets => {

            const tokenName = plet( assets.fst );

            return tokenName.eq( scriptOwner )
            .and(
                pvalueOf
                .$( entry.fst )
                .$( tokenName as any )
                .$( mint )
                .lt( 0 )
            )
        })
    )

)