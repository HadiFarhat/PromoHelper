import React, { useState } from 'react';
import styles from '../components/Promotions.module.css'
import ProductSearch from './ProductSearch'; 

const Promotions = () => {
    const [selectedProductId, setSelectedProductId] = useState(null);
    const [promotions, setPromotions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedPromotion, setSelectedPromotion] = useState(null);
    const [showAllPromotions, setShowAllPromotions] = useState(true);

    const fetchPromotions = async (productId) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/promotions/${productId}`);
            const data = await response.json();
            setPromotions(data);
        } catch (error) {
            console.error('Error fetching promotions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleProductSelect = (productId) => {
        setSelectedProductId(productId);
        fetchPromotions(productId);
    };

    const handlePromotionClick = (index) => {
        setSelectedPromotion(index === selectedPromotion ? null : index);
    };

    const isPromotionApplicable = (promotion) => {
        return promotion.isIncludedInCondition.included || promotion.isIncludedInAction.included;
    };

    const formatDetails = (details) => {
        return Object.entries(details).map(([key, value], index) => (
            <p key={index}><strong>{key}:</strong> {value.toString()}</p>
        ));
    };

    return (
        <div>
            <ProductSearch onProductSelect={handleProductSelect} />
            <div className={styles.filterCheckbox}>
                <label>
                    <input
                        type="checkbox"
                        checked={showAllPromotions}
                        onChange={(e) => setShowAllPromotions(e.target.checked)}
                    />
                    Show All Promotions
                </label>
            </div>
            {selectedProductId && (
                <div className={styles.promotionsContainer}>
                    {promotions.map((promo, index) => {
                        if (showAllPromotions || isPromotionApplicable(promo)) {
                            return (
                                <div
                                    key={index}
                                    className={`${styles.promotionItem} ${isPromotionApplicable(promo) ? styles.applicable : ''}`}
                                    onClick={() => handlePromotionClick(index)}
                                >
                                    <h3>{promo.promotion.name}</h3>
                                    {selectedPromotion === index && (
                                        <div className={styles.details}>
                                            <h4>Condition Details:</h4>
                                            {formatDetails(promo.isIncludedInCondition)}
                                            <h4>Action Details:</h4>
                                            {formatDetails(promo.isIncludedInAction)}
                                        </div>
                                    )}
                                </div>
                            );
                        }
                        return null;
                    })}
                </div>
            )}
        </div>
    );
};

export default Promotions;