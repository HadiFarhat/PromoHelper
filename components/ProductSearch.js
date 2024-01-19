import React, { useState, useEffect } from 'react';
import debounce from 'lodash/debounce';
import styles from '../components/ProductSearch.module.css';

const ProductSearch = ({ onProductSelect }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);

    const placeholderImageUrl = "/placeholder_image.jpeg";
    
    const handleSearch = debounce(async (searchValue) => {
        if (searchValue.length > 2) {
            try {
                const response = await fetch('/api/searchProducts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ searchTerm: searchValue }),
                });
                const data = await response.json();
                setSearchResults(data);
            } catch (error) {
                console.error('Error fetching search results:', error);
            }
        } else {
            setSearchResults([]);
        }
    }, 300);

    useEffect(() => {
        handleSearch(searchTerm);
        return () => handleSearch.cancel();
    }, [searchTerm]);

    return (
        <div className={styles.searchContainer}>
            <input
                type="text"
                className={styles.searchBox}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search for a product"
            />
            {searchResults.length > 0 && (
                <div className={styles.searchResults}>
                    {searchResults.map(result => (
                        <div 
                            key={result.node.entityId} 
                            className={styles.searchResultCard}
                            onClick={() => onProductSelect(result.node.entityId)}
                        >
                            <img 
                                src={result.node.defaultImage ? result.node.defaultImage.url : placeholderImageUrl} 
                                alt={result.node.name}
                                className={styles.productImage}
                            />
                            <p className={styles.productName}>{result.node.name}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ProductSearch;