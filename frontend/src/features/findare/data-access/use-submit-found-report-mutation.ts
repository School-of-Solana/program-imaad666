import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSolana } from '@/components/solana/use-solana'
import { 
  getSubmitFoundReportInstructionAsync,
  FINDARE_PROGRAM_ADDRESS 
} from '../../../../anchor/src/client/js/generated'
import { sendAndConfirmTransactionFactory, getProgramDerivedAddress, getBytesEncoder, getAddressEncoder } from 'gill'
import type { Address } from 'gill'

async function getAppConfigAddress() {
  return getProgramDerivedAddress({
    programAddress: FINDARE_PROGRAM_ADDRESS,
    seeds: [getBytesEncoder().encode(new Uint8Array([99, 111, 110, 102, 105, 103]))], // b"config"
  })
}

export function useSubmitFoundReportMutation() {
  const { client, account, cluster } = useSolana()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (args: {
      lostPostAddress: Address
      evidenceUri: string
    }) => {
      if (!client || !account) throw new Error('Client or account not available')
      
      const configAddress = await getAppConfigAddress()
      const instruction = await getSubmitFoundReportInstructionAsync({
        finder: account,
        lostPost: args.lostPostAddress,
        config: configAddress,
        evidenceUri: args.evidenceUri,
      })

      const sendAndConfirm = sendAndConfirmTransactionFactory({ client })
      return sendAndConfirm([instruction], { account })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['findare', 'lost-posts', cluster.label] })
    },
  })
}

