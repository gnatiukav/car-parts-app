export default async function handler(req, res) {
    const { vin } = req.query;
  
    if (!vin) {
      res.status(400).json({ error: 'vin is required' });
      return;
    }
  
    try {
      const response = await fetch(
        `https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues/${vin}?format=json`
      );
      const data = await response.json();
      res.status(200).json(data);
    } catch (e) {
      res.status(500).json({ error: 'NHTSA fetch failed' });
    }
  }