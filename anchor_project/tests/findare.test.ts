import { beforeAll, describe, expect, it } from 'vitest'
import {
  Blockhash,
  createSolanaClient,
  createTransaction,
  Instruction,
  KeyPairSigner,
  signTransactionMessageWithSigners,
} from 'gill'
import { generateKeyPairSigner } from '@solana/signers'
import {
  PostStatus,
  ClaimStatus,
  fetchAppConfig,
  fetchFoundPost,
  fetchLostPost,
  getApproveClaimInstruction,
  getApproveFoundReportInstruction,
  getClaimFoundListingInstructionAsync,
  getCreateFoundListingInstructionAsync,
  getCreateLostPostInstructionAsync,
  getInitializeAppInstructionAsync,
  getRejectClaimInstruction,
  getRejectFoundReportInstruction,
  getSubmitFoundReportInstructionAsync,
  getCloseLostPostInstruction,
} from '../src'
// @ts-ignore error TS2307 suggest setting `moduleResolution` but this is already configured
import { loadKeypairSignerFromFile } from 'gill/node'

const { rpc, sendAndConfirmTransaction } = createSolanaClient({ urlOrMoniker: process.env.ANCHOR_PROVIDER_URL! })

const LAMPORTS_PER_SOL = 1_000_000_000n

describe.sequential('findare program', () => {
  let admin: KeyPairSigner
  let poster: KeyPairSigner
  let finder: KeyPairSigner
  let claimer: KeyPairSigner
  let altClaimer: KeyPairSigner
  let configAddress: string

  beforeAll(async () => {
    admin = await loadKeypairSignerFromFile(process.env.ANCHOR_WALLET!)
    poster = await generateKeyPairSigner()
    finder = await generateKeyPairSigner()
    claimer = await generateKeyPairSigner()
    altClaimer = await generateKeyPairSigner()

    await Promise.all([poster, finder, claimer, altClaimer].map((signer) => fundSigner(signer, 5n)))

    const initIx = await getInitializeAppInstructionAsync({
      payer: admin,
      admin: admin.address,
    })
    configAddress = initIx.accounts[1]!.address
    await sendInstructions([initIx], admin)

    const config = await fetchAppConfig(rpc, configAddress)
    expect(config.data.admin).toBe(admin.address)
  })

  it('handles lost post lifecycle including approvals and rejections', async () => {
    const rewardLamports = 200_000_000n
    const postId = BigInt(Date.now())

    await expect(
      getCreateLostPostInstructionAsync({
        poster,
        config: configAddress,
        postId: postId + 10n,
        title: 'Invalid Reward',
        description: 'Too low reward should fail',
        attributes: 'type:test',
        photoRef: 'ipfs://invalid',
        rewardLamports: 1n,
      }).then((ix) => sendInstructions([ix], poster))
    ).rejects.toThrow()

    const createLostPostIx = await getCreateLostPostInstructionAsync({
      poster,
      config: configAddress,
      postId,
      title: 'Lost Drone',
      description: 'Black drone with red stripes near the park',
      attributes: 'serial:DRN-001,color:black',
      photoRef: 'ipfs://drone',
      rewardLamports,
    })
    const lostPostAddress = createLostPostIx.accounts[2]!.address
    await sendInstructions([createLostPostIx], poster)

    let lostPost = await fetchLostPost(rpc, lostPostAddress)
    expect(lostPost.data.status).toBe(PostStatus.Open)
    expect(lostPost.data.rewardLamports).toBe(rewardLamports)

    const submitReportIx = await getSubmitFoundReportInstructionAsync({
      finder,
      lostPost: lostPostAddress,
      config: configAddress,
      evidenceUri: 'ipfs://found-drone-proof',
    })
    const reportAddress = submitReportIx.accounts[3]!.address
    await sendInstructions([submitReportIx], finder)

    lostPost = await fetchLostPost(rpc, lostPostAddress)
    expect(lostPost.data.status).toBe(PostStatus.AwaitingAdminReview)

    const rejectReportIx = await getRejectFoundReportInstruction({
      admin,
      config: configAddress,
      lostPost: lostPostAddress,
      foundReport: reportAddress,
      finder: finder.address,
    })
    await sendInstructions([rejectReportIx], admin)

    lostPost = await fetchLostPost(rpc, lostPostAddress)
    expect(lostPost.data.status).toBe(PostStatus.Open)

    const submitAgainIx = await getSubmitFoundReportInstructionAsync({
      finder,
      lostPost: lostPostAddress,
      config: configAddress,
      evidenceUri: 'ipfs://found-drone-proof-v2',
    })
    const approvedReportAddress = submitAgainIx.accounts[3]!.address
    await sendInstructions([submitAgainIx], finder)

    const finderBalanceBefore = await getBalance(finder)
    const approveReportIx = await getApproveFoundReportInstruction({
      admin,
      config: configAddress,
      lostPost: lostPostAddress,
      foundReport: approvedReportAddress,
      finder: finder.address,
    })
    await sendInstructions([approveReportIx], admin)
    const finderBalanceAfter = await getBalance(finder)

    expect(finderBalanceAfter - finderBalanceBefore).toBeGreaterThanOrEqual(rewardLamports - 500_000n)

    lostPost = await fetchLostPost(rpc, lostPostAddress)
    expect(lostPost.data.status).toBe(PostStatus.AwaitingPickup)
    expect(lostPost.data.rewardLamports).toBe(0n)

    const closeIx = getCloseLostPostInstruction({
      lostPost: lostPostAddress,
      poster,
    })
    await sendInstructions([closeIx], poster)
  })

  it('handles found listing claims and refunds', async () => {
    const listingId = BigInt(Date.now())
    const createFoundListingIx = await getCreateFoundListingInstructionAsync({
      finder,
      config: configAddress,
      postId: listingId,
      title: 'Found Backpack',
      description: 'Blue backpack with laptop stickers',
      attributes: 'brand:NorthFace',
      photoRef: 'ipfs://backpack-photo',
    })
    const foundPostAddress = createFoundListingIx.accounts[2]!.address
    await sendInstructions([createFoundListingIx], finder)

    const depositLamports = 50_000_000n
    const claimIx = await getClaimFoundListingInstructionAsync({
      claimer,
      foundPost: foundPostAddress,
      config: configAddress,
      claimNotes: 'Contains my initials LS inside',
      claimDeposit: depositLamports,
    })
    const claimTicketAddress = claimIx.accounts[3]!.address
    await sendInstructions([claimIx], claimer)

    let foundPost = await fetchFoundPost(rpc, foundPostAddress)
    expect(foundPost.data.status).toBe(ClaimStatus.AwaitingAdminReview)

    const finderBalanceBefore = await getBalance(finder)
    const approveClaimIx = await getApproveClaimInstruction({
      admin,
      config: configAddress,
      foundPost: foundPostAddress,
      claimTicket: claimTicketAddress,
      finder: finder.address,
    })
    await sendInstructions([approveClaimIx], admin)
    const finderBalanceAfter = await getBalance(finder)
    expect(finderBalanceAfter - finderBalanceBefore).toBeGreaterThanOrEqual(depositLamports - 500_000n)

    foundPost = await fetchFoundPost(rpc, foundPostAddress)
    expect(foundPost.data.status).toBe(ClaimStatus.Closed)

    // Rejection scenario
    const rejectListingId = listingId + 1n
    const secondListingIx = await getCreateFoundListingInstructionAsync({
      finder,
      config: configAddress,
      postId: rejectListingId,
      title: 'Found Phone',
      description: 'White phone with cracked screen',
      attributes: 'model:PhoneX',
      photoRef: 'ipfs://phone-photo',
    })
    const secondListingAddress = secondListingIx.accounts[2]!.address
    await sendInstructions([secondListingIx], finder)

    await expect(
      getClaimFoundListingInstructionAsync({
        claimer,
        foundPost: secondListingAddress,
        config: configAddress,
        claimNotes: 'Wrong deposit',
        claimDeposit: 1_000_000n,
      }).then((ix) => sendInstructions([ix], claimer))
    ).rejects.toThrow()

    const validClaimIx = await getClaimFoundListingInstructionAsync({
      claimer: altClaimer,
      foundPost: secondListingAddress,
      config: configAddress,
      claimNotes: 'Screen protector missing',
      claimDeposit: depositLamports,
    })
    const altClaimTicket = validClaimIx.accounts[3]!.address
    await sendInstructions([validClaimIx], altClaimer)

    const claimerBalanceBefore = await getBalance(altClaimer)
    const rejectClaimIx = await getRejectClaimInstruction({
      admin,
      config: configAddress,
      foundPost: secondListingAddress,
      claimTicket: altClaimTicket,
      claimer: altClaimer.address,
    })
    await sendInstructions([rejectClaimIx], admin)
    const claimerBalanceAfter = await getBalance(altClaimer)
    expect(claimerBalanceAfter - claimerBalanceBefore).toBeGreaterThanOrEqual(depositLamports - 500_000n)

    const reopenedPost = await fetchFoundPost(rpc, secondListingAddress)
    expect(reopenedPost.data.status).toBe(ClaimStatus.Open)
  })

  it('rejects unauthorized admin actions', async () => {
    const postId = BigInt(Date.now() + 10000)
    const createLostPostIx = await getCreateLostPostInstructionAsync({
      poster,
      config: configAddress,
      postId,
      title: 'Test Post',
      description: 'Test description',
      attributes: 'test',
      photoRef: 'ipfs://test',
      rewardLamports: 200_000_000n,
    })
    const lostPostAddress = createLostPostIx.accounts[2]!.address
    await sendInstructions([createLostPostIx], poster)

    const submitReportIx = await getSubmitFoundReportInstructionAsync({
      finder,
      lostPost: lostPostAddress,
      config: configAddress,
      evidenceUri: 'ipfs://evidence',
    })
    const reportAddress = submitReportIx.accounts[3]!.address
    await sendInstructions([submitReportIx], finder)

    // Non-admin trying to approve should fail
    await expect(
      getApproveFoundReportInstruction({
        admin: finder, // Wrong admin
        config: configAddress,
        lostPost: lostPostAddress,
        foundReport: reportAddress,
        finder: finder.address,
      }).then((ix) => sendInstructions([ix], finder))
    ).rejects.toThrow()
  })

  it('rejects submitting report to non-open post', async () => {
    const postId = BigInt(Date.now() + 20000)
    const createLostPostIx = await getCreateLostPostInstructionAsync({
      poster,
      config: configAddress,
      postId,
      title: 'Closed Post',
      description: 'Test',
      attributes: 'test',
      photoRef: 'ipfs://test',
      rewardLamports: 200_000_000n,
    })
    const lostPostAddress = createLostPostIx.accounts[2]!.address
    await sendInstructions([createLostPostIx], poster)

    // Close the post first
    const closeIx = getCloseLostPostInstruction({
      lostPost: lostPostAddress,
      poster,
    })
    // Can't close with outstanding reward, so we need to approve a report first
    // Let's just test that submitting to a closed post fails
    // Actually, we can't easily test this without first going through the full flow
    // So let's test submitting report when already awaiting review
    const submitReportIx1 = await getSubmitFoundReportInstructionAsync({
      finder,
      lostPost: lostPostAddress,
      config: configAddress,
      evidenceUri: 'ipfs://evidence1',
    })
    await sendInstructions([submitReportIx1], finder)

    // Try to submit another report while awaiting review - should fail
    await expect(
      getSubmitFoundReportInstructionAsync({
        finder,
        lostPost: lostPostAddress,
        config: configAddress,
        evidenceUri: 'ipfs://evidence2',
      }).then((ix) => sendInstructions([ix], finder))
    ).rejects.toThrow()
  })

  it('rejects claiming already claimed listing', async () => {
    const listingId = BigInt(Date.now() + 30000)
    const createFoundListingIx = await getCreateFoundListingInstructionAsync({
      finder,
      config: configAddress,
      postId: listingId,
      title: 'Test Listing',
      description: 'Test',
      attributes: 'test',
      photoRef: 'ipfs://test',
    })
    const foundPostAddress = createFoundListingIx.accounts[2]!.address
    await sendInstructions([createFoundListingIx], finder)

    const depositLamports = 50_000_000n
    const claimIx = await getClaimFoundListingInstructionAsync({
      claimer,
      foundPost: foundPostAddress,
      config: configAddress,
      claimNotes: 'My item',
      claimDeposit: depositLamports,
    })
    const claimTicketAddress = claimIx.accounts[3]!.address
    await sendInstructions([claimIx], claimer)

    // Approve the claim
    const approveClaimIx = await getApproveClaimInstruction({
      admin,
      config: configAddress,
      foundPost: foundPostAddress,
      claimTicket: claimTicketAddress,
      finder: finder.address,
    })
    await sendInstructions([approveClaimIx], admin)

    // Try to claim again - should fail
    await expect(
      getClaimFoundListingInstructionAsync({
        claimer: altClaimer,
        foundPost: foundPostAddress,
        config: configAddress,
        claimNotes: 'Also mine',
        claimDeposit: depositLamports,
      }).then((ix) => sendInstructions([ix], altClaimer))
    ).rejects.toThrow()
  })

  it('rejects closing post with outstanding reward', async () => {
    const postId = BigInt(Date.now() + 40000)
    const createLostPostIx = await getCreateLostPostInstructionAsync({
      poster,
      config: configAddress,
      postId,
      title: 'Test Post',
      description: 'Test',
      attributes: 'test',
      photoRef: 'ipfs://test',
      rewardLamports: 200_000_000n,
    })
    const lostPostAddress = createLostPostIx.accounts[2]!.address
    await sendInstructions([createLostPostIx], poster)

    // Try to close with outstanding reward - should fail
    await expect(
      sendInstructions([
        getCloseLostPostInstruction({
          lostPost: lostPostAddress,
          poster,
        }),
      ], poster)
    ).rejects.toThrow()
  })

  it('rejects double approval/rejection attempts', async () => {
    const postId = BigInt(Date.now() + 50000)
    const createLostPostIx = await getCreateLostPostInstructionAsync({
      poster,
      config: configAddress,
      postId,
      title: 'Test Post',
      description: 'Test',
      attributes: 'test',
      photoRef: 'ipfs://test',
      rewardLamports: 200_000_000n,
    })
    const lostPostAddress = createLostPostIx.accounts[2]!.address
    await sendInstructions([createLostPostIx], poster)

    const submitReportIx = await getSubmitFoundReportInstructionAsync({
      finder,
      lostPost: lostPostAddress,
      config: configAddress,
      evidenceUri: 'ipfs://evidence',
    })
    const reportAddress = submitReportIx.accounts[3]!.address
    await sendInstructions([submitReportIx], finder)

    // Approve once
    const approveReportIx = await getApproveFoundReportInstruction({
      admin,
      config: configAddress,
      lostPost: lostPostAddress,
      foundReport: reportAddress,
      finder: finder.address,
    })
    await sendInstructions([approveReportIx], admin)

    // Try to approve again - should fail
    await expect(
      sendInstructions([
        getApproveFoundReportInstruction({
          admin,
          config: configAddress,
          lostPost: lostPostAddress,
          foundReport: reportAddress,
          finder: finder.address,
        }),
      ], admin)
    ).rejects.toThrow()
  })
})

async function fundSigner(signer: KeyPairSigner, sol: bigint) {
  const signature = await rpc.requestAirdrop(signer.address, sol * LAMPORTS_PER_SOL).send()
  await waitForSignature(signature)
}

async function getBalance(signer: KeyPairSigner) {
  return (await rpc.getBalance(signer.address).send()).value
}

async function sendInstructions(instructions: Instruction[], feePayer: KeyPairSigner) {
  const tx = createTransaction({
    feePayer,
    instructions,
    version: 'legacy',
    latestBlockhash: await getLatestBlockhash(),
  })
  const signedTransaction = await signTransactionMessageWithSigners(tx)
  try {
    return await sendAndConfirmTransaction(signedTransaction)
  } catch (error) {
    console.error('Transaction failed', error)
    throw error
  }
}

let latestBlockhash: Awaited<ReturnType<typeof getLatestBlockhash>> | undefined
async function getLatestBlockhash(): Promise<Readonly<{ blockhash: Blockhash; lastValidBlockHeight: bigint }>> {
  if (latestBlockhash) {
    return latestBlockhash
  }
  return await rpc
    .getLatestBlockhash()
    .send()
    .then(({ value }) => value)
}

async function waitForSignature(signature: string | Uint8Array) {
  for (let attempt = 0; attempt < 40; attempt++) {
    const status = await rpc.getSignatureStatuses([signature]).send()
    if (status.value[0]?.confirmationStatus) {
      return
    }
    await sleep(250)
  }
  throw new Error('Signature confirmation timed out')
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
