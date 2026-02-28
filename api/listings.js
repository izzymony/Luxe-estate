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

        const data = await response.json();
        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
