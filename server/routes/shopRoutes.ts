import express from 'express';
import { searchShops, getExploreShops, getMyList, addToMyList, removeFromMyList } from '../controllers/shopController';

const router = express.Router();

router.get('/shops/search', searchShops);
router.get('/shops/explore', getExploreShops);
router.get('/shops/mylist/:email', getMyList);
router.post('/shops/mylist', addToMyList);
router.delete('/shops/mylist/:email/:shopId', removeFromMyList);

export default router;
