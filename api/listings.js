export default async function handler(req, res) {
    // Allow CORS from your frontend
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');

    const token = process.env.APIFY_TOKEN;

    if (!token) {
        return res.status(500).json({ error: 'API token not configured' });
    }

    try {
        const response = await fetch(
            `https://api.apify.com/v2/datasets/593vTo9dheBVf9tFJ/items?token=${token}`
        );

        if (!response.ok) {
            throw new Error(`Apify responded with status ${response.status}`);
        }

        const rawData = await response.json();

        // Normalize data to ensure consistent structure for frontend
        const normalizedData = (rawData || []).map(item => {
            // Extract price (prefer min for display)
            let price = 0;
            if (typeof item.price === 'number') {
                price = item.price;
            } else if (item.price && typeof item.price === 'object') {
                price = item.price.min || item.price.max || 0;
            }

            // Extract bedrooms
            let bedrooms = 0;
            if (typeof item.bedrooms === 'number') {
                bedrooms = item.bedrooms;
            } else if (item.bedrooms && typeof item.bedrooms === 'object') {
                bedrooms = item.bedrooms.max || item.bedrooms.min || 0;
            }

            // Extract bathrooms
            let bathrooms = 0;
            if (typeof item.bathrooms === 'number') {
                bathrooms = item.bathrooms;
            } else if (item.bathrooms && typeof item.bathrooms === 'object') {
                bathrooms = item.bathrooms.max || item.bathrooms.min || 0;
            }

            return {
                id: item.localId || Math.random().toString(36).substr(2, 9),
                price: price,
                offerType: item.offerType || 'sale',
                realEstateType: item.realEstateType || 'PROPERTY',
                street: item.street || '',
                city: item.city || '',
                state: item.state || '',
                bedrooms: bedrooms,
                bathrooms: bathrooms,
                livingArea: item.livingArea || 0,
                pictures: item.pictures || [],
                description: item.description || '',
                url: item.url || '#',
                isSupabase: false
            };
        });

        return res.status(200).json(normalizedData);
    } catch (error) {
        console.error('API Listing Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
