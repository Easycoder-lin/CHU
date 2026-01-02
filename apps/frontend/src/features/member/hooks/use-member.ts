
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getMemberService } from "@/lib/services/factory";
import { useSignAndExecuteTransaction, useCurrentAccount } from "@mysten/dapp-kit";
import { useToast } from "@/hooks/use-toast";

export const useMember = () => {
    const account = useCurrentAccount();
    const service = getMemberService();
    const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const signer = {
        signAndExecuteTransaction: (input: { transaction: any }) => signAndExecuteTransaction(input)
    };

    const joinOfferMutation = useMutation({
        mutationFn: async ({ offerId, backendOfferId, amount }: { offerId: string, backendOfferId?: string, amount: number }) => {
            return await service.joinOffer(offerId, amount, signer, backendOfferId);
        },
        onSuccess: () => {
            toast({ title: "Joined Offer!", description: "You have successfully subscribed." });
            queryClient.invalidateQueries({ queryKey: ["market-offers"] });
            queryClient.invalidateQueries({ queryKey: ["my-subscriptions"] });
        },
        onError: (err) => {
            toast({ title: "Join Failed", description: err.message, variant: "destructive" });
        }
    });

    const mySubscriptionsQuery = useQuery({
        queryKey: ["my-subscriptions", account?.address],
        queryFn: () => service.getMySubscriptions(account?.address || ""),
        enabled: !!account?.address,
    });

    const raiseDisputeMutation = useMutation({
        mutationFn: async ({ offerId, reason, backendOfferId }: { offerId: string, reason: string, backendOfferId?: string }) => {
            return await service.raiseDispute(offerId, reason, signer, backendOfferId);
        },
        onSuccess: () => {
            toast({ title: "Dispute Raised", description: "The sponsor has been notified." });
            queryClient.invalidateQueries({ queryKey: ["my-subscriptions"] });
        },
        onError: (err) => {
            toast({ title: "Dispute Failed", description: err.message, variant: "destructive" });
        }
    });

    const slashOfferMutation = useMutation({
        mutationFn: async ({ offerId, backendOfferId }: { offerId: string, backendOfferId?: string }) => {
            return await service.slashOffer(offerId, signer, backendOfferId);
        },
        onSuccess: () => {
            toast({ title: "Offer Slashed", description: "On-chain slash submitted." });
            queryClient.invalidateQueries({ queryKey: ["my-subscriptions"] });
        },
        onError: (err) => {
            toast({ title: "Slash Failed", description: err.message, variant: "destructive" });
        }
    });

    const claimSlashMutation = useMutation({
        mutationFn: async ({
            backendOfferId,
            poolObjectId,
            claimObjectId,
        }: { backendOfferId?: string, poolObjectId?: string, claimObjectId?: string }) => {
            if (!account?.address) {
                throw new Error("Wallet address required to claim slash");
            }
            return await service.claimSlash(
                {
                    ownerAddress: account.address,
                    backendOfferId,
                    poolObjectId,
                    claimObjectId,
                },
                signer
            );
        },
        onSuccess: () => {
            toast({ title: "Slash Claimed", description: "Funds claimed from slashed stake." });
            queryClient.invalidateQueries({ queryKey: ["my-subscriptions"] });
        },
        onError: (err) => {
            toast({ title: "Claim Failed", description: err.message, variant: "destructive" });
        }
    });

    return {
        joinOffer: joinOfferMutation.mutateAsync,
        isJoining: joinOfferMutation.isPending,
        subscriptions: mySubscriptionsQuery.data || [],
        isLoadingSubscriptions: mySubscriptionsQuery.isLoading,
        raiseDispute: raiseDisputeMutation.mutateAsync,
        isRaisingDispute: raiseDisputeMutation.isPending,
        slashOffer: slashOfferMutation.mutateAsync,
        isSlashingOffer: slashOfferMutation.isPending,
        claimSlash: claimSlashMutation.mutateAsync,
        isClaimingSlash: claimSlashMutation.isPending
    };
}
