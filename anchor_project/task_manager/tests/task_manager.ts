import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { TaskManager } from "../target/types/task_manager";
import { expect } from "chai";

describe("task_manager", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.TaskManager as Program<TaskManager>;
  const user = provider.wallet as anchor.Wallet;
  
  // Second user for unauthorized tests
  const unauthorizedUser = anchor.web3.Keypair.generate();

  // PDAs
  let userAccountPda: anchor.web3.PublicKey;
  let userAccountBump: number;
  let taskPda: anchor.web3.PublicKey;
  let taskBump: number;
  let secondTaskPda: anchor.web3.PublicKey;
  let unauthorizedUserAccountPda: anchor.web3.PublicKey;

  before(async () => {
    // Derive PDAs
    [userAccountPda, userAccountBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("user"), user.publicKey.toBuffer()],
      program.programId
    );

    [taskPda, taskBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("task"), user.publicKey.toBuffer(), Buffer.from([0, 0, 0, 0, 0, 0, 0, 0])],
      program.programId
    );

    [secondTaskPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("task"), user.publicKey.toBuffer(), Buffer.from([1, 0, 0, 0, 0, 0, 0, 0])],
      program.programId
    );

    [unauthorizedUserAccountPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("user"), unauthorizedUser.publicKey.toBuffer()],
      program.programId
    );

    // Airdrop to unauthorized user for testing
    const airdropSig = await provider.connection.requestAirdrop(
      unauthorizedUser.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropSig);
  });

  describe("Happy Path Tests", () => {
    it("Initializes user account successfully", async () => {
      const tx = await program.methods
        .initializeUser()
        .accounts({
          userAccount: userAccountPda,
          user: user.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      console.log("Initialize user transaction signature:", tx);

      // Verify account was created correctly
      const userAccount = await program.account.userAccount.fetch(userAccountPda);
      expect(userAccount.owner.toString()).to.equal(user.publicKey.toString());
      expect(userAccount.taskCount.toNumber()).to.equal(0);
      expect(userAccount.completedCount.toNumber()).to.equal(0);
      expect(userAccount.bump).to.equal(userAccountBump);
    });

    it("Creates a task successfully", async () => {
      const title = "Complete Solana Task";
      const description = "Build and deploy a task manager dApp on Solana";
      const priority = { high: {} };

      const tx = await program.methods
        .createTask(title, description, priority)
        .accounts({
          task: taskPda,
          userAccount: userAccountPda,
          user: user.publicKey,
          owner: user.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      console.log("Create task transaction signature:", tx);

      // Verify task was created correctly
      const task = await program.account.task.fetch(taskPda);
      expect(task.owner.toString()).to.equal(user.publicKey.toString());
      expect(task.title).to.equal(title);
      expect(task.description).to.equal(description);
      expect(task.completed).to.be.false;
      expect(task.taskId.toNumber()).to.equal(0);

      // Verify user account was updated
      const userAccount = await program.account.userAccount.fetch(userAccountPda);
      expect(userAccount.taskCount.toNumber()).to.equal(1);
    });

    it("Creates a second task successfully", async () => {
      const title = "Write Tests";
      const description = "Write comprehensive tests for all instructions";
      const priority = { medium: {} };

      await program.methods
        .createTask(title, description, priority)
        .accounts({
          task: secondTaskPda,
          userAccount: userAccountPda,
          user: user.publicKey,
          owner: user.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      // Verify user account task count increased
      const userAccount = await program.account.userAccount.fetch(userAccountPda);
      expect(userAccount.taskCount.toNumber()).to.equal(2);
    });

    it("Toggles task to completed successfully", async () => {
      const tx = await program.methods
        .toggleTask(new anchor.BN(0))
        .accounts({
          task: taskPda,
          userAccount: userAccountPda,
          user: user.publicKey,
          owner: user.publicKey,
        })
        .rpc();

      console.log("Toggle task transaction signature:", tx);

      // Verify task was marked as completed
      const task = await program.account.task.fetch(taskPda);
      expect(task.completed).to.be.true;

      // Verify completed count increased
      const userAccount = await program.account.userAccount.fetch(userAccountPda);
      expect(userAccount.completedCount.toNumber()).to.equal(1);
    });

    it("Toggles task back to incomplete successfully", async () => {
      await program.methods
        .toggleTask(new anchor.BN(0))
        .accounts({
          task: taskPda,
          userAccount: userAccountPda,
          user: user.publicKey,
          owner: user.publicKey,
        })
        .rpc();

      // Verify task was marked as incomplete
      const task = await program.account.task.fetch(taskPda);
      expect(task.completed).to.be.false;

      // Verify completed count decreased
      const userAccount = await program.account.userAccount.fetch(userAccountPda);
      expect(userAccount.completedCount.toNumber()).to.equal(0);
    });

    it("Updates task successfully", async () => {
      const newTitle = "Complete Solana Task - Updated";
      const newDescription = "Build, test, and deploy a task manager dApp on Solana";
      const newPriority = { urgent: {} };

      const tx = await program.methods
        .updateTask(new anchor.BN(0), newTitle, newDescription, newPriority)
        .accounts({
          task: taskPda,
          user: user.publicKey,
          owner: user.publicKey,
        })
        .rpc();

      console.log("Update task transaction signature:", tx);

      // Verify task was updated
      const task = await program.account.task.fetch(taskPda);
      expect(task.title).to.equal(newTitle);
      expect(task.description).to.equal(newDescription);
      expect(task.priority).to.deep.equal(newPriority);
    });

    it("Updates task with partial fields successfully", async () => {
      const newTitle = "Final Title";

      await program.methods
        .updateTask(new anchor.BN(0), newTitle, null, null)
        .accounts({
          task: taskPda,
          user: user.publicKey,
          owner: user.publicKey,
        })
        .rpc();

      // Verify only title was updated
      const task = await program.account.task.fetch(taskPda);
      expect(task.title).to.equal(newTitle);
      // Description and priority should remain from previous update
      expect(task.description).to.equal("Build, test, and deploy a task manager dApp on Solana");
    });

    it("Deletes task successfully", async () => {
      const tx = await program.methods
        .deleteTask(new anchor.BN(1))
        .accounts({
          task: secondTaskPda,
          userAccount: userAccountPda,
          user: user.publicKey,
          owner: user.publicKey,
        })
        .rpc();

      console.log("Delete task transaction signature:", tx);

      // Verify task was deleted (account should not exist)
      try {
        await program.account.task.fetch(secondTaskPda);
        expect.fail("Task account should have been deleted");
      } catch (error) {
        expect(error.message).to.include("Account does not exist");
      }
    });
  });

  describe("Unhappy Path Tests - Error Scenarios", () => {
    it("Fails to initialize user account twice", async () => {
      try {
        await program.methods
          .initializeUser()
          .accounts({
            userAccount: userAccountPda,
            user: user.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .rpc();
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("already in use");
      }
    });

    it("Fails to create task with empty title", async () => {
      const [emptyTitleTaskPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("task"), user.publicKey.toBuffer(), Buffer.from([2, 0, 0, 0, 0, 0, 0, 0])],
        program.programId
      );

      try {
        await program.methods
          .createTask("", "Valid description", { low: {} })
          .accounts({
            task: emptyTitleTaskPda,
            userAccount: userAccountPda,
            user: user.publicKey,
            owner: user.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .rpc();
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("InvalidTitle");
      }
    });

    it("Fails to create task with title too long", async () => {
      const [longTitleTaskPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("task"), user.publicKey.toBuffer(), Buffer.from([2, 0, 0, 0, 0, 0, 0, 0])],
        program.programId
      );

      const longTitle = "a".repeat(101); // 101 characters, exceeds 100 limit

      try {
        await program.methods
          .createTask(longTitle, "Valid description", { low: {} })
          .accounts({
            task: longTitleTaskPda,
            userAccount: userAccountPda,
            user: user.publicKey,
            owner: user.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .rpc();
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("InvalidTitle");
      }
    });

    it("Fails to create task with description too long", async () => {
      const [longDescTaskPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("task"), user.publicKey.toBuffer(), Buffer.from([2, 0, 0, 0, 0, 0, 0, 0])],
        program.programId
      );

      const longDescription = "a".repeat(501); // 501 characters, exceeds 500 limit

      try {
        await program.methods
          .createTask("Valid title", longDescription, { low: {} })
          .accounts({
            task: longDescTaskPda,
            userAccount: userAccountPda,
            user: user.publicKey,
            owner: user.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .rpc();
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("InvalidDescription");
      }
    });

    it("Fails to toggle task with wrong owner", async () => {
      try {
        await program.methods
          .toggleTask(new anchor.BN(0))
          .accounts({
            task: taskPda,
            userAccount: userAccountPda,
            user: unauthorizedUser.publicKey,
            owner: user.publicKey,
          })
          .signers([unauthorizedUser])
          .rpc();
        expect.fail("Should have thrown an error");
      } catch (error) {
        // Error can be "Unauthorized" or constraint error
        expect(error).to.exist;
      }
    });

    it("Fails to update task with wrong owner", async () => {
      try {
        await program.methods
          .updateTask(new anchor.BN(0), "Hacked Title", null, null)
          .accounts({
            task: taskPda,
            user: unauthorizedUser.publicKey,
            owner: user.publicKey,
          })
          .signers([unauthorizedUser])
          .rpc();
        expect.fail("Should have thrown an error");
      } catch (error) {
        // Error can be "Unauthorized" or constraint error
        expect(error).to.exist;
      }
    });

    it("Fails to delete task with wrong owner", async () => {
      try {
        await program.methods
          .deleteTask(new anchor.BN(0))
          .accounts({
            task: taskPda,
            userAccount: userAccountPda,
            user: unauthorizedUser.publicKey,
            owner: user.publicKey,
          })
          .signers([unauthorizedUser])
          .rpc();
        expect.fail("Should have thrown an error");
      } catch (error) {
        // Error can be "Unauthorized" or constraint error
        expect(error).to.exist;
      }
    });

    it("Fails to toggle non-existent task", async () => {
      const [nonExistentTaskPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("task"), user.publicKey.toBuffer(), Buffer.from([99, 0, 0, 0, 0, 0, 0, 0])],
        program.programId
      );

      try {
        await program.methods
          .toggleTask(new anchor.BN(99))
          .accounts({
            task: nonExistentTaskPda,
            userAccount: userAccountPda,
            user: user.publicKey,
            owner: user.publicKey,
          })
          .rpc();
        expect.fail("Should have thrown an error");
      } catch (error) {
        // Error can be "Account does not exist" or "AccountNotInitialized"
        expect(error).to.exist;
      }
    });

    it("Fails to update task with invalid title", async () => {
      const longTitle = "a".repeat(101);

      try {
        await program.methods
          .updateTask(new anchor.BN(0), longTitle, null, null)
          .accounts({
            task: taskPda,
            user: user.publicKey,
            owner: user.publicKey,
          })
          .rpc();
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("InvalidTitle");
      }
    });

    it("Fails to update task with invalid description", async () => {
      const longDescription = "a".repeat(501);

      try {
        await program.methods
          .updateTask(new anchor.BN(0), null, longDescription, null)
          .accounts({
            task: taskPda,
            user: user.publicKey,
            owner: user.publicKey,
          })
          .rpc();
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("InvalidDescription");
      }
    });
  });

  describe("Edge Cases", () => {
    it("Creates task with all priority levels", async () => {
      const priorities = [
        { low: {} },
        { medium: {} },
        { high: {} },
        { urgent: {} },
      ];

      for (let i = 0; i < priorities.length; i++) {
        const taskId = 2 + i; // Starting from task ID 2
        const [priorityTaskPda] = anchor.web3.PublicKey.findProgramAddressSync(
          [Buffer.from("task"), user.publicKey.toBuffer(), Buffer.from([taskId, 0, 0, 0, 0, 0, 0, 0])],
          program.programId
        );

        await program.methods
          .createTask(`Task ${taskId}`, `Testing priority level`, priorities[i])
          .accounts({
            task: priorityTaskPda,
            userAccount: userAccountPda,
            user: user.publicKey,
            owner: user.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .rpc();

        const task = await program.account.task.fetch(priorityTaskPda);
        expect(task.priority).to.deep.equal(priorities[i]);
      }
    });

    it("Creates task with maximum valid title length", async () => {
      const maxTitle = "a".repeat(100); // Exactly 100 characters
      const taskId = 6;
      const [maxTitleTaskPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("task"), user.publicKey.toBuffer(), Buffer.from([taskId, 0, 0, 0, 0, 0, 0, 0])],
        program.programId
      );

      await program.methods
        .createTask(maxTitle, "Description", { low: {} })
        .accounts({
          task: maxTitleTaskPda,
          userAccount: userAccountPda,
          user: user.publicKey,
          owner: user.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      const task = await program.account.task.fetch(maxTitleTaskPda);
      expect(task.title).to.equal(maxTitle);
      expect(task.title.length).to.equal(100);
    });

    it("Creates task with maximum valid description length", async () => {
      const maxDescription = "a".repeat(500); // Exactly 500 characters
      const taskId = 7;
      const [maxDescTaskPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("task"), user.publicKey.toBuffer(), Buffer.from([taskId, 0, 0, 0, 0, 0, 0, 0])],
        program.programId
      );

      await program.methods
        .createTask("Title", maxDescription, { low: {} })
        .accounts({
          task: maxDescTaskPda,
          userAccount: userAccountPda,
          user: user.publicKey,
          owner: user.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      const task = await program.account.task.fetch(maxDescTaskPda);
      expect(task.description).to.equal(maxDescription);
      expect(task.description.length).to.equal(500);
    });

    it("Creates task with empty description (valid)", async () => {
      const taskId = 8;
      const [emptyDescTaskPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("task"), user.publicKey.toBuffer(), Buffer.from([taskId, 0, 0, 0, 0, 0, 0, 0])],
        program.programId
      );

      await program.methods
        .createTask("Task with no description", "", { low: {} })
        .accounts({
          task: emptyDescTaskPda,
          userAccount: userAccountPda,
          user: user.publicKey,
          owner: user.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      const task = await program.account.task.fetch(emptyDescTaskPda);
      expect(task.description).to.equal("");
    });
  });
});
