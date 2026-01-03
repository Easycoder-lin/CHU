
import { useQuery } from "@tanstack/react-query";
import { getMemberService } from "@/lib/services/factory";

export const useMarket = () => {
    const service = getMemberService();

    const marketOffersQuery = useQuery({
        queryKey: ["market-offers"],
        queryFn: () => service.getMarketOffers(),
        refetchInterval: 10000,
    });

    return {
        offers: marketOffersQuery.data || [],
        isLoading: marketOffersQuery.isLoading,
        isError: marketOffersQuery.isError,
        error: marketOffersQuery.error,
        refetch: marketOffersQuery.refetch
    };
}
