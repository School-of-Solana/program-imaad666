import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSolana } from '@/components/solana/use-solana'
import { 
  getApproveFoundReportInstruction,
  getRejectFoundReportInstruction,
  getApproveClaimInstruction,
  getRejectClaimInstruction,
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

async function getFoundReportAddress(lostPostAddress: Address, finderAddress: Address) {
  return getProgramDerivedAddress({
    programAddress: FINDARE_PROGRAM_ADDRESS,
    seeds: [
      getBytesEncoder().encode(new Uint8Array([102, 111, 117, 110, 100, 45, 114, 101, 112, 111, 114, 116])), // b"found-report"
      getAddressEncoder().encode(lostPostAddress),
      getAddressEncoder().encode(finderAddress),
    ],
  })
}

async function getClaimTicketAddress(foundPostAddress: Address, claimerAddress: Address) {
  return getProgramDerivedAddress({
    programAddress: FINDARE_PROGRAM_ADDRESS,
    seeds: [
      getBytesEncoder().encode(new Uint8Array([99, 108, 97, 105, 109, 45, 116, 105, 99, 107, 101, 116])), // b"claim-ticket"
      getAddressEncoder().encode(foundPostAddress),
      getAddressEncoder().encode(claimerAddress),
    ],
  })
}

export function useApproveFoundReportMutation() {
  const { client, account, cluster } = useSolana()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (args: {
      lostPostAddress: Address
      finderAddress: Address
    }) => {
      if (!client || !account) throw new Error('Client or account not available')
      
      const configAddress = await getAppConfigAddress()
      const foundReportAddress = await getFoundReportAddress(args.lostPostAddress, args.finderAddress)
      
      const instruction = getApproveFoundReportInstruction({
        admin: account,
        config: configAddress,
        lostPost: args.lostPostAddress,
        foundReport: foundReportAddress,
        finder: args.finderAddress,
      })

      const sendAndConfirm = sendAndConfirmTransactionFactory({ client })
      return sendAndConfirm([instruction], { account })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['findare', 'lost-posts', cluster.label] })
    },
  })
}

export function useRejectFoundReportMutation() {
  const { client, account, cluster } = useSolana()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (args: {
      lostPostAddress: Address
      finderAddress: Address
    }) => {
      if (!client || !account) throw new Error('Client or account not available')
      
      const configAddress = await getAppConfigAddress()
      const foundReportAddress = await getFoundReportAddress(args.lostPostAddress, args.finderAddress)
      
      const instruction = getRejectFoundReportInstruction({
        admin: account,
        config: configAddress,
        lostPost: args.lostPostAddress,
        foundReport: foundReportAddress,
        finder: args.finderAddress,
      })

      const sendAndConfirm = sendAndConfirmTransactionFactory({ client })
      return sendAndConfirm([instruction], { account })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['findare', 'lost-posts', cluster.label] })
    },
  })
}

export function useApproveClaimMutation() {
  const { client, account, cluster } = useSolana()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (args: {
      foundPostAddress: Address
      claimerAddress: Address
      finderAddress: Address
    }) => {
      if (!client || !account) throw new Error('Client or account not available')
      
      const configAddress = await getAppConfigAddress()
      const claimTicketAddress = await getClaimTicketAddress(args.foundPostAddress, args.claimerAddress)
      
      const instruction = getApproveClaimInstruction({
        admin: account,
        config: configAddress,
        foundPost: args.foundPostAddress,
        claimTicket: claimTicketAddress,
        finder: args.finderAddress,
      })

      const sendAndConfirm = sendAndConfirmTransactionFactory({ client })
      return sendAndConfirm([instruction], { account })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['findare', 'found-listings', cluster.label] })
    },
  })
}

export function useRejectClaimMutation() {
  const { client, account, cluster } = useSolana()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (args: {
      foundPostAddress: Address
      claimerAddress: Address
    }) => {
      if (!client || !account) throw new Error('Client or account not available')
      
      const configAddress = await getAppConfigAddress()
      const claimTicketAddress = await getClaimTicketAddress(args.foundPostAddress, args.claimerAddress)
      
      const instruction = getRejectClaimInstruction({
        admin: account,
        config: configAddress,
        foundPost: args.foundPostAddress,
        claimTicket: claimTicketAddress,
        claimer: args.claimerAddress,
      })

      const sendAndConfirm = sendAndConfirmTransactionFactory({ client })
      return sendAndConfirm([instruction], { account })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['findare', 'found-listings', cluster.label] })
    },
  })
}

