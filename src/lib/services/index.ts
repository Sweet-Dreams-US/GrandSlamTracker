// Client services
export {
  getClientsWithMetrics,
  getClientById,
  getClientWithDetails,
  createClient,
  updateClient,
  deleteClient,
  type ClientWithMetrics,
} from './clientService'

// Alert services
export {
  getAlerts,
  acknowledgeAlert,
  createAlert,
  deleteAlert,
  getAlertSummary,
} from './alertService'

// Revenue services
export {
  getRevenueHistory,
  getTrailingRevenue,
  calculateBaseline,
  saveMonthlyRevenue,
  getFeeStructure,
  saveFeeStructure,
  getFinancialSummary,
} from './revenueService'

// Lead services
export {
  getLeads,
  getLeadStats,
  createLead,
  updateLead,
  deleteLead,
  markLeadAsWon,
  markLeadAsLost,
} from './leadService'
