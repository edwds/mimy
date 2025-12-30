import { DataService } from './dataService';

const AXIS_ORDER = ['boldness', 'acidity', 'richness', 'experimental', 'spiciness', 'sweetness', 'umami'];

export interface Profile {
  boldness: number;
  acidity: number;
  richness: number;
  experimental: number;
  spiciness: number;
  sweetness: number;
  umami: number;
}

export const ClusterService = {
  matchCluster: async (profile: Profile): Promise<any> => {
    const valueString = AXIS_ORDER.map(key => profile[key as keyof Profile] ?? 0).join(',');

    // 매칭 맵에서 클러스터 ID 찾기
    const matchMap = DataService.getMatchMap();
    const clusterId = matchMap.get(valueString);

    if (clusterId === undefined) {
      throw new Error('Cluster not found for this profile');
    }

    // 클러스터 정보 찾기
    const cluster = await DataService.getClusterById(clusterId.toString());

    if (!cluster) {
      throw new Error('Cluster info not found');
    }

    return cluster;
  },

  getAllClusters: async (): Promise<any[]> => {
    return await DataService.getClusters();
  },
};


