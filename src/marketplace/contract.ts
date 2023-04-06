import { pfn, PPubKeyHash, PCurrencySymbol, PTokenName, bool, perror, plet, pmatch, pBool, peqData, punsafeConvertType, PValue, POutputDatum, pBSToData, pConstrToData, UtilityTermOf, TermBool, Term, addUtilityForType, pInt, pByteString, ptraceError, bs, data, list, peqBs, pisEmpty, pnot, psndPair, punBData, punListData, PByteString, pforce, pdelay, PTxInInfo, int, pif, phoist, Script, ScriptType, compile, makeValidator, pList, PScriptContext, PTxOutRef, pstruct, PMaybe, unit, pmakeUnit } from "@harmoniclabs/plu-ts";
import { TradeAction } from "./TradeAction";
import { TradeDatum } from "./TradeDatum";
import { pvalueOf } from "./utils/pvalueOf";
import { txSignedByNebulaValidator } from "./utils/txSignedByNebulaValidator";
import { checkRoyalty } from "./utils/checkRoyalty";
import { DatumMetadata, Metadata, RoyalityInfo, TraitOption } from "./types";
import { fromUtf8 } from "@harmoniclabs/uint8array-utils";

export interface ContractParams {
    protocolKey?: Term<typeof PPubKeyHash>,
    royalityTokenPolicy: Term<typeof PCurrencySymbol> 
    royalityTokenName: Term<typeof PTokenName> 
}

const plovelacesOf = phoist(
    pvalueOf
    .$( PCurrencySymbol.from("") )
    .$( PTokenName.from("") ) 
)


const RoyaltyToken = pstruct({
    RoyaltyToken: {
        policyId: PCurrencySymbol.type,
        assetName: PTokenName.type
    }
});

const lowLevel_contract = pfn([
    PMaybe( PPubKeyHash.type ).type,
    RoyaltyToken.type,

    TradeDatum.type,
    TradeAction.type,
    PScriptContext.type
],  unit)
((  maybeProtocolKey,
    royalityToken,
    tradeDatum, action, ctx ) => {

        const { tx, purpose } = ctx;

        const ownUtxoRef = plet(
            pmatch( purpose )
            .onSpending( ({ utxoRef }) => utxoRef )
            ._( _ => perror( PTxOutRef.type ) )
        );

        const ownInputValue = plet(
            pmatch(
                tx.inputs.find( input => input.utxoRef.eq( ownUtxoRef ) )
            )
            .onJust( ({ val }) => val.resolved.value )
            .onNothing( _ => perror( PValue.type ) as any )
        );

        const ownInputLovelaces = plet(
            plovelacesOf.$( ownInputValue as any )
        );

        const paymentOutDatum = plet(
            POutputDatum.InlineDatum({
                datum: pConstrToData
                    .$( 0 )
                    .$(
                        pList( data )
                        ([ ownUtxoRef as any ])
                    )
            })
        );

        const paidProtocol = plet(
            pmatch( maybeProtocolKey )
            .onJust(({ val: protocolPkh }) =>
                tx.outputs.some( out =>
                    pmatch( out.address.credential )
                    .onPPubKeyCredential(({ pkh }) => pkh.eq( protocolPkh ))
                    ._( _ => pBool( false )) 
                )
            )
            .onNothing( _ => pBool( true ) )
        );

        const royalityTokenPolicy = plet( royalityToken.policyId );
        const royalityTokenName =   plet( royalityToken.assetName );
        
        const delayedRoyalityOracleIn = plet(
            pdelay(
                pmatch(
                    tx.refInputs.find( ({ resolved: refIn }) => 
                        pvalueOf
                        .$( royalityTokenPolicy as any )
                        .$( royalityTokenName   as any )
                        .$( refIn.value )
                        .eq( 1 )
                    )
                )
                .onJust(({ val }) => val)
                .onNothing( _ => perror( PTxInInfo.type ))
            )
        )
        
        const delayedLovelacesInAfterFee = plet(
            pdelay(
                pmatch( pforce( delayedRoyalityOracleIn ).resolved.datum )
                .onInlineDatum( ({ datum: datumData }) => {

                    const { recipients } = addUtilityForType(RoyalityInfo.type)
                    (punsafeConvertType( datumData, RoyalityInfo.type ));

                    return checkRoyalty
                        .$( tx.outputs )
                        .$( paymentOutDatum as any )
                        .$( ownInputLovelaces )
                        .$( recipients )
                        .$( ownInputLovelaces )
                })
                ._( _ => perror( int ) )
            )
        );

        return pif( unit ).$(
        pmatch( action )
        .onSell( _ => pmatch( tradeDatum )
            .onListing( _ => perror( bool ) )
            .onBid( bid => {

                const nonNegativePaidFee = pInt( 0 ).ltEq( pforce( delayedLovelacesInAfterFee ) );

                const paidBuyer = pmatch( bid.option )
                    .onSpecificValue(({ value: requestedValue }) =>
                        tx.outputs.some( out =>
                            
                            bid.owner.eq( out.address )
                            .and( out.datum.eq( paymentOutDatum ) )
                            .and(
                                requestedValue.every( requestedEntry => {

                                    const requestedAssets = plet( requestedEntry.snd )

                                    // exclude ADA
                                    return requestedEntry.fst.eq("").or(

                                        requestedAssets.every( requestedAsset => 

                                            // out.value includes requested asset quantity
                                            pvalueOf
                                            .$( requestedEntry.fst )
                                            .$( requestedAsset.fst )
                                            .$( out.value )
                                            .eq( requestedAsset.snd )
                                            
                                        )

                                    );
                                })
                            )
                        )
                    )
                    .onSpecificPolicyId( ({ policyId, types, traits }) => 
                        tx.outputs.some( out =>

                            bid.owner.eq( out.address )
                            .and( out.datum.eq( paymentOutDatum ) )
                            .and(
                                out.value.some( entry => {

                                    const asseName = plet( entry.snd.head.fst  );

                                    return entry.fst.eq( policyId )
                                    .and(
                                        tx.refInputs.some(({ resolved: metadataInput }) => {

                                            const metadata = plet(

                                                pmatch( metadataInput.datum )
                                                .onInlineDatum( ({ datum }) => punsafeConvertType( datum, DatumMetadata.type ).metadata )
                                                .onNoDatum( _ => perror( Metadata.type ) as any )
                                                .onDatumHash( _ => ptraceError( Metadata.type ).$("dh") ) // datum hash not supported
            
                                            );

                                            const assetName = plet( entry.snd.head.fst );

                                            const hasType =
                                                pisEmpty.$( types ) 
                                                .or(
                                                    plet(
                                                        pmatch(
                                                            metadata.find( entry => entry.fst.eq( fromUtf8("type") )  )
                                                        )
                                                        .onJust( just => punBData.$( just.val.snd ) )
                                                        .onNothing( _ => perror( bs ) )
                                                    ).in( metadataType => 
                                                        types.some( peqBs.$( metadataType ) )
                                                    )
                                                )

                                            const hasTraits =
                                            pisEmpty.$( traits )
                                            .or(

                                                plet(
                                                    pmatch( metadata.find( entry => entry.fst.eq( fromUtf8("traits") )  ) )
                                                    .onJust( just => punListData.$( just.val.snd ) .map( punBData ) )
                                                    .onNothing( _ => perror( list( bs ) ) )
                                                    .someTerm
                                                ).in( someTrait =>
                                                    traits.every( _trait =>
                                                        pmatch(  punsafeConvertType( _trait, TraitOption.type ) )
                                                        .onMustHave(({ trait }) => someTrait.$( trait.eqTerm ) )
                                                        .onMustNotHave(({ trait }) =>
                                                            pnot.$( someTrait.$( trait.eqTerm )) )
                                                    )
                                                )
                                            );

                                            return pvalueOf
                                            .$( policyId )
                                            .$(
                                                PTokenName.from(
                                                    pByteString( new Uint8Array([0,6,67,176]) )
                                                    .concat(
                                                        assetName
                                                        .slice( 4 , assetName.length )
                                                    )
                                                )
                                            )
                                            .$( metadataInput.value )
                                            .eq( 1 )
                                            .and( hasType )
                                            .and( hasTraits )
                                        })
                                    )
                                })
                            )
                        )
                    );

                return nonNegativePaidFee.and( paidBuyer ).and( paidProtocol );
            })
        )
        .onBuy( _ =>
            pmatch( tradeDatum )
            .onBid( _ => perror( bool ) )
            .onListing( listing => {
    
                const privateListingOk =
                    pmatch( listing.privateListing )
                    .onJust( ({ val: owner }) =>
    
                        pmatch( owner.credential )
                        .onPPubKeyCredential( ({ pkh }) => tx.signatories.some( pkh.eqTerm ) )
                        .onPScriptCredential( _ => txSignedByNebulaValidator.$( tx.mint ).$( ownInputValue as any ) )
    
                    )
                    .onNothing( _ => pBool( true ) );

                const remainingLovelaces = plet(
                    pforce( delayedLovelacesInAfterFee )
                );

                const allOutsToOwner = plet(
                    tx.outputs.filter( out =>
                        out.address.eq( listing.owner )
                        .and( out.datum.eq( paymentOutDatum ) )
                    )
                );

                // inlined
                const lovelacesToOwner = pif( int ).$( pisEmpty.$( allOutsToOwner.tail ) )
                .then(
                    plovelacesOf
                    .$( allOutsToOwner.head.value )
                )
                .else( perror( int ) );

                // inlined
                const paidOwnerWDatum = lovelacesToOwner.gtEq( remainingLovelaces )
                
                const finalStatement = paidOwnerWDatum
                .and(  privateListingOk );

                if( paidProtocol instanceof Term )
                {
                    return finalStatement.and( paidProtocol )
                }

                return finalStatement;
            })
        )
        .onCancel( _ => {

            const owner = plet(
                pmatch( tradeDatum )
                .onBid(({ owner }) => owner )
                .onListing(({ owner }) => owner )
            );

            return pmatch( owner.credential )
            .onPPubKeyCredential(({ pkh }) =>
                tx.signatories.some( pkh.eqTerm )
            )
            .onPScriptCredential( _ => txSignedByNebulaValidator.$( tx.mint ).$( ownInputValue as any ) ) 
        })

        // wrapper if
        )
        .then( pmakeUnit() )
        .else( perror( unit ) );
});

export const compiledContract = compile( lowLevel_contract );

export const script = new Script(
    ScriptType.PlutusV2,
    compiledContract
);