import { Request, Response } from 'express';
import { ClusterService } from '../services/clusterService';

export const ClusterController = {
  matchCluster: async (req: Request, res: Response): Promise<void> => {
    try {
      const { profile } = req.body;

      if (!profile || typeof profile !== 'object') {
        res.status(400).json({ error: 'Invalid profile data' });
        return;
      }

      const cluster = await ClusterService.matchCluster(profile);
      res.json(cluster);
    } catch (error: any) {
      console.error('Error matching cluster:', error);
      if (error.message === 'Cluster not found for this profile') {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to match cluster' });
      }
    }
  },

  getAllClusters: async (req: Request, res: Response): Promise<void> => {
    try {
      const clusters = await ClusterService.getAllClusters();
      res.json(clusters);
    } catch (error) {
      console.error('Error reading clusters:', error);
      res.status(500).json({ error: 'Failed to load clusters' });
    }
  },
};


