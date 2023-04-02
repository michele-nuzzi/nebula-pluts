import { phoist, pfn, PValue, PCurrencySymbol, PTokenName, int, precursiveList, PValueEntryT, pdelay, pInt, fn, list, pif, PAssetsEntryT, papp, lam } from "@harmoniclabs/plu-ts";


export const pvalueOf = phoist(
    pfn([
        PCurrencySymbol.type,
        PTokenName.type
    ],  lam( PValue.type, int ))
    (( currSym, tokenName ) =>
        
        // search currency symbol
        // 0 if not found
        precursiveList( int, PValueEntryT )
        .$( _self => pdelay( pInt(0) ) )
        .$( 
            pfn([
                fn([ list(PValueEntryT) ], int ),
                PValueEntryT,
                list( PValueEntryT )
            ],  int)

            ((self, head, tail ) =>
                pif( int ).$( head.fst.eq( currSym ) )
                .then(

                    // search token name
                    // 0 if not found
                    precursiveList( int, PAssetsEntryT )
                    .$( _self => pdelay( pInt(0) ) )
                    .$(
                        pfn([
                            fn([ list(PAssetsEntryT) ], int ),
                            PAssetsEntryT,
                            list( PAssetsEntryT )
                        ],  int)

                        ((self, head, tail) =>
                            pif( int ).$( head.fst.eq( tokenName ) )
                            .then( head.snd )
                            .else( papp( self, tail ) as any )
                        )
                    )
                    .$( head.snd )

                )
                .else( papp( self, tail ) as any )
            )
        )
        // .$( value )
    )
);