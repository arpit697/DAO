const { expect } = require("chai");
require("solidity-coverage");

describe("Dao Contract", function () {
  function timeout(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  beforeEach(async () => {
    [addr1, addr2, addr3, addr4, ...addrs] = await ethers.getSigners();
    DAO = await ethers.getContractFactory("DAO");
    dao = await DAO.deploy(
      [addr1.address, addr2.address, addr3.address],
      200,
      400
    );
  });
  describe("Deployment", () => {
    it("should expected ammount of tokens are distributed to expected accounts", async () => {
      expect(await dao.balanceOf(addr1.address)).to.be.equal(200);
      expect(await dao.balanceOf(addr2.address)).to.be.equal(200);
      expect(await dao.balanceOf(addr3.address)).to.be.equal(200);
    });
  });

  describe("Submit Proposal", () => {
    it("Should Submit Proposal", async () => {
      await dao.submitProposal(2000, addr4.address, 20);
      let prop = await dao.proposals(0);
      expect(prop.requiredAmount).to.be.equal(2000);
      expect(prop.accountNumber).to.be.equal(addr4.address);
      expect(prop.voteCount).to.be.equal(0);
      expect(prop.executed).to.be.equal(false);
    });
  });

  describe("Confirm Proposal", () => {
    it("should vote count increase after confirm the proposal", async () => {
      await dao.submitProposal(2000, addr4.address, 20);
      await dao.confirmProposal(0);
      expect((await dao.proposals(0)).voteCount).to.be.equal(
        await dao.balanceOf(addr1.address)
      );
    });

    it("should confirm proposal with multivle token holders and met required vote criteria and execute successfully", async () => {
      await dao.submitProposal(2000, addr4.address, 20);
      await dao.confirmProposal(0);
      await dao.connect(addr2).confirmProposal(0);
      expect((await dao.proposals(0)).voteCount).to.be.equal(
        await dao.voteRequired()
      );
      await dao.executeProposal(0);
      expect((await dao.proposals(0)).executed).to.be.equal(
        true
      );
    });
  });

  describe("Confirm Proposal failing Test Cases", () => {
    it("should non token holder confirm the proposal", async () => {
      await dao.submitProposal(2000, addr4.address, 20);
      await dao.getAccountBalance(addr4.address);
      await expect(dao.connect(addr4).confirmProposal(0)).to.be.revertedWith(
        "not a token holder"
      );
    });
    it("should confirm proposal if it dose't exist", async () => {
      await expect(dao.confirmProposal(0)).to.be.revertedWith(
        "proposal does not exists"
      );
    });
    it("should confirm proposal if it's already executed", async () => {
      await dao.submitProposal(2000, addr4.address, 20);
      await dao.confirmProposal(0);
      await dao.connect(addr2).confirmProposal(0);
      await dao.executeProposal(0);
      await expect(dao.connect(addr3).confirmProposal(0)).to.be.revertedWith(
        "proposal already executed"
      );
    });
    it("can confirm proposal twice", async () => {
      await dao.submitProposal(2000, addr4.address, 20);
      await dao.confirmProposal(0);
      await expect(dao.confirmProposal(0)).to.be.revertedWith(
        "proposal is already confirmed"
      );
    });
    it("should confirm proposal if voting time is over", async () => {
      await dao.submitProposal(2000, addr4.address, 0);
      await expect(dao.confirmProposal(0)).to.be.revertedWith(
        "voting time is over"
      );
    });
  });

  describe("execute proposal", () => {
    it("should confirm proposal", async () => {
      await dao.submitProposal(2000, addr4.address, 20);
      await dao.confirmProposal(0);
      await dao.connect(addr2).confirmProposal(0);
      await dao.executeProposal(0);
      expect((await dao.proposals(0)).executed).to.be.equal(true);
    });
  });

  describe("execute proposal failing test cases", () => {
    it("should non token holder execute the proposal", async () => {
      await dao.submitProposal(2000, addr4.address, 20);
      await dao.confirmProposal(0);
      await dao.connect(addr2).confirmProposal(0);
      await expect(dao.connect(addr4).executeProposal(0)).to.be.revertedWith(
        "not a token holder"
      );
    });
    it("should execute proposal if it's not exists", async () => {
      await expect(dao.executeProposal(0)).to.be.revertedWith(
        "proposal does not exists"
      );
    });
    it("should execute proposal if it's already executed", async () => {
      await dao.submitProposal(2000, addr4.address, 20);
      await dao.confirmProposal(0);
      await dao.connect(addr2).confirmProposal(0);
      await dao.executeProposal(0);
      await expect(dao.connect(addr3).executeProposal(0)).to.be.revertedWith(
        "proposal already executed"
      );
    });
    it("should execute proposal if proposal did not have sufficient votes", async () => {
      await dao.submitProposal(2000, addr4.address, 20);
      await dao.confirmProposal(0);
      await expect(dao.connect(addr3).executeProposal(0)).to.be.revertedWith(
        "votes are not sufficient.."
      );
    });
  });

  describe("revoke confirmation", () => {
    it("should revoke confirmation", async () => {
      await dao.submitProposal(2000, addr4.address, 20);
      await dao.confirmProposal(0);
      await dao.connect(addr3).confirmProposal(0);
      await dao.revokeConfirmation(0);
      expect((await dao.proposals(0)).voteCount).to.be.equal(
        await dao.addConfirmWith(0)
      );
    });
  });

  describe("revoke confirmation failing test condition", () => {
    it("should non token holder revoke confirmation", async () => {
      await dao.submitProposal(2000, addr4.address, 20);
      await dao.confirmProposal(0);
      await dao.connect(addr3).confirmProposal(0);
      await expect(dao.connect(addr4).revokeConfirmation(0)).to.be.revertedWith(
        "not a token holder"
      );
    });
    it("should revoke confirmation if proposal does not exist", async () => {
      await expect(dao.revokeConfirmation(0)).to.be.revertedWith(
        "proposal does not exists"
      );
    });
    it("should revoke confirmation if proposal is executed", async () => {
      await dao.submitProposal(2000, addr4.address, 20);
      await dao.confirmProposal(0);
      await dao.connect(addr2).confirmProposal(0);
      await dao.executeProposal(0);
      await expect(dao.revokeConfirmation(0)).to.be.revertedWith(
        "proposal already executed"
      );
    });

    it("should revoke confirmatin if voting time is over", async () => {
      await dao.submitProposal(2000, addr4.address, 3);
      await dao.confirmProposal(0);
      await dao.connect(addr2).confirmProposal(0);
      await timeout(3000);
      await expect(dao.revokeConfirmation(0)).to.be.revertedWith(
        "voting time is over"
      );
    });
    it("should revoke confirmation if it's not confirmed yet", async () => {
      await dao.submitProposal(2000, addr4.address, 3);
      await dao.confirmProposal(0);
      await expect(dao.connect(addr2).revokeConfirmation(0)).to.be.revertedWith(
        "proposal is not confirmed"
      );
    });
  });

  describe("receive", () => {
    it("Check Treasury Funds", async () => {
      await dao.fallback({ value: 5000 });
      expect(await dao.fallback({ value: 5000 }).toString).to.be.equal(
        await dao.getContractBalance().toString
      );
    });
  });

  describe("Fund Transfer", () => {
    it("Should Transfer Proposal after proposal is passed", async () => {
      await dao.fallback({ value: 5000 });
      await dao.submitProposal(2000, addr4.address, 20);
      await dao.confirmProposal(0);
      await dao.connect(addr2).confirmProposal(0);
      await dao.executeProposal(0);
      let conBalBeforTx = await dao.getContractBalance();
      await dao.fundTransfer(0);
      let conBalAfterTx = await dao.getContractBalance();

      let prop = await dao.proposals(0);
      expect(conBalAfterTx).to.be.equal(conBalBeforTx - prop.requiredAmount);
    });
  });

  describe("Fund Transfer Failing Test Cases", () => {
    it("should transfer fund to non executed proposal", async () => {
      await dao.fallback({ value: 5000 });
      await dao.submitProposal(2000, addr4.address, 20);
      await dao.confirmProposal(0);
      await dao.connect(addr2).confirmProposal(0);
      await expect(dao.fundTransfer(0)).to.be.revertedWith(
        "proposal is not executed"
      );
    });

    it("should non token holder transfer funds", async () => {
      await dao.fallback({ value: 5000 });
      await dao.submitProposal(2000, addr4.address, 20);
      await dao.confirmProposal(0);
      await dao.connect(addr2).confirmProposal(0);
      await dao.executeProposal(0);
      await expect(dao.connect(addr4).fundTransfer(0)).to.be.revertedWith(
        "not a token holder"
      );
    });

    it("return error if address in not token holder", async () => {
      await expect(dao.connect(addr4).addConfirmWith(0)).to.be.revertedWith(
        "not a token holder"
      );
    });
  });

  describe("Transfer", () => {
    it("should confirm proposal after transfer all the tokens", async () => {
      await dao.submitProposal(2000, addr4.address, 20);
      await dao.transfer(addr4.address, 200);
      await expect(dao.confirmProposal(0)).to.be.revertedWith(
        "not a token holder"
      );
    });
  });
});
