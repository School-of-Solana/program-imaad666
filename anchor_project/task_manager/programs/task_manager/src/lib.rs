use anchor_lang::prelude::*;

declare_id!("13AyfsUmh9iow5qF83SV5hv9imBdAFFgvSbjdBQUceuk");

#[program]
pub mod task_manager {
    use super::*;

    pub fn initialize_user(ctx: Context<InitializeUser>) -> Result<()> {
        let user_account = &mut ctx.accounts.user_account;
        user_account.owner = ctx.accounts.user.key();
        user_account.task_count = 0;
        user_account.completed_count = 0;
        user_account.bump = ctx.bumps.user_account;
        
        msg!("User account initialized for: {}", ctx.accounts.user.key());
        Ok(())
    }

    pub fn create_task(
        ctx: Context<CreateTask>,
        title: String,
        description: String,
        priority: Priority,
    ) -> Result<()> {
        require!(title.len() > 0 && title.len() <= 100, TaskError::InvalidTitle);
        require!(description.len() <= 500, TaskError::InvalidDescription);

        let task = &mut ctx.accounts.task;
        let user_account = &mut ctx.accounts.user_account;
        
        task.owner = ctx.accounts.user.key();
        task.title = title;
        task.description = description;
        task.priority = priority;
        task.completed = false;
        task.created_at = Clock::get()?.unix_timestamp;
        task.task_id = user_account.task_count;
        task.bump = ctx.bumps.task;

        user_account.task_count += 1;

        msg!("Task created: {} (ID: {})", task.title, task.task_id);
        Ok(())
    }

    pub fn toggle_task(ctx: Context<ToggleTask>, _task_id: u64) -> Result<()> {
        let task = &mut ctx.accounts.task;
        let user_account = &mut ctx.accounts.user_account;
        
        task.completed = !task.completed;
        
        if task.completed {
            user_account.completed_count += 1;
            msg!("Task marked as completed: {}", task.title);
        } else {
            user_account.completed_count = user_account.completed_count.saturating_sub(1);
            msg!("Task marked as incomplete: {}", task.title);
        }
        
        Ok(())
    }

    pub fn update_task(
        ctx: Context<UpdateTask>,
        _task_id: u64,
        title: Option<String>,
        description: Option<String>,
        priority: Option<Priority>,
    ) -> Result<()> {
        let task = &mut ctx.accounts.task;

        if let Some(new_title) = title {
            require!(new_title.len() > 0 && new_title.len() <= 100, TaskError::InvalidTitle);
            task.title = new_title;
        }

        if let Some(new_description) = description {
            require!(new_description.len() <= 500, TaskError::InvalidDescription);
            task.description = new_description;
        }

        if let Some(new_priority) = priority {
            task.priority = new_priority;
        }

        msg!("Task updated: {}", task.title);
        Ok(())
    }

    pub fn delete_task(ctx: Context<DeleteTask>, _task_id: u64) -> Result<()> {
        let task = &ctx.accounts.task;
        let user_account = &mut ctx.accounts.user_account;

        if task.completed {
            user_account.completed_count = user_account.completed_count.saturating_sub(1);
        }

        msg!("Task deleted: {}", task.title);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeUser<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + UserAccount::INIT_SPACE,
        seeds = [b"user", user.key().as_ref()],
        bump
    )]
    pub user_account: Account<'info, UserAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateTask<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + Task::INIT_SPACE,
        seeds = [b"task", user.key().as_ref(), &user_account.task_count.to_le_bytes()],
        bump
    )]
    pub task: Account<'info, Task>,
    #[account(
        mut,
        seeds = [b"user", user.key().as_ref()],
        bump = user_account.bump,
        has_one = owner @ TaskError::Unauthorized
    )]
    pub user_account: Account<'info, UserAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    /// CHECK: This is the owner of the user account
    pub owner: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(task_id: u64)]
pub struct ToggleTask<'info> {
    #[account(
        mut,
        seeds = [b"task", user.key().as_ref(), &task_id.to_le_bytes()],
        bump = task.bump,
        has_one = owner @ TaskError::Unauthorized
    )]
    pub task: Account<'info, Task>,
    #[account(
        mut,
        seeds = [b"user", user.key().as_ref()],
        bump = user_account.bump,
        has_one = owner @ TaskError::Unauthorized
    )]
    pub user_account: Account<'info, UserAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    /// CHECK: This is the owner of the task
    pub owner: AccountInfo<'info>,
}

#[derive(Accounts)]
#[instruction(task_id: u64)]
pub struct UpdateTask<'info> {
    #[account(
        mut,
        seeds = [b"task", user.key().as_ref(), &task_id.to_le_bytes()],
        bump = task.bump,
        has_one = owner @ TaskError::Unauthorized
    )]
    pub task: Account<'info, Task>,
    #[account(mut)]
    pub user: Signer<'info>,
    /// CHECK: This is the owner of the task
    pub owner: AccountInfo<'info>,
}

#[derive(Accounts)]
#[instruction(task_id: u64)]
pub struct DeleteTask<'info> {
    #[account(
        mut,
        seeds = [b"task", user.key().as_ref(), &task_id.to_le_bytes()],
        bump = task.bump,
        has_one = owner @ TaskError::Unauthorized,
        close = user
    )]
    pub task: Account<'info, Task>,
    #[account(
        mut,
        seeds = [b"user", user.key().as_ref()],
        bump = user_account.bump,
        has_one = owner @ TaskError::Unauthorized
    )]
    pub user_account: Account<'info, UserAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    /// CHECK: This is the owner of the task
    pub owner: AccountInfo<'info>,
}

#[account]
#[derive(InitSpace)]
pub struct UserAccount {
    pub owner: Pubkey,
    pub task_count: u64,
    pub completed_count: u64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Task {
    pub owner: Pubkey,
    #[max_len(100)]
    pub title: String,
    #[max_len(500)]
    pub description: String,
    pub priority: Priority,
    pub completed: bool,
    pub created_at: i64,
    pub task_id: u64,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum Priority {
    Low,
    Medium,
    High,
    Urgent,
}

#[error_code]
pub enum TaskError {
    #[msg("You are not authorized to perform this action")]
    Unauthorized,
    #[msg("Title must be between 1 and 100 characters")]
    InvalidTitle,
    #[msg("Description must be 500 characters or less")]
    InvalidDescription,
}
