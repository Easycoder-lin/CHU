export const CONTRACT_CONFIG = {
    PACKAGE_ID: "0xedc20852fba479e27d10cb05ca415cbb608dcb4fddc1f0749fbfa3e4c93c71b7",
    VAULT_OBJECT_ID: process.env.NEXT_PUBLIC_VAULT_OBJECT_ID || "",
    MODULES: {
        SPONSOR: "sponsor",
        MEMBER: "member",
        OFFER: "offer"
    },
    // Future: Add other network specific configs here
};
