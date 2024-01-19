import { findApplicablePromotions } from '../../../lib/promotion';

export default async function handler(req, res) {
    const { productId } = req.query;

    try {
        const promotions = await findApplicablePromotions(productId);
        res.status(200).json(promotions);
    } catch (error) {
        console.error('Error in promotions API:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}
