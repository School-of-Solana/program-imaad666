import { FINDARE_PROGRAM_ADDRESS } from '@project/anchor'
import { AppExplorerLink } from '@/components/app-explorer-link'
import { ellipsify } from '@wallet-ui/react'

export function FindareUiProgramExplorerLink() {
  return <AppExplorerLink address={FINDARE_PROGRAM_ADDRESS} label={ellipsify(FINDARE_PROGRAM_ADDRESS)} />
}
