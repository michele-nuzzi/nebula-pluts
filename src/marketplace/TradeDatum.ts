import { pstruct, PAddress, int, PMaybe } from "@harmoniclabs/plu-ts";
import { BidOption } from "./types";

export const TradeDatum = pstruct({
    Listing: {
        owner: PAddress.type,
        priceLovelaces: int,
        privateListing: PMaybe( PAddress.type ).type
    },
    Bid: {
        owner: PAddress.type,
        option: BidOption.type
    }
})