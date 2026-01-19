const Journal = require("../models/journal.model");
const DocumentAttachment = require("../models/DocumentAttachment");

class JournalService {
  // Create a draft journal entry
  async createDraftEntry(data, userId) {
    try {
      const entry = new Journal({
        description: data.description,
        lines: data.lines || [],
        period: data.period,
        account: data.account,
        debit: data.debit || 0,
        credit: data.credit || 0,
        status: "DRAFT",
        comments: data.comments || ""
      });

      await entry.save();
      return { success: true, entry };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get all draft entries for an accountant
  async getDraftEntries(userId, period = null) {
    try {
      const filter = {
        status: "DRAFT",
        submittedBy: userId
      };

      if (period) {
        filter.period = period;
      }

      const entries = await Journal.find(filter)
        .populate("attachments")
        .populate("submittedBy", "username")
        .sort({ createdAt: -1 })
        .lean();

      return { success: true, entries };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get submitted entries awaiting approval
  async getSubmittedEntries(period = null) {
    try {
      const filter = { status: "SUBMITTED" };

      if (period) {
        filter.period = period;
      }

      const entries = await Journal.find(filter)
        .populate("attachments")
        .populate("submittedBy", "username")
        .populate("invoiceId", "type partner amount")
        .sort({ submittedAt: -1 })
        .lean();

      return { success: true, entries };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Submit journal entry for approval
  async submitEntry(entryId, userId) {
    try {
      const entry = await Journal.findById(entryId);

      if (!entry) {
        return { success: false, error: "Journal entry not found" };
      }

      if (entry.status !== "DRAFT") {
        return { success: false, error: "Only draft entries can be submitted" };
      }

      // Validate debit/credit balance
      if (!this.validateBalance(entry)) {
        return { success: false, error: "Debit and credit amounts don't balance" };
      }

      entry.status = "SUBMITTED";
      entry.submittedBy = userId;
      entry.submittedAt = new Date();

      await entry.save();

      return { success: true, message: "Entry submitted for approval", entry };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Update draft entry
  async updateDraftEntry(entryId, data, userId) {
    try {
      const entry = await Journal.findById(entryId);

      if (!entry) {
        return { success: false, error: "Journal entry not found" };
      }

      if (entry.status !== "DRAFT") {
        return { success: false, error: "Only draft entries can be updated" };
      }

      // Update fields
      Object.assign(entry, {
        description: data.description || entry.description,
        lines: data.lines || entry.lines,
        account: data.account || entry.account,
        debit: data.debit !== undefined ? data.debit : entry.debit,
        credit: data.credit !== undefined ? data.credit : entry.credit,
        period: data.period || entry.period,
        comments: data.comments || entry.comments
      });

      await entry.save();

      return { success: true, entry };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Validate if entry balances (for multi-line entries)
  validateBalance(entry) {
    if (entry.lines && entry.lines.length > 0) {
      const totalDebit = entry.lines.reduce((sum, line) => sum + (line.debit || 0), 0);
      const totalCredit = entry.lines.reduce((sum, line) => sum + (line.credit || 0), 0);
      return Math.abs(totalDebit - totalCredit) < 0.01; // Allow for floating point errors
    }

    // For single-line entries
    return Math.abs((entry.debit || 0) - (entry.credit || 0)) < 0.01;
  }

  // Attach document to journal entry
  async attachDocument(entryId, attachmentId) {
    try {
      const entry = await Journal.findById(entryId);

      if (!entry) {
        return { success: false, error: "Journal entry not found" };
      }

      if (!entry.attachments.includes(attachmentId)) {
        entry.attachments.push(attachmentId);
        await entry.save();
      }

      return { success: true, entry };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get all entries by accountant
  async getAccountantEntries(userId, status = null) {
    try {
      const filter = {};

      if (status) {
        filter.status = status;
      }

      const entries = await Journal.find(filter)
        .populate("attachments")
        .populate("submittedBy", "username")
        .sort({ createdAt: -1 })
        .lean();

      return { success: true, entries };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = new JournalService();
