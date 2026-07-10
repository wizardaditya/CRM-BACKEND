const dashboardService = require('../services/dashboardService');
const R = require('../utils/apiResponse');

exports.getKpis = async (req, res, next) => {
  try {
    const kpis = await dashboardService.getKpis(req.user.id, req.user.role);
    R.success(res, kpis);
  } catch (err) { next(err); }
};

exports.getMonthlyGrowth = async (req, res, next) => {
  try {
    const data = await dashboardService.getMonthlyGrowth();
    R.success(res, data);
  } catch (err) { next(err); }
};

exports.getRevenueChart = async (req, res, next) => {
  try {
    const data = await dashboardService.getRevenueChart();
    R.success(res, data);
  } catch (err) { next(err); }
};

exports.getLeadSources = async (req, res, next) => {
  try {
    const data = await dashboardService.getLeadSources();
    R.success(res, data);
  } catch (err) { next(err); }
};

exports.getPipelineSummary = async (req, res, next) => {
  try {
    const data = await dashboardService.getPipelineSummary();
    R.success(res, data);
  } catch (err) { next(err); }
};

exports.getRecentActivities = async (req, res, next) => {
  try {
    const data = await dashboardService.getRecentActivities();
    R.success(res, data);
  } catch (err) { next(err); }
};
