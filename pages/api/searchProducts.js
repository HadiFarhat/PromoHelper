import axios from 'axios';

export default async function handler(req, res) {
    if (req.method === 'POST') {
        try {
            const searchTerm = req.body.searchTerm;
            const graphqlQuery = {
                query: `
                query{
                    site {
                      search {
                        searchProducts(filters: {searchTerm: "${searchTerm}"}, sort: A_TO_Z) {
                          products(first: 5) {
                            edges {
                              node {
                                entityId
                                name
                                defaultImage{
                                    url(width: 320)
                                  }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                `,
            };

            const response = await axios({
                url: process.env.BIGCOMMERCE_GQL_URL,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.BIGCOMMERCE_GQL_TOKEN}`,
                },
                data: JSON.stringify(graphqlQuery),
            });

            res.status(200).json(response.data.data.site.search.searchProducts.products.edges);
        } catch (error) {
            console.error('Error fetching product search:', error);
            if (error.response) {
                console.error(error.response.data);
                console.error(error.response.status);
                console.error(error.response.headers);
            } else if (error.request) {
                console.error(error.request);
            } else {
                console.error('Error', error.message);
            }
            res.status(500).json({ message: 'Internal Server Error' });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
