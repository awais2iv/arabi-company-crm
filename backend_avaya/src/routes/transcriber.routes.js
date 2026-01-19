// backend_avaya/src/routes/transcriber.routes.js
import express from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import mongoose from 'mongoose';

const router = express.Router();

/**
 * GET /api/v1/transcriber/agents
 * Get list of all unique agents with their stats
 */
router.get('/agents', verifyJWT, async (req, res) => {
  try {
    const transcribersCollection = mongoose.connection.db.collection('transcriber');
    
    // Aggregate to get unique agents with their call counts
    const agents = await transcribersCollection.aggregate([
      {
        $group: {
          _id: '$agent',
          agentName: { $first: '$agent' },
          callCount: { $sum: 1 },
          avgScore: { 
            $avg: { 
              $divide: ['$message.call_quality_metrics.call_structure.structure_score', 20] 
            } 
          }
        }
      },
      {
        $project: {
          _id: 0,
          agentName: 1,
          callCount: 1,
          avgScore: { $ifNull: ['$avgScore', 0] }
        }
      },
      {
        $sort: { callCount: -1 }
      }
    ]).toArray();

    console.log('=== TRANSCRIBER AGENTS DATA ===');
    console.log('Total agents found:', agents.length);
    console.log('Agents data:', JSON.stringify(agents, null, 2));
    console.log('================================');

    res.status(200).json(agents);
  } catch (error) {
    console.error('Error fetching agents:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch agents',
      error: error.message 
    });
  }
});

/**
 * GET /api/v1/transcriber/agent/:agentName
 * Get all call records for a specific agent
 */
router.get('/agent/:agentName', verifyJWT, async (req, res) => {
  try {
    const { agentName } = req.params;
    const transcribersCollection = mongoose.connection.db.collection('transcriber');
    
    const calls = await transcribersCollection
      .find({ agent: agentName })
      .sort({ createdAt: -1 })
      .toArray();

    console.log(`=== TRANSCRIBER CALLS FOR AGENT: ${agentName} ===`);
    console.log('Total calls found:', calls.length);
    console.log('Sample call data (first call):', calls.length > 0 ? JSON.stringify(calls[0], null, 2) : 'No calls found');
    console.log('All calls summary:', calls.map(call => ({
      agent: call.agent,
      problem: call.message?.call_summary?.problem,
      resolution: call.message?.call_summary?.resolution_status,
      highRisk: call.message?.high_risk?.is_high_risk,
      createdAt: call.createdAt
    })));
    console.log('================================================');

    res.status(200).json(calls);
  } catch (error) {
    console.error('Error fetching agent calls:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch agent calls',
      error: error.message 
    });
  }
});

/**
 * GET /api/v1/transcriber/agent/:agentName/stats
 * Get aggregated statistics for a specific agent
 */
router.get('/agent/:agentName/stats', verifyJWT, async (req, res) => {
  try {
    const { agentName } = req.params;
    const transcribersCollection = mongoose.connection.db.collection('transcriber');
    
    const stats = await transcribersCollection.aggregate([
      {
        $match: { agent: agentName }
      },
      {
        $group: {
          _id: null,
          totalCalls: { $sum: 1 },
          avgQualityScore: { 
            $avg: { 
              $divide: ['$message.call_quality_metrics.call_structure.structure_score', 20] 
            } 
          },
          avgEmpathyScore: { 
            $avg: { 
              $divide: ['$message.empathy_politeness.score', 20] 
            } 
          },
          firstCallResolutionCount: {
            $sum: {
              $cond: [
                { $in: ['$message.call_summary.resolution_status', ['resolved', 'partially_resolved']] },
                1,
                0
              ]
            }
          },
          avgComplianceScore: {
            $avg: { 
              $divide: ['$message.compliance.opening_script_score', 20]
            }
          },
          highRiskCallsCount: {
            $sum: {
              $cond: ['$message.high_risk.is_high_risk', 1, 0]
            }
          },
          salesConversionCount: {
            $sum: {
              $cond: [
                { $eq: ['$message.sales_performance.conversion_outcome', 'converted'] },
                1,
                0
              ]
            }
          },
          avgDuration: {
            $avg: '$message.key_call_details.call_duration_minutes'
          }
        }
      },
      {
        $project: {
          _id: 0,
          totalCalls: 1,
          avgQualityScore: { $ifNull: ['$avgQualityScore', 0] },
          avgEmpathyScore: { $ifNull: ['$avgEmpathyScore', 0] },
          firstCallResolutionRate: {
            $cond: [
              { $gt: ['$totalCalls', 0] },
              { $multiply: [{ $divide: ['$firstCallResolutionCount', '$totalCalls'] }, 100] },
              0
            ]
          },
          avgComplianceScore: { $ifNull: ['$avgComplianceScore', 0] },
          highRiskCallsCount: 1,
          highRiskCallsPercentage: {
            $cond: [
              { $gt: ['$totalCalls', 0] },
              { $multiply: [{ $divide: ['$highRiskCallsCount', '$totalCalls'] }, 100] },
              0
            ]
          },
          salesConversionRate: {
            $cond: [
              { $gt: ['$totalCalls', 0] },
              { $multiply: [{ $divide: ['$salesConversionCount', '$totalCalls'] }, 100] },
              0
            ]
          },
          averageDuration: { $ifNull: ['$avgDuration', 0] }
        }
      }
    ]).toArray();

    console.log(`=== TRANSCRIBER STATS FOR AGENT: ${agentName} ===`);
    console.log('Stats data:', JSON.stringify(stats, null, 2));
    console.log('===============================================');

    res.status(200).json(stats[0] || {
      totalCalls: 0,
      avgQualityScore: 0,
      avgEmpathyScore: 0,
      firstCallResolutionRate: 0,
      avgComplianceScore: 0,
      highRiskCallsCount: 0,
      highRiskCallsPercentage: 0,
      salesConversionRate: 0,
      averageDuration: 0
    });
  } catch (error) {
    console.error('Error fetching agent stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch agent statistics',
      error: error.message 
    });
  }
});

/**
 * GET /api/v1/transcriber/:id
 * Get a single call record by ID
 */
router.get('/:id', verifyJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const transcribersCollection = mongoose.connection.db.collection('transcriber');
    
    const call = await transcribersCollection.findOne({ _id: new mongoose.Types.ObjectId(id) });
    
    if (!call) {
      return res.status(404).json({ 
        success: false, 
        message: 'Call record not found' 
      });
    }

    console.log(`=== SINGLE TRANSCRIBER CALL: ${id} ===`);
    console.log('Call data:', JSON.stringify(call, null, 2));
    console.log('=====================================');

    res.status(200).json(call);
  } catch (error) {
    console.error('Error fetching call:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch call record',
      error: error.message 
    });
  }
});

/**
 * GET /api/v1/transcriber
 * Get all call records with optional filters
 */
router.get('/', verifyJWT, async (req, res) => {
  try {
    const { agent, startDate, endDate, highRisk, resolved } = req.query;
    const transcribersCollection = mongoose.connection.db.collection('transcriber');
    
    const filter = {};
    
    if (agent) {
      filter.agent = agent;
    }
    
    if (startDate || endDate) {
      filter['message.key_call_details.call_date'] = {};
      if (startDate) {
        filter['message.key_call_details.call_date'].$gte = startDate;
      }
      if (endDate) {
        filter['message.key_call_details.call_date'].$lte = endDate;
      }
    }
    
    if (highRisk !== undefined) {
      filter['message.high_risk.is_high_risk'] = highRisk === 'true';
    }
    
    if (resolved !== undefined) {
      if (resolved === 'true') {
        filter['message.call_summary.resolution_status'] = { $in: ['resolved', 'partially_resolved'] };
      } else {
        filter['message.call_summary.resolution_status'] = { $nin: ['resolved', 'partially_resolved'] };
      }
    }
    
    const calls = await transcribersCollection
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();

    console.log('=== FILTERED TRANSCRIBER CALLS ===');
    console.log('Filter applied:', filter);
    console.log('Total calls found:', calls.length);
    console.log('Query params:', { agent, startDate, endDate, highRisk, resolved });
    console.log('Sample call data (first call):', calls.length > 0 ? JSON.stringify(calls[0], null, 2) : 'No calls found');
    console.log('==================================');

    res.status(200).json(calls);
  } catch (error) {
    console.error('Error fetching calls:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch call records',
      error: error.message 
    });
  }
});

export default router;
