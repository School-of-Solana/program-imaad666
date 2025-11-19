use anchor_lang::{prelude::*, system_program};

declare_id!("JAVuBXeBZqXNtS73azhBDAoYaaAFfo4gWXoZe2e7Jf8H");

pub const MAX_TITLE_LEN: usize = 64;
pub const MAX_DESC_LEN: usize = 512;
pub const MAX_ATTR_LEN: usize = 256;
pub const MAX_URI_LEN: usize = 128;
pub const MIN_REWARD_LAMPORTS: u64 = 100_000_000; // 0.1 SOL
pub const MIN_CLAIM_DEPOSIT: u64 = 10_000_000; // 0.01 SOL

#[program]
pub mod findare {
    use super::*;

    pub fn initialize_app(ctx: Context<InitializeApp>, admin: Pubkey) -> Result<()> {
        let config = &mut ctx.accounts.config;
        require_keys_neq!(admin, Pubkey::default());
        config.admin = admin;
        config.bump = ctx.bumps.config;
        config.lost_post_count = 0;
        config.found_post_count = 0;
        Ok(())
    }

    #[allow(clippy::too_many_arguments)]
    pub fn create_lost_post(
        ctx: Context<CreateLostPost>,
        post_id: u64,
        title: String,
        description: String,
        attributes: String,
        photo_ref: String,
        reward_lamports: u64,
    ) -> Result<()> {
        require!(reward_lamports >= MIN_REWARD_LAMPORTS, FindAreError::RewardTooSmall);
        check_text(&title, MAX_TITLE_LEN)?;
        check_text(&description, MAX_DESC_LEN)?;
        check_text(&attributes, MAX_ATTR_LEN)?;
        check_text(&photo_ref, MAX_URI_LEN)?;

        let lost_post = &mut ctx.accounts.lost_post;
        let poster = &ctx.accounts.poster;

        lost_post.config = ctx.accounts.config.key();
        lost_post.owner = poster.key();
        lost_post.post_id = post_id;
        lost_post.title = title;
        lost_post.description = description;
        lost_post.attributes = attributes;
        lost_post.photo_ref = photo_ref;
        lost_post.reward_lamports = reward_lamports;
        lost_post.status = PostStatus::Open;
        lost_post.finder = Pubkey::default();
        lost_post.created_at = Clock::get()?.unix_timestamp;
        lost_post.updated_at = lost_post.created_at;
        lost_post.bump = ctx.bumps.lost_post;

        transfer_from_signer(
            poster,
            &lost_post.to_account_info(),
            &ctx.accounts.system_program,
            reward_lamports,
        )?;

        Ok(())
    }

    pub fn submit_found_report(
        ctx: Context<SubmitFoundReport>,
        evidence_uri: String,
    ) -> Result<()> {
        check_text(&evidence_uri, MAX_URI_LEN)?;
        let lost_post = &mut ctx.accounts.lost_post;
        require!(
            lost_post.status == PostStatus::Open,
            FindAreError::LostPostNotOpen
        );

        let report = &mut ctx.accounts.found_report;
        report.lost_post = lost_post.key();
        report.finder = ctx.accounts.finder.key();
        report.evidence_uri = evidence_uri;
        report.status = VerificationStatus::Submitted;
        report.created_at = Clock::get()?.unix_timestamp;
        report.bump = ctx.bumps.found_report;

        lost_post.status = PostStatus::AwaitingAdminReview;
        lost_post.updated_at = report.created_at;

        Ok(())
    }

    pub fn approve_found_report(ctx: Context<ApproveFoundReportCtx>) -> Result<()> {
        let config = &ctx.accounts.config;
        require!(
            ctx.accounts.admin.key() == config.admin,
            FindAreError::Unauthorized
        );

        let lost_post = &mut ctx.accounts.lost_post;
        let report = &mut ctx.accounts.found_report;

        require!(
            report.status == VerificationStatus::Submitted,
            FindAreError::ReportAlreadyProcessed
        );
        require!(
            lost_post.status == PostStatus::AwaitingAdminReview,
            FindAreError::LostPostNotOpen
        );

        report.status = VerificationStatus::Approved;
        lost_post.status = PostStatus::AwaitingPickup;
        lost_post.finder = report.finder;
        lost_post.updated_at = Clock::get()?.unix_timestamp;

        transfer_program_lamports(
            lost_post.to_account_info(),
            ctx.accounts.finder.to_account_info(),
            lost_post.reward_lamports,
        )?;
        lost_post.reward_lamports = 0;

        Ok(())
    }

    pub fn reject_found_report(ctx: Context<RejectFoundReportCtx>) -> Result<()> {
        let config = &ctx.accounts.config;
        require!(
            ctx.accounts.admin.key() == config.admin,
            FindAreError::Unauthorized
        );

        let lost_post = &mut ctx.accounts.lost_post;
        let report = &mut ctx.accounts.found_report;

        require!(
            report.status == VerificationStatus::Submitted,
            FindAreError::ReportAlreadyProcessed
        );

        report.status = VerificationStatus::Rejected;
        lost_post.status = PostStatus::Open;
        lost_post.updated_at = Clock::get()?.unix_timestamp;

        Ok(())
    }

    pub fn close_lost_post(ctx: Context<CloseLostPost>) -> Result<()> {
        let lost_post = &mut ctx.accounts.lost_post;
        require!(
            lost_post.owner == ctx.accounts.poster.key(),
            FindAreError::Unauthorized
        );
        require!(
            lost_post.reward_lamports == 0,
            FindAreError::OutstandingReward
        );
        lost_post.status = PostStatus::Closed;
        Ok(())
    }

    #[allow(clippy::too_many_arguments)]
    pub fn create_found_listing(
        ctx: Context<CreateFoundListing>,
        post_id: u64,
        title: String,
        description: String,
        attributes: String,
        photo_ref: String,
    ) -> Result<()> {
        check_text(&title, MAX_TITLE_LEN)?;
        check_text(&description, MAX_DESC_LEN)?;
        check_text(&attributes, MAX_ATTR_LEN)?;
        check_text(&photo_ref, MAX_URI_LEN)?;

        let found_post = &mut ctx.accounts.found_post;
        let finder = &ctx.accounts.finder;

        found_post.config = ctx.accounts.config.key();
        found_post.finder = finder.key();
        found_post.post_id = post_id;
        found_post.title = title;
        found_post.description = description;
        found_post.attributes = attributes;
        found_post.photo_ref = photo_ref;
        found_post.status = ClaimStatus::Open;
        found_post.created_at = Clock::get()?.unix_timestamp;
        found_post.updated_at = found_post.created_at;
        found_post.active_claim = Pubkey::default();
        found_post.bump = ctx.bumps.found_post;

        Ok(())
    }

    pub fn claim_found_listing(
        ctx: Context<ClaimFoundListing>,
        claim_notes: String,
        claim_deposit: u64,
    ) -> Result<()> {
        require!(
            claim_deposit >= MIN_CLAIM_DEPOSIT,
            FindAreError::ClaimDepositTooSmall
        );
        check_text(&claim_notes, MAX_DESC_LEN)?;

        let found_post = &mut ctx.accounts.found_post;
        require!(
            found_post.status == ClaimStatus::Open,
            FindAreError::ClaimNotAllowed
        );

        let claim = &mut ctx.accounts.claim_ticket;
        claim.found_post = found_post.key();
        claim.claimer = ctx.accounts.claimer.key();
        claim.notes = claim_notes;
        claim.status = VerificationStatus::Submitted;
        claim.deposit_lamports = claim_deposit;
        claim.created_at = Clock::get()?.unix_timestamp;
        claim.bump = ctx.bumps.claim_ticket;

        found_post.status = ClaimStatus::AwaitingAdminReview;
        found_post.active_claim = claim.key();
        found_post.updated_at = claim.created_at;

        transfer_from_signer(
            &ctx.accounts.claimer,
            &claim.to_account_info(),
            &ctx.accounts.system_program,
            claim_deposit,
        )?;

        Ok(())
    }

    pub fn approve_claim(ctx: Context<ApproveClaim>) -> Result<()> {
        let config = &ctx.accounts.config;
        require!(
            ctx.accounts.admin.key() == config.admin,
            FindAreError::Unauthorized
        );

        let claim = &mut ctx.accounts.claim_ticket;
        require!(
            claim.status == VerificationStatus::Submitted,
            FindAreError::ClaimAlreadyProcessed
        );

        let found_post = &mut ctx.accounts.found_post;
        require!(
            found_post.status == ClaimStatus::AwaitingAdminReview,
            FindAreError::ClaimNotAllowed
        );

        claim.status = VerificationStatus::Approved;
        found_post.status = ClaimStatus::Closed;
        found_post.updated_at = Clock::get()?.unix_timestamp;

        Ok(())
    }

    pub fn reject_claim(ctx: Context<RejectClaim>) -> Result<()> {
        let config = &ctx.accounts.config;
        require!(
            ctx.accounts.admin.key() == config.admin,
            FindAreError::Unauthorized
        );

        let claim = &mut ctx.accounts.claim_ticket;
        require!(
            claim.status == VerificationStatus::Submitted,
            FindAreError::ClaimAlreadyProcessed
        );

        let found_post = &mut ctx.accounts.found_post;
        claim.status = VerificationStatus::Rejected;
        found_post.status = ClaimStatus::Open;
        found_post.active_claim = Pubkey::default();
        found_post.updated_at = Clock::get()?.unix_timestamp;

        Ok(())
    }
}

fn transfer_program_lamports(
    from: AccountInfo<'_>,
    to: AccountInfo<'_>,
    lamports: u64,
) -> Result<()> {
    let available = **from.lamports.borrow();
    require!(available >= lamports, FindAreError::InsufficientEscrow);
    **from.try_borrow_mut_lamports()? -= lamports;
    **to.try_borrow_mut_lamports()? += lamports;
    Ok(())
}

fn transfer_from_signer<'info>(
    signer: &Signer<'info>,
    to: &AccountInfo<'info>,
    system_program: &Program<'info, System>,
    lamports: u64,
) -> Result<()> {
    let cpi_accounts = system_program::Transfer {
        from: signer.to_account_info(),
        to: to.clone(),
    };
    let cpi_ctx = CpiContext::new(system_program.to_account_info(), cpi_accounts);
    system_program::transfer(cpi_ctx, lamports)
}

fn check_text(value: &str, max: usize) -> Result<()> {
    require!(!value.trim().is_empty(), FindAreError::EmptyField);
    require!(value.len() <= max, FindAreError::FieldTooLong);
    Ok(())
}

#[derive(Accounts)]
pub struct InitializeApp<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init,
        payer = payer,
        seeds = [b"config"],
        bump,
        space = AppConfig::LEN
    )]
    pub config: Account<'info, AppConfig>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(post_id: u64)]
pub struct CreateLostPost<'info> {
    #[account(mut)]
    pub poster: Signer<'info>,
    pub config: Account<'info, AppConfig>,
    #[account(
        init,
        payer = poster,
        seeds = [b"lost-post", poster.key().as_ref(), &post_id.to_le_bytes()],
        bump,
        space = LostPost::LEN
    )]
    pub lost_post: Account<'info, LostPost>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SubmitFoundReport<'info> {
    #[account(mut)]
    pub finder: Signer<'info>,
    #[account(
        mut,
        has_one = config,
        seeds = [b"lost-post", lost_post.owner.as_ref(), &lost_post.post_id.to_le_bytes()],
        bump = lost_post.bump
    )]
    pub lost_post: Account<'info, LostPost>,
    pub config: Account<'info, AppConfig>,
    #[account(
        init,
        payer = finder,
        seeds = [b"found-report", lost_post.key().as_ref(), finder.key().as_ref()],
        bump,
        space = FoundReport::LEN
    )]
    pub found_report: Account<'info, FoundReport>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ApproveFoundReportCtx<'info> {
    pub admin: Signer<'info>,
    pub config: Account<'info, AppConfig>,
    #[account(
        mut,
        has_one = config,
        seeds = [b"lost-post", lost_post.owner.as_ref(), &lost_post.post_id.to_le_bytes()],
        bump = lost_post.bump
    )]
    pub lost_post: Account<'info, LostPost>,
    #[account(
        mut,
        close = finder,
        seeds = [b"found-report", lost_post.key().as_ref(), found_report.finder.as_ref()],
        bump = found_report.bump
    )]
    pub found_report: Account<'info, FoundReport>,
    /// CHECK: Finder receives reward; address verified against the report
    #[account(mut, address = found_report.finder)]
    pub finder: UncheckedAccount<'info>,
}

#[derive(Accounts)]
pub struct RejectFoundReportCtx<'info> {
    pub admin: Signer<'info>,
    pub config: Account<'info, AppConfig>,
    #[account(
        mut,
        has_one = config,
        seeds = [b"lost-post", lost_post.owner.as_ref(), &lost_post.post_id.to_le_bytes()],
        bump = lost_post.bump
    )]
    pub lost_post: Account<'info, LostPost>,
    #[account(
        mut,
        close = finder,
        seeds = [b"found-report", lost_post.key().as_ref(), found_report.finder.as_ref()],
        bump = found_report.bump
    )]
    pub found_report: Account<'info, FoundReport>,
    /// CHECK: Finder refunded rent when report is rejected
    #[account(mut, address = found_report.finder)]
    pub finder: UncheckedAccount<'info>,
}

#[derive(Accounts)]
pub struct CloseLostPost<'info> {
    #[account(mut, close = poster)]
    pub lost_post: Account<'info, LostPost>,
    #[account(mut)]
    pub poster: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(post_id: u64)]
pub struct CreateFoundListing<'info> {
    #[account(mut)]
    pub finder: Signer<'info>,
    pub config: Account<'info, AppConfig>,
    #[account(
        init,
        payer = finder,
        seeds = [b"found-post", finder.key().as_ref(), &post_id.to_le_bytes()],
        bump,
        space = FoundPost::LEN
    )]
    pub found_post: Account<'info, FoundPost>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ClaimFoundListing<'info> {
    #[account(mut)]
    pub claimer: Signer<'info>,
    #[account(
        mut,
        has_one = config,
        seeds = [b"found-post", found_post.finder.as_ref(), &found_post.post_id.to_le_bytes()],
        bump = found_post.bump
    )]
    pub found_post: Account<'info, FoundPost>,
    pub config: Account<'info, AppConfig>,
    #[account(
        init,
        payer = claimer,
        seeds = [b"claim-ticket", found_post.key().as_ref(), claimer.key().as_ref()],
        bump,
        space = ClaimTicket::LEN
    )]
    pub claim_ticket: Account<'info, ClaimTicket>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ApproveClaim<'info> {
    pub admin: Signer<'info>,
    pub config: Account<'info, AppConfig>,
    #[account(
        mut,
        has_one = config,
        seeds = [b"found-post", found_post.finder.as_ref(), &found_post.post_id.to_le_bytes()],
        bump = found_post.bump
    )]
    pub found_post: Account<'info, FoundPost>,
    #[account(
        mut,
        close = finder,
        seeds = [b"claim-ticket", found_post.key().as_ref(), claim_ticket.claimer.as_ref()],
        bump = claim_ticket.bump
    )]
    pub claim_ticket: Account<'info, ClaimTicket>,
    /// CHECK: Finder receives claimant deposit when approved
    #[account(mut, address = found_post.finder)]
    pub finder: UncheckedAccount<'info>,
}

#[derive(Accounts)]
pub struct RejectClaim<'info> {
    pub admin: Signer<'info>,
    pub config: Account<'info, AppConfig>,
    #[account(
        mut,
        has_one = config,
        seeds = [b"found-post", found_post.finder.as_ref(), &found_post.post_id.to_le_bytes()],
        bump = found_post.bump
    )]
    pub found_post: Account<'info, FoundPost>,
    #[account(
        mut,
        close = claimer,
        seeds = [b"claim-ticket", found_post.key().as_ref(), claim_ticket.claimer.as_ref()],
        bump = claim_ticket.bump
    )]
    pub claim_ticket: Account<'info, ClaimTicket>,
    /// CHECK: Claimer refunded when claim rejected
    #[account(mut, address = claim_ticket.claimer)]
    pub claimer: UncheckedAccount<'info>,
}

#[account]
pub struct AppConfig {
    pub admin: Pubkey,
    pub lost_post_count: u64,
    pub found_post_count: u64,
    pub bump: u8,
}

impl AppConfig {
    pub const LEN: usize = 8 + 32 + 8 + 8 + 1;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum PostStatus {
    Open,
    AwaitingAdminReview,
    AwaitingPickup,
    Closed,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum VerificationStatus {
    Submitted,
    Approved,
    Rejected,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum ClaimStatus {
    Open,
    AwaitingAdminReview,
    Closed,
}

#[account]
pub struct LostPost {
    pub config: Pubkey,
    pub owner: Pubkey,
    pub finder: Pubkey,
    pub post_id: u64,
    pub reward_lamports: u64,
    pub status: PostStatus,
    pub created_at: i64,
    pub updated_at: i64,
    pub title: String,
    pub description: String,
    pub attributes: String,
    pub photo_ref: String,
    pub bump: u8,
}

impl LostPost {
    pub const LEN: usize = 8  // discriminator
        + 32  // config
        + 32  // owner
        + 32  // finder
        + 8   // post_id
        + 8   // reward
        + 1   // status enum
        + 8   // created
        + 8   // updated
        + 4 + MAX_TITLE_LEN
        + 4 + MAX_DESC_LEN
        + 4 + MAX_ATTR_LEN
        + 4 + MAX_URI_LEN
        + 1; // bump
}

#[account]
pub struct FoundReport {
    pub lost_post: Pubkey,
    pub finder: Pubkey,
    pub evidence_uri: String,
    pub status: VerificationStatus,
    pub created_at: i64,
    pub bump: u8,
}

impl FoundReport {
    pub const LEN: usize = 8 + 32 + 32 + 4 + MAX_URI_LEN + 1 + 8 + 1;
}

#[account]
pub struct FoundPost {
    pub config: Pubkey,
    pub finder: Pubkey,
    pub post_id: u64,
    pub status: ClaimStatus,
    pub created_at: i64,
    pub updated_at: i64,
    pub title: String,
    pub description: String,
    pub attributes: String,
    pub photo_ref: String,
    pub active_claim: Pubkey,
    pub bump: u8,
}

impl FoundPost {
    pub const LEN: usize = 8
        + 32
        + 32
        + 8
        + 1
        + 8
        + 8
        + 4 + MAX_TITLE_LEN
        + 4 + MAX_DESC_LEN
        + 4 + MAX_ATTR_LEN
        + 4 + MAX_URI_LEN
        + 32
        + 1;
}

#[account]
pub struct ClaimTicket {
    pub found_post: Pubkey,
    pub claimer: Pubkey,
    pub notes: String,
    pub status: VerificationStatus,
    pub deposit_lamports: u64,
    pub created_at: i64,
    pub bump: u8,
}

impl ClaimTicket {
    pub const LEN: usize = 8 + 32 + 32 + 4 + MAX_DESC_LEN + 1 + 8 + 8 + 1;
}

#[error_code]
pub enum FindAreError {
    #[msg("Reward too small")]
    RewardTooSmall,
    #[msg("Claim deposit too small")]
    ClaimDepositTooSmall,
    #[msg("Lost post not open for this action")]
    LostPostNotOpen,
    #[msg("You are not authorized to perform this action")]
    Unauthorized,
    #[msg("Report already processed")]
    ReportAlreadyProcessed,
    #[msg("Claim already processed")]
    ClaimAlreadyProcessed,
    #[msg("Claim not allowed in current state")]
    ClaimNotAllowed,
    #[msg("Input field is empty")]
    EmptyField,
    #[msg("Input field exceeds allowed length")]
    FieldTooLong,
    #[msg("Outstanding reward remains in escrow")]
    OutstandingReward,
    #[msg("Insufficient lamports in escrow account")]
    InsufficientEscrow,
}
