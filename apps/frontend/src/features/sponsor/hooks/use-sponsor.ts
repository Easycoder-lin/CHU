
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSponsorService } from "@/lib/services/factory";
import { CreateOfferParams } from "@/lib/services/types";
import { useSignAndExecuteTransaction, useCurrentAccount } from "@mysten/dapp-kit";
import { useToast } from "../../../hooks/use-toast";

export const useSponsor = () => {
    const account = useCurrentAccount();
    const service = getSponsorService();
    const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Signer adapter
    const signer = {
        signAndExecuteTransaction: (input: { transaction: any }) => signAndExecuteTransaction(input)
    };

    const isSponsorQuery = useQuery({
        queryKey: ["is-sponsor", account?.address],
        queryFn: () => service.checkIsSponsor(account?.address || ""),
        enabled: !!account?.address,
    });

    const stakeMutation = useMutation({
        mutationFn: async (amount: number) => {
            return await service.stake(amount, signer);
        },
        onSuccess: () => {
            toast({ title: "Sponsor Staked!", description: "You are now a sponsor." });
            queryClient.invalidateQueries({ queryKey: ["is-sponsor"] });
        },
        onError: (err) => {
            toast({ title: "Stake Failed", description: err.message, variant: "destructive" });
        }
    });

    const publishOfferMutation = useMutation({
        mutationFn: async (params: CreateOfferParams) => {
            return await service.publishOffer(params, signer);
        },
        onSuccess: () => {
            toast({ title: "Offer Published!", description: "Your offer is now on the market." });
            queryClient.invalidateQueries({ queryKey: ["my-offers"] });
            queryClient.invalidateQueries({ queryKey: ["market-offers"] });
        },
        onError: (err) => {
            toast({ title: "Publish Failed", description: err.message, variant: "destructive" });
        }
    });


    const submitCredentialsMutation = useMutation({
        mutationFn: async ({ offerId, credentials }: { offerId: string, credentials: { username: string, password: string } }) => {
            return await service.submitCredentials(offerId, credentials, signer);
        },
        onSuccess: () => {
            toast({ title: "Credentials Submitted!", description: "Members can now access the service." });
            queryClient.invalidateQueries({ queryKey: ["my-offers"] });
        },
        onError: (err) => {
            toast({ title: "Submission Failed", description: err.message, variant: "destructive" });
        }
    });

    const withdrawMutation = useMutation({
        mutationFn: async (offerId: string) => {
            return await service.withdraw(offerId, signer);
        },
        onSuccess: () => {
            toast({ title: "Funds Withdrawn!", description: "The offer is now closed." });
            queryClient.invalidateQueries({ queryKey: ["my-offers"] });
        },
        onError: (err) => {
            toast({ title: "Withdraw Failed", description: err.message, variant: "destructive" });
        }
    });

    const myOffersQuery = useQuery({
        queryKey: ["my-offers", account?.address],
        queryFn: () => service.getMyOffers(account?.address || ""),
        enabled: !!account?.address,
    });

    return {
        isSponsor: isSponsorQuery.data,
        isLoadingSponsor: isSponsorQuery.isLoading,
        stake: stakeMutation.mutateAsync,
        isStaking: stakeMutation.isPending,
        publishOffer: publishOfferMutation.mutateAsync,
        isPublishing: publishOfferMutation.isPending,
        submitCredentials: submitCredentialsMutation.mutateAsync,
        isSubmittingCredentials: submitCredentialsMutation.isPending,
        withdraw: withdrawMutation.mutateAsync,
        isWithdrawing: withdrawMutation.isPending,
        myOffers: myOffersQuery.data || [],
        isLoadingMyOffers: myOffersQuery.isLoading
    };
}
