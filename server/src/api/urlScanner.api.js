const axios = require('axios');

class URLScannerApi {
    // [POST] /api/externalResourse/scanUrl
    async URLScanner(req, res, next) {
        const url = req.body.url;
        try {
            const apiUrl = url;
            const response = await axios.get(apiUrl);
            res.json(response.data); // Trả về dữ liệu từ API cho trình duyệt của người dùng
            // res.json(1); // Trả về dữ liệu từ API cho trình duyệt của người dùng
        } catch (error) {
            res.status(500).json({ error: 'Something went wrong!' });
        }
    }
}

module.exports = new URLScannerApi();
