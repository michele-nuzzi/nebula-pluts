import { PScriptContext, PTxOutRef, Term, bool, data, makeRedeemerValidator, pfn } from "@harmoniclabs/plu-ts";

const _mkOneShotPolicy = ( mustSpendUtxo: Term<typeof PTxOutRef> ) => pfn([
    data,
    PScriptContext.type
],  bool)
(( _, ctx ) => {

    return ctx.tx.inputs.some( _in => _in.utxoRef.eq( mustSpendUtxo ) )
});

export function mkOneShotPolicy( mustSpendUtxo: Term<typeof PTxOutRef> )
{
    return makeRedeemerValidator(
        _mkOneShotPolicy( mustSpendUtxo )
    );
}