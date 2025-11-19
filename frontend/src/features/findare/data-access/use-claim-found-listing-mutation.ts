import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSolana } from '@/components/solana/use-solana'
import { 
  getClaimFoundListingInstructionAsync,
  FINDARE_PROGRAM_ADDRESS 
} from '../../../../anchor/src/client/js/generated'
import { sendAndConfirmTransactionFactory, getProgramDerivedAddress, getBytesEncoder } from 'gill'
import type { Address } from 'gill'

const LAMPORTS_PER_SOL = 1_000_000_000n
const MIN_CLAIM_DEPOSIT_SOL = 0.01

async function getAppConfigAddress() {
  return getProgramDerivedAddress({
    programAddress: FINDARE_PROGRAM_ADDRESS,
    seeds: [getBytesEncoder().encode(new Uint8Array([99, 111, 110, 102, 105, 103]))], // b"config"
  })
}

export function useClaimFoundListingMutation() {
  const { client, account, cluster } = useSolana()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (args: {
      foundPostAddress: Address
      claimNotes: string
      claimDepositSol: number
    }) => {
      if (!client || !account) throw new Error('Client or account not available')
      
      if (args.claimDepositSol < MIN_CLAIM_DEPOSIT_SOL) {
        throw new Error(`Deposit must be at least ${MIN_CLAIM_DEPOSIT_SOL} SOL`)
      }

      const configAddress = await getAppConfigAddress()
      const claimDepositLamports = BigInt(Math.floor(args.claimDepositSol * Number(LAMPORTS_PER_SOL)))
      
      const instruction = await getClaimFoundListingInstructionAsync({
        claimer: account,
        foundPost: args.foundPostAddress,
        config: configAddress,
        claimNotes: args.claimNotes,
        claimDeposit: claimDepositLamports,
      })

      const sendAndConfirm = sendAndConfirmTransactionFactory({ client })
      return sendAndConfirm([instruction], { account })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['findare', 'found-listings', cluster.label] })
    },
  })
}

