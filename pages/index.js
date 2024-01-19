import Promotions from '../components/Promotions';
import styles from '../styles/Home.module.css';

const HomePage = () => {
    return (
        <div className={styles.container}>
            <h1 className={styles.title}>BigCommerce Promo Helper</h1>
            <p className={styles.subtitle}>Search for Products to See Applicable Promotions</p>
            <Promotions />
        </div>
    );
};

export default HomePage;
