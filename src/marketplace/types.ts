import { pstruct, bs, PValue, PCurrencySymbol, list, PTxOutRef, PAddress, int, PMaybe, palias, map, data } from "@harmoniclabs/plu-ts"

export const TraitOption = pstruct({
    MustHave: { trait: bs },
    MustNotHave: { trait: bs }
})

export const BidOption = pstruct({
    SpecificValue: {
        value: PValue.type
    },
    SpecificPolicyId: {
        policyId: PCurrencySymbol.type,
        types: list( bs ),
        traits: list( TraitOption.type )
    }
})

export const PaymentDatum = pstruct({
    PaymentDatum: { utxoRef: PTxOutRef.type }
})

export const RoyalityRecipient = pstruct({
    RoyalityRecipient: {
        addr: PAddress.type,
        feePercentage: int,
        minFee: PMaybe( int ).type,
        maxFee: PMaybe( int ).type
    }
})

export const RoyalityInfo = pstruct({
    RoyalityInfo: {
        recipients: list( RoyalityRecipient.type ),
        version: int
    }
})

export const Metadata = palias( map( bs, data ) );

export const DatumMetadata = pstruct({
    DatumMetadata: {
        metadata: Metadata.type,
        version: int
    }
})