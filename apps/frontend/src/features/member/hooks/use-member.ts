
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
        mutationFn: async ({ offerId, amount }: { offerId: string, amount: number }) => {
            return await service.joinOffer(offerId, amount, signer);
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
        mutationFn: async ({ offerId, reason }: { offerId: string, reason: string }) => {
            return await service.raiseDispute(offerId, reason, signer);
        },
        onSuccess: () => {
            toast({ title: "Dispute Raised", description: "The sponsor has been notified." });
            queryClient.invalidateQueries({ queryKey: ["my-subscriptions"] });
        },
        onError: (err) => {
            toast({ title: "Dispute Failed", description: err.message, variant: "destructive" });
        }
    });

    return {
        joinOffer: joinOfferMutation.mutateAsync,
        isJoining: joinOfferMutation.isPending,
        subscriptions: mySubscriptionsQuery.data || [],
        isLoadingSubscriptions: mySubscriptionsQuery.isLoading,
        raiseDispute: raiseDisputeMutation.mutateAsync,
        isRaisingDispute: raiseDisputeMutation.isPending
    };
}
