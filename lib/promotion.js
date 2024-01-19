import axios from 'axios';

const bigCommerceApi = axios.create({
    baseURL: process.env.BIGCOMMERCE_API_URL,
    headers: {
        'X-Auth-Client': process.env.BIGCOMMERCE_AUTH_CLIENT,
        'X-Auth-Token': process.env.BIGCOMMERCE_AUTH_TOKEN
    }
});

async function getProductInfo(productId) {
    try {
        const response = await bigCommerceApi.get(`/catalog/products/${productId}?include=custom_fields`);
        const product = response.data.data;
        return {
            id: product.id,
            brandId: product.brand_id,
            categories: product.categories.map(category => category.id),
            customFields: product.custom_fields.reduce((fields, field) => {
                fields[field.name] = field.value;
                return fields;
            }, {})
        };
    } catch (error) {
        console.error('Error fetching product info:', error);
        throw error;
    }
}

async function getAllPromotions() {
    try {
        const response = await bigCommerceApi.get('/promotions');
        return response.data.data;
    } catch (error) {
        console.error('Error fetching promotions:', error);
        throw error;
    }
}

function isProductIncludedInCondition(product, promotion) {
    let hasExplicitConditions = false;

    const checkConditionForMatch = (conditionObj, conditionType = "") => {
        for (const key in conditionObj) {
            if (Array.isArray(conditionObj[key])) {
                if (key === 'products' && conditionObj[key].includes(product.id)) {
                    return { included: true, reason: "Product ID matches", conditionType: conditionType + ".products" };
                }
                if (key === 'categories' && conditionObj[key].some(catId => product.categories.includes(catId))) {
                    return { included: true, reason: "Category matches", conditionType: conditionType + ".categories" };
                }
                if (key === 'brands' && conditionObj[key].includes(product.brandId)) {
                    return { included: true, reason: "Brand matches", conditionType: conditionType + ".brands" };
                }
                if (key === 'custom_fields') {
                    const matchesCustomField = conditionObj[key].some(field => 
                        product.customFields.hasOwnProperty(field.name) && product.customFields[field.name] === field.value
                    );
                    if (matchesCustomField) {
                        return { included: true, reason: "Custom field matches", conditionType: conditionType + ".custom_fields" };
                    }
                }
            } else if (typeof conditionObj[key] === 'object' && conditionObj[key] !== null) {
                let result = checkConditionForMatch(conditionObj[key], conditionType + (conditionType ? "." : "") + key);
                if (result.included) return result;
            }
        }
        return { included: false };
    };

    for (let rule of promotion.rules) {
        if (!rule.condition) continue;

        hasExplicitConditions = true;
        const conditionResult = checkConditionForMatch(rule.condition);
        if (conditionResult.included) return conditionResult;
    }

    return hasExplicitConditions 
        ? { included: false, reason: "No matching conditions found", conditionType: "none" }
        : { included: true, reason: "No explicit conditions", conditionType: "default" };
}

function isProductIncludedInAction(product, promotion) {
    const checkActionForProductInclusion = (actionObj) => {
        for (const key in actionObj) {
            if (typeof actionObj[key] === 'object' && actionObj[key] !== null) {
                let subResult = checkActionForProductInclusion(actionObj[key]);
                if (subResult.included) return subResult;
            } else {
                if (key === 'product_id' && actionObj[key] === product.id) {
                    return { included: true, actionType: "gift_item", reason: "Product is a gift item" };
                }
                if (key === 'brand_ids' && actionObj[key].includes(product.brandId)) {
                    return { included: true, actionType: "brand_discount", reason: "Product's brand is included in a discount action" };
                }
                if (key === 'category_ids' && actionObj[key].some(catId => product.categories.includes(catId))) {
                    return { included: true, actionType: "category_discount", reason: "Product's category is included in a discount action" };
                }
                if (key === 'custom_fields') {
                    const matchesCustomField = actionObj[key].some(field => 
                        product.customFields[field.name] && product.customFields[field.name] === field.value
                    );
                    if (matchesCustomField) {
                        return { included: true, actionType: "custom_field", reason: "Product's custom field matches an action criterion" };
                    }
                }
            }
        }
        return { included: false };
    };

    for (let rule of promotion.rules) {
        let result = checkActionForProductInclusion(rule.action);
        if (result.included) return result;
    }

    return { included: false, actionType: "default", reason: "No explicit actions" };
}

async function findApplicablePromotions(productId) {
    const product = await getProductInfo(productId);
    const promotions = await getAllPromotions();

    return promotions.map(promotion => {
        return {
            promotion: promotion,
            isIncludedInCondition: isProductIncludedInCondition(product, promotion),
            isIncludedInAction: isProductIncludedInAction(product, promotion)
        };
    });
}

export { findApplicablePromotions, getProductInfo, getAllPromotions, isProductIncludedInCondition, isProductIncludedInAction };
