/**
 * LIMS Manager - Factory for LIMS connectors
 */

const LIMSConnector = require('./limsConnector');
const fs = require('fs');
const path = require('path');

class LIMSManager {
    constructor() {
        this.connectors = new Map();
        this.activeSystem = null;
    }

    initialize(systemName, config) {
        try {
            const connector = new LIMSConnector(systemName, config);
            this.connectors.set(systemName, connector);
            this.activeSystem = systemName;

            console.log(`✓ LIMS connector initialized: ${systemName}`);
            return connector;
        } catch (error) {
            console.error(`❌ Failed to initialize LIMS: ${error.message}`);
            throw error;
        }
    }

    getConnector(systemName) {
        const name = systemName || this.activeSystem;

        if (!name) {
            throw new Error('No LIMS system specified');
        }

        const connector = this.connectors.get(name);

        if (!connector) {
            throw new Error(`LIMS connector not initialized: ${name}`);
        }

        return connector;
    }

    async submitResult(calculationData, systemName) {
        const connector = this.getConnector(systemName);
        return await connector.submitResult(calculationData);
    }

    async fetchSamples(query, systemName) {
        const connector = this.getConnector(systemName);
        return await connector.fetchSamples(query);
    }

    async testConnection(systemName, config) {
        if (config) {
            try {
                const tempConnector = new LIMSConnector(systemName, config);
                return await tempConnector.testConnection();
            } catch (error) {
                return { success: false, error: error.message, system: systemName };
            }
        }

        // If not initialized, we need to create a temporary connector to test
        if (!this.connectors.has(systemName)) {
            // We need config to test, but if it's just a check for system existence/support:
            try {
                // We can't really test Auth without config, but we can return supported status
                const configPath = path.join(__dirname, '../lims_config.json');
                const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                if (config.lims_systems[systemName]) {
                    return { success: true, message: 'System supported, authentication required', system: systemName };
                }
            } catch (e) {
                return { success: false, error: e.message };
            }
        }
        const connector = this.getConnector(systemName);
        return await connector.testConnection();
    }

    listAvailableSystems() {
        const configPath = path.join(__dirname, '../lims_config.json');
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

        return Object.keys(config.lims_systems).map(key => ({
            id: key,
            name: config.lims_systems[key].name,
            type: config.lims_systems[key].type,
            supported: config.lims_systems[key].supported
        }));
    }

    getStatus() {
        return {
            initialized_systems: Array.from(this.connectors.keys()),
            active_system: this.activeSystem,
            total_connectors: this.connectors.size
        };
    }
}

const limsManager = new LIMSManager();

module.exports = limsManager;
