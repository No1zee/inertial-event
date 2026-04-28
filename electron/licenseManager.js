const fs = require('fs');
const path = require('path');
const axios = require('axios');
const si = require('systeminformation');
const crypto = require('crypto');
// const Store = require('electron-store'); // ESM only
const { app } = require('electron');

// This will be resolved dynamically to ensure env changes after load are reflected
const getBaseUrl = () => {
    let url = process.env.KEYGEN_SERVER_URL || 'https://inertial-event.vercel.app/api/keygen';
    // If it's a relative URL, prepend the production domain
    if (url.startsWith('/')) {
        url = `https://inertial-event.vercel.app${url}`;
    }
    return url.replace(/\/$/, '');
};

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
            if (process.env.KEYGEN_SERVER_URL) {
                logger(`[LicenseManager Debug] KEYGEN_SERVER_URL: "${process.env.KEYGEN_SERVER_URL}"`);
            }
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
            const store = await this.getStore();
            const cachedId = store.get('device_id');
            if (cachedId) {
                this.deviceId = cachedId;
                return this.deviceId;
            }
        } catch (e) {
            logger('[LicenseManager] Failed to read cached device_id:', e.message);
        }

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
            
            try {
                const store = await this.getStore();
                store.set('device_id', this.deviceId);
            } catch (e) {
                logger('[LicenseManager] Failed to cache device_id:', e.message);
            }
            
            return this.deviceId;
        } catch (error) {
            console.error('Failed to generate machine ID:', error);
            return 'fallback-' + require('os').hostname();
        }
    }

    getLicenseKey() {
        // Path to license file
        const PROD_LICENSE_PATH = 'C:\\ProgramData\\MaiWatch\\license.dat';
        const USER_LICENSE_PATH = path.join(app.getPath('userData'), 'license.dat');

        logger(`[LicenseManager] Checking for license at: "${USER_LICENSE_PATH}" and "${PROD_LICENSE_PATH}"`);

        // Try UserData path first (more reliable permissions)
        if (fs.existsSync(USER_LICENSE_PATH)) {
            logger('[LicenseManager] Found license in UserData');
            return fs.readFileSync(USER_LICENSE_PATH, 'utf8').trim();
        }
        // Try Prod/ProgramData path as secondary
        if (fs.existsSync(PROD_LICENSE_PATH)) {
            logger('[LicenseManager] Found license in ProgramData');
            return fs.readFileSync(PROD_LICENSE_PATH, 'utf8').trim();
        }
        
        logger('[LicenseManager] No license file found in any standard location.');
        return null;
    }

    async validate() {
        const licenseKey = this.getLicenseKey();

        if (!licenseKey) {
            // No license file - require activation immediately (skip slow machine ID gen)
            logger('[LicenseManager] No license file found. Activation required.');
            return { valid: false, requiresActivation: true };
        }

        const deviceId = await this.getMachineId();
        const store = await this.getStore();

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
        try {
            // Online Validation
            const baseUrl = getBaseUrl();
            const validationUrl = `${baseUrl}/validate`.replace(/([^:])\/\//g, '$1/');
            logger(`[LicenseManager Debug] Requesting validation from: ${validationUrl}`);
            
            let response;
            try {
                response = await axios.post(validationUrl, {
                    license_key: licenseKey,
                    device_id: deviceId,
                    machine_info: machineInfo
                }, { timeout: 10000 }); // Slightly longer timeout
            } catch (networkError) {
                // If the server is 404, 5xx, or timed out -> Fallback to cache if valid
                const isTransient = !networkError.response || 
                                   networkError.response.status >= 500 || 
                                   networkError.response.status === 404 ||
                                   networkError.code === 'ECONNREFUSED' ||
                                   networkError.code === 'ETIMEDOUT';

                if (isTransient) {
                    console.warn(`[LicenseManager] Transient error (${networkError.response?.status || networkError.code}), attempting cache fallback...`);
                    const cached = store.get('validation');
                    if (cached && cached.valid && cached.license_key === licenseKey) {
                        const lastChecked = cached.last_checked || 0;
                        const hoursSinceCheck = (Date.now() - lastChecked) / (1000 * 60 * 60);
                        
                        if (hoursSinceCheck < 720) { // 30 days
                            if (cached.expires_at && new Date(cached.expires_at) < new Date()) {
                                throw new Error('LICENSE_EXPIRED');
                            }
                            logger(`[LicenseManager] Resilient Fallback: Using cache (Validated ${Math.floor(hoursSinceCheck)}h ago)`);
                            return { valid: true, source: 'offline-resilient', ...cached };
                        }
                    }
                }
                throw networkError;
            }

            if (response.data.valid) {
                // Update Cache
                store.set('validation', {
                    valid: true,
                    expires_at: response.data.expires_at,
                    last_checked: Date.now(),
                    license_key: licenseKey,
                    access_type: response.data.access_type
                });
                return { valid: true, source: 'online', ...response.data };
            } else {
                // Server explicitly said INVALID or REVOKED
                console.warn('[LicenseManager] ACCESS REVOKED BY SERVER:', response.data.error);
                
                // Nuclear Option: Delete credentials only if explicitly revoked or invalid
                if (response.data.error === 'License revoked' || response.data.error === 'Invalid license key') {
                    try {
                        store.delete('validation');
                    } catch (e) {}
                    throw new Error('LICENSE_REVOKED: ' + (response.data.message || response.data.error));
                }
                
                return { valid: false, error: response.data.error };
            }

        } catch (error) {
            if (error.message && error.message.includes('LICENSE_REVOKED')) throw error;
            if (error.message === 'LICENSE_EXPIRED') throw error;

            // Final safety fallback
            const cached = store.get('validation');
            if (cached && cached.valid && cached.license_key === licenseKey) {
                 logger('[LicenseManager] Critical recovery: Reverting to last known good cache state.');
                 return { valid: true, source: 'safety-fallback', ...cached };
            }
            
            throw error;
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
            
            // Call Keygen server - using the same standardized URL base
            const baseUrl = getBaseUrl();
            const activationUrl = `${baseUrl}/activate`.replace(/([^:])\/\//g, '$1/');
            const response = await axios.post(activationUrl, {
                license_key: licenseKey,
                device_id: deviceId,
                machine_name: require('os').hostname()
            }, { timeout: 10000 });
            
            if (response.data.success) {
                // Save license to file
                const licensePath = this.getLicensePath();
                const fs = require('fs');
                const path = require('path');
                
                try {
                    // Ensure directory exists
                    const dir = path.dirname(licensePath);
                    if (!fs.existsSync(dir)) {
                        fs.mkdirSync(dir, { recursive: true });
                    }
                    fs.writeFileSync(licensePath, licenseKey, 'utf8');
                    logger(`[LicenseManager] License saved to: ${licensePath}`);
                } catch (writeError) {
                    logger(`[LicenseManager Warning] Failed to write license file: ${writeError.message}`);
                    // Since getLicensePath already returns UserData, this failure is likely catastrophic 
                    // but we've already cached the validation in the store anyway.
                }
                
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
        // ALWAYS prioritize UserData for writing to ensure we have permissions
        const USER_LICENSE_PATH = require('path').join(app.getPath('userData'), 'license.dat');
        const PROD_LICENSE_PATH = 'C:\\ProgramData\\MaiWatch\\license.dat';
        
        // If we're packaged and running as admin, we could use ProgramData, 
        // but UserData is safer and guaranteed writable.
        return USER_LICENSE_PATH;
    }
}

module.exports = new LicenseManager();
