import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSolana } from '@/components/solana/use-solana'
import { 
  getCreateFoundListingInstructionAsync,
  FINDARE_PROGRAM_ADDRESS 
} from '../../../../anchor/src/client/js/generated'
import { sendAndConfirmTransactionFactory, getProgramDerivedAddress, getBytesEncoder } from 'gill'

async function getAppConfigAddress() {
  return getProgramDerivedAddress({
    programAddress: FINDARE_PROGRAM_ADDRESS,
    seeds: [getBytesEncoder().encode(new Uint8Array([99, 111, 110, 102, 105, 103]))], // b"config"
  })
}

export function useCreateFoundListingMutation() {
  const { client, account, cluster } = useSolana()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (args: {
      postId: number
      title: string
      description: string
      attributes: string
      photoRef: string
    }) => {
      if (!client || !account) throw new Error('Client or account not available')
      
      const configAddress = await getAppConfigAddress()
      const instruction = await getCreateFoundListingInstructionAsync({
        finder: account,
        config: configAddress,
        ...args,
      })

      const sendAndConfirm = sendAndConfirmTransactionFactory({ client })
      return sendAndConfirm([instruction], { account })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['findare', 'found-listings', cluster.label] })
      queryClient.invalidateQueries({ queryKey: ['findare', 'config', cluster.label] })
    },
  })
}

