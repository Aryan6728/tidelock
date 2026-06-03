/// Tidelock — an on-chain access registry for trustless file shares.
module contracts::share;

use std::string::String;

/// Raised if someone other than the owner tries to revoke.
const ENotOwner: u64 = 0;

/// One file-share record, stored on-chain as its own object.
public struct Share has key, store {
    id: UID,
    blob_id: String,
    owner: address,
    expiry_ms: u64,
    revoked: bool,
}

/// Create a share and give the resulting object to its creator.
public fun create_share(blob_id: String, expiry_ms: u64, ctx: &mut TxContext) {
    let sender = ctx.sender();
    let share = Share {
        id: object::new(ctx),
        blob_id,
        owner: sender,
        expiry_ms,
        revoked: false,
    };
    transfer::public_transfer(share, sender);
}

/// Permanently mark a share as revoked. Only the owner can do this.
public fun revoke(share: &mut Share, ctx: &TxContext) {
    assert!(share.owner == ctx.sender(), ENotOwner);
    share.revoked = true;
}