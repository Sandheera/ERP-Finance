const BankReconciliation = require("../models/BankReconciliation");
const Journal = require("../models/journal.model");

class ReconciliationService {
  // Create a new bank reconciliation for a period
  async createReconciliation(data, userId) {
    try {
      const reconciliation = new BankReconciliation({
        period: data.period,
        bankStatement: {
          date: data.bankDate,
          balance: data.bankBalance,
          fileName: data.bankFileName
        },
        bookBalance: data.bookBalance,
        status: "DRAFT",
        reconciliationNotes: data.notes || ""
      });

      await reconciliation.save();
      return { success: true, reconciliation };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get reconciliation for a period
  async getReconciliation(period) {
    try {
      const reconciliation = await BankReconciliation.findOne({ period })
        .populate("discrepancies.journalEntryId")
        .populate("submittedBy", "username")
        .populate("approvedBy", "username")
        .populate("attachments");

      if (!reconciliation) {
        return { success: false, error: "No reconciliation found for this period" };
      }

      return { success: true, reconciliation };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get all draft reconciliations
  async getDraftReconciliations() {
    try {
      const reconciliations = await BankReconciliation.find({ status: "DRAFT" })
        .sort({ createdAt: -1 })
        .lean();

      return { success: true, reconciliations };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Add a discrepancy to reconciliation
  async addDiscrepancy(reconciliationId, discrepancyData) {
    try {
      const reconciliation = await BankReconciliation.findById(reconciliationId);

      if (!reconciliation) {
        return { success: false, error: "Reconciliation not found" };
      }

      if (reconciliation.status !== "DRAFT") {
        return { success: false, error: "Can only add discrepancies to draft reconciliations" };
      }

      const newDiscrepancy = {
        type: discrepancyData.type,
        description: discrepancyData.description,
        amount: discrepancyData.amount,
        journalEntryId: discrepancyData.journalEntryId || null
      };

      reconciliation.discrepancies.push(newDiscrepancy);
      await reconciliation.save();

      return { success: true, message: "Discrepancy added", reconciliation };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Resolve a discrepancy
  async resolveDiscrepancy(reconciliationId, discrepancyId, journalEntryId = null) {
    try {
      const reconciliation = await BankReconciliation.findById(reconciliationId);

      if (!reconciliation) {
        return { success: false, error: "Reconciliation not found" };
      }

      const discrepancy = reconciliation.discrepancies.id(discrepancyId);

      if (!discrepancy) {
        return { success: false, error: "Discrepancy not found" };
      }

      discrepancy.resolvedAt = new Date();
      if (journalEntryId) {
        discrepancy.journalEntryId = journalEntryId;
      }

      await reconciliation.save();

      return { success: true, message: "Discrepancy resolved", reconciliation };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Calculate reconciliation status
  async calculateReconciliationStatus(reconciliationId) {
    try {
      const reconciliation = await BankReconciliation.findById(reconciliationId);

      if (!reconciliation) {
        return { success: false, error: "Reconciliation not found" };
      }

      const unresolvedDiscrepancies = reconciliation.discrepancies.filter(
        d => !d.resolvedAt
      );

      const status = {
        bankBalance: reconciliation.bankStatement.balance,
        bookBalance: reconciliation.bookBalance,
        difference: reconciliation.bankStatement.balance - reconciliation.bookBalance,
        unresolvedCount: unresolvedDiscrepancies.length,
        totalDiscrepancies: reconciliation.discrepancies.length,
        isReconciled: unresolvedDiscrepancies.length === 0
      };

      return { success: true, status };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Submit reconciliation for approval
  async submitReconciliation(reconciliationId, userId) {
    try {
      const reconciliation = await BankReconciliation.findById(reconciliationId);

      if (!reconciliation) {
        return { success: false, error: "Reconciliation not found" };
      }

      if (reconciliation.status !== "DRAFT") {
        return { success: false, error: "Only draft reconciliations can be submitted" };
      }

      // Check if reconciled
      const unresolvedDiscrepancies = reconciliation.discrepancies.filter(
        d => !d.resolvedAt
      );

      if (unresolvedDiscrepancies.length > 0) {
        return {
          success: false,
          error: `Cannot submit: ${unresolvedDiscrepancies.length} unresolved discrepancies`
        };
      }

      reconciliation.status = "SUBMITTED";
      reconciliation.submittedBy = userId;
      reconciliation.submittedAt = new Date();

      await reconciliation.save();

      return { success: true, message: "Reconciliation submitted for approval", reconciliation };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Update reconciliation book balance
  async updateBookBalance(reconciliationId, newBalance) {
    try {
      const reconciliation = await BankReconciliation.findById(reconciliationId);

      if (!reconciliation) {
        return { success: false, error: "Reconciliation not found" };
      }

      if (reconciliation.status !== "DRAFT") {
        return { success: false, error: "Can only update balance for draft reconciliations" };
      }

      reconciliation.bookBalance = newBalance;
      await reconciliation.save();

      return { success: true, reconciliation };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = new ReconciliationService();
