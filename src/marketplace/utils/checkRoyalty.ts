import { pfn, list, V2, data, int, fn, pchooseList, plet, precursive, bool, peqData, pByteString, pif, TermInt } from "@harmoniclabs/plu-ts";
import { RoyalityRecipient } from "../types";
import { adjustMaxFee, adjustMinFee } from "./adjustFee";
import { pvalueOf } from "./pvalueOf";

export const checkRoyalty = pfn([
    list( V2.PTxOut.type ),
    data,
    int
],  fn( [ list( RoyalityRecipient.type ), int ], int ) )
(( txOuts, paymentDatum, lovelacesIn /* owners, lovelacesLeft */ ) =>

    plet(
        lovelacesIn.mult( 10 )
    ).in( lovelacesIn10 => 

    precursive(
        pfn([
            
            fn([
                list( RoyalityRecipient.type ),
                int
            ], int ),

            list( RoyalityRecipient.type ),
            int

        ], int)
        (( self, owners, lovelacesLeft ) => {

            const toPay = owners.head;

            const feeToPay = plet( lovelacesIn10.div( toPay.feePercentage ) );

            const adjustedFee = plet(
                adjustMaxFee
                .$(
                    adjustMinFee
                    .$( feeToPay )
                    .$( toPay.minFee )
                )
                .$( toPay.maxFee )
            )

            // inlined
            const hasPaid = ( (fee: TermInt) => {

                const isAddrToPay = plet( toPay.addr.eqTerm );

                const isCorrectDatum = plet( peqData.$( paymentDatum ) );

                const emptyBs = pByteString("");

                return txOuts.some( out =>
                                    
                    isAddrToPay.$( out.address as any )
                    .and( isCorrectDatum.$( out.datum as any ) )
                    .and(
                        fee.ltEq(
                            pvalueOf.$( emptyBs as any ).$( emptyBs as any ).$( out.value )
                        )
                    )
            
                )
            })

            return pchooseList( RoyalityRecipient.type, int ).$( owners )
            .caseNil( lovelacesLeft )
            .caseCons(
                pif( int ).$( hasPaid( adjustedFee ) )
                .then(
                    self
                    .$( owners.tail )
                    .$( lovelacesLeft.sub( adjustedFee ) )
                )
                .else( -1 )
            )
        })
    ))
)