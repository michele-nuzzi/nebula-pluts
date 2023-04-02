import { PMaybe, int, pfn, pif, plessEqInt, pmatch } from "@harmoniclabs/plu-ts";

const PMaybeInt = PMaybe( int );

export const adjustMaxFee = pfn([
    int,
    PMaybeInt.type
],  int)
(( fee, maybeMax ) => 
    pmatch( maybeMax )
    .onNothing( _ => fee )
    .onJust( ({ val: maxFee }) => 
        
        pif( int ).$( maxFee.ltEq( fee ) )
        .then( maxFee )
        .else( fee )

    )
);

export const adjustMinFee = pfn([
    int,
    PMaybeInt.type
],  int)
(( fee, maybeMin ) => 
    pmatch( maybeMin )
    .onNothing( _ => fee )
    .onJust( ({ val: minFee }) => 
        
        pif( int ).$( fee.ltEq( minFee ) )
        .then( minFee )
        .else( fee )
        
    )
);