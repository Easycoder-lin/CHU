export const CONTRACT_CONFIG = {
    PACKAGE_ID: "0x7300a3b8d7e3b285a773fd6f8f4715a811ec02d2dabe31efdc8262a80937d7dc",
    VAULT_OBJECT_ID: process.env.NEXT_PUBLIC_VAULT_OBJECT_ID || "",
    MODULES: {
        SPONSOR: "sponsor",
        MEMBER: "member",
        OFFER: "offer",
        VAULT: "vault"
    },
    // Future: Add other network specific configs here
};
