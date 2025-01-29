const axios = require('axios');
const { URL } = require('url');

class HlsProxyManager {
    constructor(config) {
        this.config = config;
        this.proxyCache = new Map();
        this.lastCheck = new Map();
    }

    async validateProxyUrl(url) {
        if (!url) return false;
        try {
            const parsed = new URL(url);
            return parsed.protocol === 'http:' || parsed.protocol === 'https:';
        } catch {
            return false;
        }
    }

    async checkProxyHealth(proxyUrl) {
        try {
            const response = await axios.head(proxyUrl, {
                timeout: 5000,
                validateStatus: status => status === 200 || status === 302
            });
            return response.status === 200 || response.status === 302;
        } catch {
            return false;
        }
    }

    buildProxyUrl(streamUrl, userAgent, referrer = null) {
        if (!streamUrl || !this.config.PROXY_URL || !this.config.PROXY_PASSWORD) {
            console.log('Parametri proxy mancanti');
            return null;
        }

        const params = new URLSearchParams({
            api_password: this.config.PROXY_PASSWORD,
            d: streamUrl
        });

        if (userAgent) {
            params.append('h_User-Agent', userAgent);
        }

        if (referrer) {
            params.append('h_Referer', referrer);
        }

        return `${this.config.PROXY_URL}/proxy/hls/manifest.m3u8?${params.toString()}`;
    }

    async getProxyStreams(channel) {
        const streams = [];

        // Verifica preventiva delle condizioni
        if (!this.config.PROXY_URL || !this.config.PROXY_PASSWORD) {
            console.log('Proxy non configurato per:', channel.name);
            return streams;
        }

        try {
            const userAgent = channel.headers?.['User-Agent'] || 'HbbTV/1.6.1';
            const referrer = channel.headers?.['Referer'] || null;

            // Costruisci il proxyUrl all'interno di un blocco try
            let proxyUrl;
            try {
                proxyUrl = this.buildProxyUrl(
                    channel.url, 
                    userAgent, 
                    referrer
                );
            } catch (urlError) {
                console.error('Errore costruzione URL proxy:', urlError);
                return streams;
            }

            // Verifica esistenza proxyUrl
            if (!proxyUrl) {
                console.log('Impossibile generare URL proxy per:', channel.name);
                return streams;
            }

            const cacheKey = `${channel.name}_${proxyUrl}`;
            const lastCheck = this.lastCheck.get(cacheKey);
            const cacheValid = lastCheck && (Date.now() - lastCheck) < 5 * 60 * 1000;

            if (cacheValid && this.proxyCache.has(cacheKey)) {
                return [this.proxyCache.get(cacheKey)];
            }

            // Verifica salute proxy
            if (!await this.checkProxyHealth(proxyUrl)) {
                console.log('Proxy non attivo per:', channel.name);
                return streams;
            }

            const proxyStream = {
                name: `${channel.name} (Proxy)`,
                title: `${channel.name} (Proxy HLS)`,
                url: proxyUrl,
                behaviorHints: {
                    notWebReady: false,
                    bingeGroup: "tv"
                },
                headers: channel.headers // Aggiungi gli headers originali
            };

            this.proxyCache.set(cacheKey, proxyStream);
            this.lastCheck.set(cacheKey, Date.now());

            streams.push(proxyStream);
        } catch (error) {
            console.error('Errore completo proxy per il canale:', channel.name, error);
            console.error('Dettagli errore:', error.message, error.stack);
        }

        return streams;
    }
}

module.exports = HlsProxyManager;
