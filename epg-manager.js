getCurrentProgram(channelId) {
        console.log('[EPG] Ricerca programma corrente per ID:', channelId);
        
        // Cerca corrispondenze simili per debug
        const similarMatches = [];
        const searchTerm = channelId.toLowerCase();
        
        console.log('[EPG] Canali disponibili:', Array.from(this.programGuide.keys())
            .filter(k => k.toLowerCase().includes('rai'))  // Filtra solo per debug
            .join(', '));
        
        for (const [id, programs] of this.programGuide.entries()) {
            // Verifica diverse possibili somiglianze
            const idLower = id.toLowerCase();
            const similarity = {
                id: id,
                matchType: null,
                programCount: programs.length,
                sample: programs[0] ? {
                    title: programs[0].title,
                    start: programs[0].start,
                    stop: programs[0].stop
                } : 'Nessun programma'
            };

            if (idLower.includes(searchTerm) || searchTerm.includes(idLower)) {
                similarity.matchType = 'partial';
                similarMatches.push(similarity);
            } else if (idLower === searchTerm) {  // Match case-insensitive esatto
                similarity.matchType = 'exact-case-insensitive';
                similarMatches.push(similarity);
            }
        }

        // Logga le corrispondenze simili trovate
        if (similarMatches.length > 0) {
            console.log('[EPG] Trovate corrispondenze simili:', 
                similarMatches.map(m => 
                    `\n- ID: "${m.id}" (${m.matchType})`
                    + `\n  Programmi totali: ${m.programCount}`
                    + `\n  Esempio: ${typeof m.sample === 'string' ? m.sample : JSON.stringify(m.sample)}`
                ).join('')
            );
        }

        // Cerca prima con case esatto poi con case insensitive
        let programs = this.programGuide.get(channelId);
        if (!programs) {
            // Prova una ricerca case-insensitive
            const lowerChannelId = channelId.toLowerCase();
            const foundKey = Array.from(this.programGuide.keys())
                .find(key => key.toLowerCase() === lowerChannelId);
            if (foundKey) {
                programs = this.programGuide.get(foundKey);
                console.log(`[EPG] Trovato match case-insensitive: ${foundKey}`);
            }
        }

        if (!programs || programs.length === 0) {
            console.log('[EPG] Nessun programma trovato per ID:', channelId);
            return null;
        }

        // Trova il programma corrente
        const now = new Date();
        const nowUTC = new Date(now.toISOString());
        const validPrograms = programs.filter(p => 
            p.start && p.stop && !isNaN(p.start) && !isNaN(p.stop)
        );
        
        console.log(`[EPG] Programmi validi per ${channelId}: ${validPrograms.length}/${programs.length}`);
        
        const currentProgram = validPrograms.find(program => 
            program.start <= nowUTC && program.stop >= nowUTC
        );

        if (currentProgram) {
            console.log('[EPG] Programma corrente trovato:', JSON.stringify(currentProgram, null, 2));
            return currentProgram;
        }

        console.log('[EPG] Nessun programma corrente per ID:', channelId, 
            '(Primo programma disponibile:', JSON.stringify(programs[0], null, 2), ')');
        return null;toLowerCase();
        
        console.log('[EPG] Canali disponibili:', Array.from(this.programGuide.keys())
            .filter(k => k.toLowerCase().includes('rai'))  // Filtra solo per debug
            .join(', '));
        
        for (const [id, programs] of this.programGuide.entries()) {
            // Verifica diverse possibili somiglianze
            const idLower = id.toLowerCase();
            const similarity = {
                id: id,
                matchType: null,
                programCount: programs.length,
                sample: programs[0] ? {
                    title: programs[0].title,
                    start: programs[0].start,
                    stop: programs[0].stop
                } : 'Nessun programma'
            };

            if (idLower.includes(searchTerm) || searchTerm.includes(idLower)) {
                similarity.matchType = 'partial';
                similarMatches.push(similarity);
            } else if (idLower === searchTerm) {  // Match case-insensitive esatto
                similarity.matchType = 'exact-case-insensitive';
                similarMatches.push(similarity);
            }
        }

        // Logga le corrispondenze simili trovate
        if (similarMatches.length > 0) {
            console.log('[EPG] Trovate corrispondenze simili:', 
                similarMatches.map(m => 
                    `\n- ID: "${m.id}" (${m.matchType})`
                    + `\n  Programmi totali: ${m.programCount}`
                    + `\n  Esempio: ${typeof m.sample === 'string' ? m.sample : JSON.stringify(m.sample)}`
                ).join('')
            );
        }

        // Cerca prima con case esatto poi con case insensitive
        let programs = this.programGuconst axios = require('axios');
const { parseStringPromise } = require('xml2js');
const zlib = require('zlib');
const { promisify } = require('util');
const gunzip = promisify(zlib.gunzip);
const cron = require('node-cron');

class EPGManager {
    constructor() {
        this.epgData = null;
        this.programGuide = new Map();
        this.lastUpdate = null;
        this.isUpdating = false;
        this.CHUNK_SIZE = 10000;
        this.CHUNK_DELAY = 60000; // 1 minuto
    }

    // Funzione helper per parsare le date EPG
    parseEPGDate(dateString) {
        if (!dateString) return null;
        try {
            // Formato: "20250113193000 +0200"
            const year = dateString.substring(0, 4);
            const month = dateString.substring(4, 6);
            const day = dateString.substring(6, 8);
            const hour = dateString.substring(8, 10);
            const minute = dateString.substring(10, 12);
            const second = dateString.substring(12, 14);
            const timezone = dateString.substring(15);

            // Costruisci la data in formato ISO
            const isoString = `${year}-${month}-${day}T${hour}:${minute}:${second}${timezone.replace('', ':').substring(0,3)}:${timezone.substring(3)}`;
            return new Date(isoString);
        } catch (error) {
            console.log(`[EPG] Errore parsing data: ${dateString}`, error.message);
            return null;
        }
    }

    async initializeEPG(url) {
        console.log('Inizializzazione EPG...');
        
        // Pianifica l'aggiornamento alle 3 del mattino
        cron.schedule('0 3 * * *', () => {
            console.log('Avvio aggiornamento EPG pianificato');
            this.startEPGUpdate(url);
        });

        // Esegui immediatamente il primo aggiornamento solo se non ci sono dati
        if (!this.programGuide.size) {
            console.log('Primo caricamento EPG...');
            await this.startEPGUpdate(url);
        } else {
            console.log('EPG già caricato, skip primo caricamento');
        }
    }

    async startEPGUpdate(url) {
        if (this.isUpdating) {
            console.log('Aggiornamento EPG già in corso, skip...');
            return;
        }

        try {
            this.isUpdating = true;
            console.log('Scaricamento EPG da:', url);
            
            const response = await axios.get(url, { responseType: 'arraybuffer' });
            let xmlString;

            // Prova a decomprimere come gzip
            try {
                const decompressed = await gunzip(response.data);
                xmlString = decompressed.toString();
            } catch (gzipError) {
                // Se fallisce, assume che sia già un XML non compresso
                console.log('File non compresso in gzip, processamento diretto...');
                xmlString = response.data.toString();
            }

            // Parsa l'XML
            const xmlData = await parseStringPromise(xmlString);
            
            // Reset della guida programmi
            this.programGuide.clear();
            
            // Avvia il processamento progressivo
            await this.processEPGInChunks(xmlData);
            
        } catch (error) {
            console.error('Errore nell\'aggiornamento EPG:', error);
            this.isUpdating = false;
        }
    }

    async processEPGInChunks(data) {
        if (!data.tv || !data.tv.programme) {
            console.log('Nessun dato EPG trovato');
            this.isUpdating = false;
            return;
        }

        const programmes = data.tv.programme;
        const totalChunks = Math.ceil(programmes.length / this.CHUNK_SIZE);
        
        // Creiamo una mappa case-insensitive
        const caseInsensitiveGuide = new Map();
        console.log(`\nInizio processamento EPG: ${programmes.length} programmi totali`);
        console.log(`Formato programmi EPG (primi 3):`);
        programmes.slice(0, 3).forEach(p => {
            console.log('Channel:', p.$.channel, 'Title:', JSON.stringify(p.title));
        });

        for (let i = 0; i < programmes.length; i += this.CHUNK_SIZE) {
            const chunk = programmes.slice(i, i + this.CHUNK_SIZE);
            const chunkNumber = Math.floor(i / this.CHUNK_SIZE) + 1;
            
            console.log(`\nProcessamento chunk ${chunkNumber}/${totalChunks}...`);
            
            for (const programme of chunk) {
                const channelId = programme.$.channel.toLowerCase(); // Converti in minuscolo
                if (!caseInsensitiveGuide.has(channelId)) {
                    caseInsensitiveGuide.set(channelId, {
                        originalId: programme.$.channel,
                        programs: []
                    });
                }

                const programData = {
                    start: this.parseEPGDate(programme.$.start),
                    stop: this.parseEPGDate(programme.$.stop),
                    title: programme.title?.[0]?._
                           || programme.title?.[0]?.$?.text 
                           || programme.title?.[0] 
                           || 'Nessun titolo',
                    description: programme.desc?.[0]?._
                                || programme.desc?.[0]?.$?.text 
                                || programme.desc?.[0] 
                                || '',
                    category: programme.category?.[0]?._ 
                             || programme.category?.[0]?.$?.text 
                             || programme.category?.[0] 
                             || ''
                };

                // Verifica che le date siano valide prima di aggiungere il programma
                if (programData.start && programData.stop && !isNaN(programData.start) && !isNaN(programData.stop)) {
                    caseInsensitiveGuide.get(channelId).programs.push(programData);
                }
            }
        }

        // Converti la mappa case-insensitive in programGuide
        this.programGuide.clear();
        for (const [lowerId, data] of caseInsensitiveGuide.entries()) {
            this.programGuide.set(data.originalId, 
                data.programs.sort((a, b) => a.start - b.start)
            );
        }

        // Log riepilogativo
        console.log('\n=== Riepilogo Canali EPG ===');
        console.log('Totale canali trovati:', this.programGuide.size);
        console.log('Primi 10 canali con conteggio programmi:');
        let count = 0;
        for (const [channel, programs] of this.programGuide.entries()) {
            if (count++ < 10) {
                console.log(`- ${channel}: ${programs.length} programmi`);
            }
        }
        console.log('===========================\n');

        this.lastUpdate = Date.now();
        this.isUpdating = false;
        console.log('Aggiornamento EPG completato con successo'); chunks di ${this.CHUNK_SIZE} programmi`);

        // Log dei primi programmi per debug
        console.log('=== Debug primi 2 programmi dall\'EPG ===');
        console.log(JSON.stringify(programmes.slice(0, 2), null, 2));
        console.log('=====================================');

        // Traccia canali e conteggi
        const channelCounts = new Map();

        for (let i = 0; i < programmes.length; i += this.CHUNK_SIZE) {
            const chunk = programmes.slice(i, i + this.CHUNK_SIZE);
            const chunkNumber = Math.floor(i / this.CHUNK_SIZE) + 1;
            
            console.log(`Processamento chunk ${chunkNumber}/${totalChunks}...`);
            
            for (const programme of chunk) {
                const channelId = programme.$.channel;
                if (!this.programGuide.has(channelId)) {
                    this.programGuide.set(channelId, []);
                    channelCounts.set(channelId, 0);
                }

                const programData = {
                    start: this.parseEPGDate(programme.$.start),
                    stop: this.parseEPGDate(programme.$.stop),
                    title: programme.title?.[0]?._
                           || programme.title?.[0]?.$?.text 
                           || programme.title?.[0] 
                           || 'Nessun titolo',
                    description: programme.desc?.[0]?._
                                || programme.desc?.[0]?.$?.text 
                                || programme.desc?.[0] 
                                || '',
                    category: programme.category?.[0]?._ 
                             || programme.category?.[0]?.$?.text 
                             || programme.category?.[0] 
                             || ''
                };

                // Verifica che le date siano valide prima di aggiungere il programma
                if (programData.start && programData.stop && !isNaN(programData.start) && !isNaN(programData.stop)) {
                    this.programGuide.get(channelId).push(programData);
                    channelCounts.set(channelId, channelCounts.get(channelId) + 1);
                }
            }

            // Attendi prima del prossimo chunk
            await new Promise(resolve => setTimeout(resolve, this.CHUNK_DELAY));
            console.log(`Completato chunk ${chunkNumber}/${totalChunks}`);
        }

        // Ordina i programmi per ogni canale
        for (const [channelId, programs] of this.programGuide.entries()) {
            this.programGuide.set(
                channelId, 
                programs.sort((a, b) => a.start - b.start)
            );
        }

        // Log riepilogativo
        console.log('\n=== Riepilogo Canali EPG ===');
        console.log('Totale canali trovati:', channelCounts.size);
        console.log('Dettaglio programmi per canale:');
        for (const [channel, count] of channelCounts.entries()) {
            console.log(`- ${channel}: ${count} programmi`);
        }
        console.log('===========================\n');

        this.lastUpdate = Date.now();
        this.isUpdating = false;
        console.log('Aggiornamento EPG completato con successo');
    }

    getCurrentProgram(channelId) {
        console.log('[EPG] Ricerca programma corrente per ID:', channelId);
        
        // Cerca corrispondenze simili per debug
        const similarMatches = [];
        const searchTerm = channelId.toLowerCase();
        
        for (const [id, programs] of this.programGuide.entries()) {
            // Verifica diverse possibili somiglianze
            const idLower = id.toLowerCase();
            const similarity = {
                id: id,
                matchType: null,
                programCount: programs.length,
                sample: programs[0] ? {
                    title: programs[0].title,
                    start: programs[0].start,
                    stop: programs[0].stop
                } : 'Nessun programma'
            };

            if (idLower.includes(searchTerm) || searchTerm.includes(idLower)) {
                similarity.matchType = 'partial';
                similarMatches.push(similarity);
            } else if (idLower.replace(/[^a-z0-9]/g, '') === searchTerm.replace(/[^a-z0-9]/g, '')) {
                similarity.matchType = 'normalized';
                similarMatches.push(similarity);
            }
        }

        // Logga le corrispondenze simili trovate
        if (similarMatches.length > 0) {
            console.log('[EPG] Trovate corrispondenze simili:', 
                similarMatches.map(m => 
                    `\n- ID: "${m.id}" (${m.matchType})`
                    + `\n  Programmi totali: ${m.programCount}`
                    + `\n  Esempio: ${typeof m.sample === 'string' ? m.sample : JSON.stringify(m.sample)}`
                ).join('')
            );
        }

        // Debug info sulla ricerca esatta
        const programs = this.programGuide.get(channelId);
        console.log(`[EPG] Dati per match esatto "${channelId}":`,
            programs ? `${programs.length} programmi trovati` : 'Nessun programma');
        
        if (!programs || programs.length === 0) {
            console.log('[EPG] Nessun programma trovato per ID esatto:', channelId);
            return null;
        }

        // Trova il programma corrente
        const now = new Date();
        const nowUTC = new Date(now.toISOString());
        const validPrograms = programs.filter(p => 
            p.start && p.stop && !isNaN(p.start) && !isNaN(p.stop)
        );
        
        console.log(`[EPG] Programmi validi per ${channelId}: ${validPrograms.length}/${programs.length}`);
        
        const currentProgram = validPrograms.find(program => 
            program.start <= nowUTC && program.stop >= nowUTC
        );

        if (currentProgram) {
            console.log('[EPG] Programma corrente trovato:', JSON.stringify(currentProgram, null, 2));
            return currentProgram;
        }

        console.log('[EPG] Nessun programma corrente per ID:', channelId, 
            '(Primo programma disponibile:', JSON.stringify(programs[0], null, 2), ')');
        return null;
    }

    getUpcomingPrograms(channelId, limit = 5) {
        console.log('[EPG] Ricerca programmi futuri per ID:', channelId);
        
        // Debug info sulla ricerca esatta
        const programs = this.programGuide.get(channelId);
        console.log(`[EPG] Dati per match esatto "${channelId}":`,
            programs ? `${programs.length} programmi trovati` : 'Nessun programma');
        
        if (!programs || programs.length === 0) {
            console.log('[EPG] Nessun programma trovato per ID:', channelId);
            return [];
        }

        // Filtra i programmi futuri
        const now = new Date();
        const validPrograms = programs.filter(p => 
            p.start && p.stop && !isNaN(p.start) && !isNaN(p.stop)
        );
        
        console.log(`[EPG] Programmi validi per ${channelId}: ${validPrograms.length}/${programs.length}`);
        
        const upcomingPrograms = validPrograms
            .filter(program => program.start >= now)
            .slice(0, limit);

        if (upcomingPrograms.length > 0) {
            console.log('[EPG] Programmi futuri trovati:', JSON.stringify(upcomingPrograms, null, 2));
            return upcomingPrograms;
        }

        console.log('[EPG] Nessun programma futuro per ID:', channelId);
        return [];
    }

    needsUpdate() {
        if (!this.lastUpdate) return true;
        // Controlla se sono passate più di 24 ore dall'ultimo aggiornamento
        const hoursSinceUpdate = (Date.now() - this.lastUpdate) / (1000 * 60 * 60);
        return hoursSinceUpdate >= 24;
    }

    isEPGAvailable() {
        return this.programGuide.size > 0 && !this.isUpdating;
    }

    getStatus() {
        return {
            isUpdating: this.isUpdating,
            lastUpdate: this.lastUpdate ? new Date(this.lastUpdate).toLocaleString() : 'Mai',
            channelsCount: this.programGuide.size,
            programsCount: Array.from(this.programGuide.values()).reduce((acc, progs) => acc + progs.length, 0)
        };
    }
}

module.exports = new EPGManager();
