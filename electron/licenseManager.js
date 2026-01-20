const fs = require('fs');
const path = require('path');
const axios = require('axios');
const si = require('systeminformation');
const crypto = require('crypto');
// const Store = require('electron-store'); // ESM only
const { app } = require('electron');

let KEYGEN_SERVER_URL = process.env.KEYGEN_SERVER_URL || 'https://inertial-event.vercel.app/api/keygen/api';

// Fix relative URLs or normalize to production if explicitly requested
if (KEYGEN_SERVER_URL && (KEYGEN_SERVER_URL.startsWith('/') || KEYGEN_SERVER_URL.includes('localhost'))) {
    // Only use localhost in dev if NODE_ENV is explicitly development
    if (process.env.NODE_ENV === 'development') {
        KEYGEN_SERVER_URL = `http://localhost:5000${KEYGEN_SERVER_URL.startsWith('/') ? KEYGEN_SERVER_URL : '/api'}`;
    } else {
        KEYGEN_SERVER_URL = 'https://inertial-event.vercel.app/api/keygen/api';
    }
    console.log('[LicenseManager] Normalized KEYGEN_SERVER_URL to:', KEYGEN_SERVER_URL);
}

const ENCRYPTION_KEY = Buffer.from('4ee9ccf17e082f9d5a9c3b88e04b4d7f6c3a1b2c3d4e5f6a7b8c9d0e1f2a3b4c', 'hex');
const IV = Buffer.from('a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6', 'hex');
let logger = console.log;

class LicenseManager {
    constructor() {
        this.deviceId = null;
        this.store = null;
    }

    setLogger(logFn) {
        logger = logFn;
    }

    /**
     * Decrypts assets/env.enc and populates process.env
     */
    async loadSecureEnv() {
        try {
            let envEncPath = path.join(app.getAppPath(), 'assets', 'env.enc');
            
            if (app.isPackaged && !fs.existsSync(envEncPath)) {
                envEncPath = path.join(process.resourcesPath, 'assets', 'env.enc');
            }

            if (!fs.existsSync(envEncPath)) {
                logger('[LicenseManager Warning] No encrypted env found at: ' + envEncPath);
                return;
            }

            // Read and clean the hex string
            const encryptedRaw = fs.readFileSync(envEncPath, 'utf8').trim();
            const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, IV);
            
            let decrypted = decipher.update(encryptedRaw, 'hex', 'utf8');
            decrypted += decipher.final('utf8');

            if (!decrypted || decrypted.trim().length === 0) {
                logger('[LicenseManager Warning] Decrypted environment is empty!');
                return;
            }

            // Debug: Log the first 16 bytes as hex to identify file format
            const hexProbe = Buffer.from(decrypted.substring(0, 16)).toString('hex');
            logger(`[LicenseManager Debug] Decrypted head (hex): ${hexProbe}`);

            const keysLoaded = [];
            const lines = decrypted.split(/\r?\n/);
            
            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || trimmed.startsWith('#')) continue;
                
                const parts = trimmed.split('=');
                if (parts.length >= 2) {
                    const key = parts[0].trim();
                    let value = parts.slice(1).join('=').trim();
                    // Remove quotes if present
                    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
                    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
                    
                    process.env[key] = value;
                    keysLoaded.push(key);
                }
            }

            logger(`[LicenseManager OK] Env loaded (${decrypted.length} chars). Keys Found: ${keysLoaded.join(', ')}`);
        } catch (error) {
            logger(`[LicenseManager Error] Env loading failed: ${error.message}`);
        }
    }

    async getStore() {
        if (!this.store) {
            const { default: Store } = await import('electron-store');
            this.store = new Store({ name: 'license-cache' });
        }
        return this.store;
    }

    async getMachineId() {
        if (this.deviceId) return this.deviceId;

        try {
            // Use a timeout for hardware queries to prevent boot hang
            const timeout = (promise, ms) => Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms))]);
            
            // Get base system info only (much faster than graphics/mem)
            const [cpu, system, os] = await Promise.all([
                timeout(si.cpu(), 3000).catch(() => ({ manufacturer: 'unknown', brand: 'unknown' })),
                timeout(si.system(), 3000).catch(() => ({ serial: 'unknown', uuid: 'unknown' })),
                timeout(si.osInfo(), 3000).catch(() => ({ serial: 'unknown' })),
            ]);

            const rawId = [
                cpu.manufacturer,
                cpu.brand,
                system.serial,
                system.uuid,
                os.serial
            ].join('|');

            this.deviceId = crypto.createHash('sha256').update(rawId).digest('hex');
            return this.deviceId;
        } catch (error) {
            console.error('Failed to generate machine ID:', error);
            return 'fallback-' + require('os').hostname();
        }
    }

    getLicenseKey() {
        // Path to license file - In production this should be C:\ProgramData\NovaStream\license.dat
        const PROD_LICENSE_PATH = 'C:\\ProgramData\\NovaStream\\license.dat';
        const DEV_LICENSE_PATH = path.join(app.getPath('userData'), 'license.dat');

        // Try Prod path first
        if (fs.existsSync(PROD_LICENSE_PATH)) {
            return fs.readFileSync(PROD_LICENSE_PATH, 'utf8').trim();
        }
        // Try Dev/UserData path
        if (fs.existsSync(DEV_LICENSE_PATH)) {
            return fs.readFileSync(DEV_LICENSE_PATH, 'utf8').trim();
        }
        return null;
    }

    async validate() {
        const deviceId = await this.getMachineId();
        const licenseKey = this.getLicenseKey();
        const store = await this.getStore();

        if (!licenseKey) {
            // No license file - require activation
            logger('[LicenseManager] No license file found. Activation required.');
            return { valid: false, requiresActivation: true };
        }

        try {
            console.log(`[LicenseManager] Validating key: ${licenseKey.substring(0, 8)}... for Device: ${deviceId.substring(0, 8)}...`);
            
            // Light telemetry only for speed
            const os = await si.osInfo().catch(() => ({ distro: 'Unknown', release: 'Unknown', hostname: 'Unknown' }));
            const cpu = await si.cpu().catch(() => ({ manufacturer: 'Unknown', brand: 'Unknown' }));
            
            const machineInfo = {
                ram: 'Check Log',
                os: `${os.distro} ${os.release}`,
                cpu: `${cpu.manufacturer} ${cpu.brand}`,
                gpu: 'Disabled for Speed',
                hostname: os.hostname
            };

            // URL Construction & Debug
            let baseUrl = process.env.KEYGEN_SERVER_URL || KEYGEN_SERVER_URL;
            if (!baseUrl.startsWith('http')) {
                console.warn('[LicenseManager] Invalid KEYGEN_SERVER_URL (missing protocol):', baseUrl);
                baseUrl = 'http://localhost:4000/api';
            }
            const targetUrl = `${baseUrl}/validate`;
            console.log(`[LicenseManager] Validating against: ${targetUrl}`);

            // Online Validation
            const response = await axios.post(targetUrl, {
                license_key: licenseKey,
                device_id: deviceId,
                machine_info: machineInfo
            }, { 
                timeout: 5000,
                validateStatus: (status) => status < 500 // Don't throw for 404, handle manually
            });

            if (response.status === 404) {
                console.error('[LicenseManager] Server returned 404. Is the Keygen server deployed correctly?');
                if (process.env.NODE_ENV === 'development') {
                    console.warn('[LicenseManager] DEV MODE: Allowing boot despite 404.');
                    return { valid: true, source: 'development-bypass' };
                }
                throw new Error('License Verification Server unreachable (404).');
            }

            if (response.data.valid) {
                // Update Cache
                store.set('validation', {
                    valid: true,
                    expires_at: response.data.expires_at,
                    last_checked: Date.now(),
                    license_key: licenseKey
                });
                return { valid: true, source: 'online', ...response.data };
            } else {
                // Server explicitly said INVALID or REVOKED
                console.warn('[LicenseManager] ACCESS REVOKED BY SERVER');
                
                // Nuclear Option: Delete credentials to prevent further attempts until re-install
                try {
                    store.delete('validation');
                } catch (e) {}

                // Throw specific error for main process to handle
                throw new Error('LICENSE_REVOKED: ' + (response.data.error || 'Access revoked by server.'));
            }

        } catch (error) {
            // Network Error or Server Down -> Check Offline Cache
            if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.message.includes('Network Error')) {
                console.warn('[LicenseManager] Server unreachable, checking offline cache...');
                const cached = store.get('validation');
                
                if (cached && cached.valid && cached.license_key === licenseKey) {
                    // Check local expiry (24h grace period or actual expiry?)
                    // Plan said "Cache validation ... 24 hours"
                    const lastChecked = cached.last_checked || 0;
                    const now = Date.now();
                    const hoursSinceCheck = (now - lastChecked) / (1000 * 60 * 60);

                    if (hoursSinceCheck < 24) {
                         // Check actual license expiry if permanent/trial
                         if (cached.expires_at && new Date(cached.expires_at) < new Date()) {
                             throw new Error('Offline license expired.');
                         }
                         return { valid: true, source: 'offline-cache', expires_at: cached.expires_at };
                    } else {
                        throw new Error('Offline validation expired (24h limit). Connect to internet.');
                    }
                }
            }
            
            throw error; // Re-throw if not a network error or cache missing
        }
    }

    /**
     * Activate a license key for this device
     * @param {string} licenseKey - The license key to activate
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    async activate(licenseKey) {
        try {
            const deviceId = await this.getMachineId();
            const store = await this.getStore();
            
            logger(`[LicenseManager] Activating key: ${licenseKey.substring(0, 8)}... for device: ${deviceId.substring(0, 8)}...`);
            
            // Call Keygen server
            const response = await axios.post(`${KEYGEN_SERVER_URL}/activate`, {
                license_key: licenseKey,
                device_id: deviceId,
                machine_name: require('os').hostname()
            }, { timeout: 10000 });
            
            if (response.data.success) {
                // Save license to file
                const licensePath = this.getLicensePath();
                const fs = require('fs');
                const path = require('path');
                
                // Ensure directory exists
                const dir = path.dirname(licensePath);
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }
                
                fs.writeFileSync(licensePath, licenseKey, 'utf8');
                
                // Cache validation
                store.set('validation', {
                    valid: true,
                    expires_at: response.data.expires_at,
                    last_checked: Date.now(),
                    license_key: licenseKey
                });
                
                logger('[LicenseManager] Activation successful!');
                return { success: true, access_type: response.data.access_type };
            } else {
                logger(`[LicenseManager] Activation failed: ${response.data.error}`);
                return { success: false, error: response.data.error };
            }
        } catch (error) {
            logger(`[LicenseManager] Activation error: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    getLicensePath() {
        const PROD_LICENSE_PATH = 'C:\\ProgramData\\NovaStream\\license.dat';
        const DEV_LICENSE_PATH = require('path').join(app.getPath('userData'), 'license.dat');
        return app.isPackaged ? PROD_LICENSE_PATH : DEV_LICENSE_PATH;
    }
}

module.exports = new LicenseManager();
