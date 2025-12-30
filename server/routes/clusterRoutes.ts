import { Router } from 'express';
import { ClusterController } from '../controllers/clusterController';

const router = Router();

router.post('/match-cluster', ClusterController.matchCluster);
router.get('/clusters', ClusterController.getAllClusters);

export default router;


