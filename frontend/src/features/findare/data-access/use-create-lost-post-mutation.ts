import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSolana } from '@/components/solana/use-solana'
import { 
  getCreateLostPostInstructionAsync,
  FINDARE_PROGRAM_ADDRESS 
} from '../../../../anchor/src/client/js/generated'
import { sendAndConfirmTransactionFactory, getProgramDerivedAddress, getBytesEncoder } from 'gill'

async function getAppConfigAddress() {
  return getProgramDerivedAddress({
    programAddress: FINDARE_PROGRAM_ADDRESS,
    seeds: [getBytesEncoder().encode(new Uint8Array([99, 111, 110, 102, 105, 103]))], // b"config"
  })
}

export function useCreateLostPostMutation() {
  const { client, account, cluster } = useSolana()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (args: {
      postId: number
      title: string
      description: string
      attributes: string
      photoRef: string
      rewardLamports: bigint
    }) => {
      if (!client || !account) throw new Error('Client or account not available')
      
      const configAddress = await getAppConfigAddress()
      const instruction = await getCreateLostPostInstructionAsync({
        poster: account,
        config: configAddress,
        ...args,
      })

      const sendAndConfirm = sendAndConfirmTransactionFactory({ client })
      return sendAndConfirm([instruction], { account })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['findare', 'lost-posts', cluster.label] })
      queryClient.invalidateQueries({ queryKey: ['findare', 'config', cluster.label] })
    },
  })
}

