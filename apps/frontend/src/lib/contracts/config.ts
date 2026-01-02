export const CONTRACT_CONFIG = {
    PACKAGE_ID: "0x0000000000000000000000000000000000000000000000000000000000000000",
    VAULT_OBJECT_ID: process.env.NEXT_PUBLIC_VAULT_OBJECT_ID || "",
    MODULES: {
        SPONSOR: "sponsor",
        MEMBER: "member",
        OFFER: "offer"
    },
    // Future: Add other network specific configs here
};
