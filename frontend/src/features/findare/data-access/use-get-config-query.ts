import { useQuery } from '@tanstack/react-query'
import { useSolana } from '@/components/solana/use-solana'
import { 
  fetchAppConfig, 
  FINDARE_PROGRAM_ADDRESS 
} from '../../../../anchor/src/client/js/generated'
import { getProgramDerivedAddress, getBytesEncoder } from 'gill'

function getAppConfigAddress() {
  return getProgramDerivedAddress({
    programAddress: FINDARE_PROGRAM_ADDRESS,
    seeds: [getBytesEncoder().encode(new Uint8Array([99, 111, 110, 102, 105, 103]))], // b"config"
  })
}

export function useGetConfigQuery() {
  const { client, cluster } = useSolana()
  
  return useQuery({
    queryKey: ['findare', 'config', cluster.label],
    queryFn: async () => {
      if (!client) throw new Error('Client not available')
      const configAddress = await getAppConfigAddress()
      return fetchAppConfig(client, configAddress)
    },
    enabled: !!client,
  })
}

